-- StudySync schema: syllabi -> courses -> requirements, each row owned by one user.
-- user_id defaults to auth.uid(), so API routes never send it.

-- ---------- Tables ----------

create table public.syllabi (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  file_path  text,                 -- "<user_id>/<syllabus_id>.<ext>" in the syllabi bucket
  file_name  text,                 -- original name, for display
  status     text not null default 'pending' check (status in ('pending', 'extracted', 'failed')),
  error      text,                 -- why extraction failed
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  syllabus_id uuid unique,          -- one course per syllabus; confirming again replaces it
  code        text not null default '',
  name        text not null default '',
  instructor  text not null default '',
  semester    text not null default '',
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  -- The syllabus must belong to the same user.
  foreign key (syllabus_id, user_id) references public.syllabi (id, user_id) on delete set null (syllabus_id)
);

create table public.requirements (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  course_id  uuid not null,
  -- Keep in sync with CATEGORIES in utils/schema.ts (checked by tests/categories-sync.test.mjs).
  type       text not null check (type in ('assignment', 'exam', 'quiz', 'project', 'reading')),
  title      text not null check (btrim(title) <> ''),
  due_date   date,                  -- null = TBA
  weight     numeric(5, 2) check (weight between 0 and 100), -- null = unknown
  completed  boolean not null default false,
  created_at timestamptz not null default now(),
  -- The course must belong to the same user.
  foreign key (course_id, user_id) references public.courses (id, user_id) on delete cascade
);

create index on public.syllabi (user_id);
create index on public.courses (user_id);
create index on public.requirements (course_id, user_id);
create index on public.requirements (user_id, due_date);

-- ---------- Row-level security: each signed-in user sees only their own rows ----------

alter table public.syllabi      enable row level security;
alter table public.courses      enable row level security;
alter table public.requirements enable row level security;

create policy "own rows" on public.syllabi for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.courses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.requirements for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Signed-out requests get "permission denied" instead of an empty list.
revoke all on public.syllabi, public.courses, public.requirements from anon;

-- ---------- Storage: private bucket, one folder per user ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'syllabi', 'syllabi', false, 10485760, -- 10 MB
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

create policy "syllabi: own folder" on storage.objects for all to authenticated
  using (bucket_id = 'syllabi' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'syllabi' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------- save_course: saves a course and its requirements together ----------
-- Takes parseExtraction() output as-is: p_course = { code, name, instructor, semester, startDate, endDate },
-- p_requirements = [{ type, title, date, weight }]. "" dates become null.
-- Confirming the same syllabus again keeps the course id and replaces its details and requirements.
-- Runs as the caller (security invoker), so RLS applies; it is one transaction, so all or nothing.

create function public.save_course(p_course jsonb, p_requirements jsonb, p_syllabus_id uuid default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_course_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  insert into public.courses as c (syllabus_id, code, name, instructor, semester, start_date, end_date)
  values (
    p_syllabus_id,
    coalesce(p_course ->> 'code', ''),
    coalesce(p_course ->> 'name', ''),
    coalesce(p_course ->> 'instructor', ''),
    coalesce(p_course ->> 'semester', ''),
    nullif(p_course ->> 'startDate', '')::date,
    nullif(p_course ->> 'endDate', '')::date
  )
  on conflict (syllabus_id) do update set
    code = excluded.code, name = excluded.name, instructor = excluded.instructor,
    semester = excluded.semester, start_date = excluded.start_date, end_date = excluded.end_date
  returning c.id into v_course_id;

  delete from public.requirements where course_id = v_course_id;

  insert into public.requirements (course_id, type, title, due_date, weight)
  select v_course_id, r.type, btrim(r.title), nullif(r.date, '')::date, r.weight
  from jsonb_to_recordset(coalesce(p_requirements, '[]'::jsonb))
    as r(type text, title text, date text, weight numeric);

  return v_course_id;
end;
$$;

revoke execute on function public.save_course(jsonb, jsonb, uuid) from public, anon;
grant execute on function public.save_course(jsonb, jsonb, uuid) to authenticated;
