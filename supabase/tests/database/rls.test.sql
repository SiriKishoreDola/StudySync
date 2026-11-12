-- Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

-- Two users and a stored file for user A.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local');
insert into public.syllabi (id, user_id, file_path) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-00000000000a/syllabus.pdf');
insert into storage.objects (bucket_id, name) values
  ('syllabi', '00000000-0000-0000-0000-00000000000a/syllabus.pdf');

-- ---------- User A ----------
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a"}';

select lives_ok($$
  select public.save_course(
    '{"code": "CS 101", "name": "Intro", "instructor": "", "semester": "", "startDate": "", "endDate": "2026-12-15"}',
    '[{"type": "exam", "title": "Midterm", "date": "", "weight": null},
      {"type": "quiz", "title": "Quiz 1", "date": "2026-10-01", "weight": 5}]',
    '00000000-0000-0000-0000-0000000000a1')
$$, 'A can save a course');
select is((select count(*)::int from public.requirements), 2, 'requirements saved with the course');
select is((select due_date from public.requirements where title = 'Midterm'), null, '"" date is stored as null');

create temp table first_id on commit drop as select id from public.courses;
select lives_ok($$
  select public.save_course('{"code": "CS 101", "name": "Intro v2"}',
    '[{"type": "project", "title": "Final project", "date": "2026-12-01", "weight": 40}]',
    '00000000-0000-0000-0000-0000000000a1')
$$, 'A can confirm the same syllabus again');
select is((select count(*)::int from public.courses), 1, 'second confirm replaces, not duplicates');
select is((select id from public.courses), (select id from first_id), 'course id is kept');
select is((select count(*)::int from public.requirements), 1, 'old requirements are replaced');

select throws_ok($$
  select public.save_course('{}', '[{"type": "lecture", "title": "x"}]')
$$, '23514', null, 'unknown requirement type is rejected');
select is((select count(*)::int from storage.objects where bucket_id = 'syllabi'), 1, 'A sees own file');

-- ---------- User B ----------
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b"}';

select is((select count(*)::int from public.syllabi) + (select count(*)::int from public.courses)
        + (select count(*)::int from public.requirements), 0, 'B sees none of A''s rows');
select is((select count(*)::int from storage.objects where bucket_id = 'syllabi'), 0, 'B cannot see A''s file');
select throws_ok(format(
  $$insert into public.requirements (course_id, type, title) values (%L, 'exam', 'Sneaky')$$,
  (select id from first_id)), '23503', null, 'B cannot add to A''s course');
select throws_ok($$
  insert into storage.objects (bucket_id, name) values ('syllabi', '00000000-0000-0000-0000-00000000000a/evil.pdf')
$$, '42501', null, 'B cannot upload into A''s folder');

-- ---------- Signed out ----------
reset request.jwt.claims;
set local role anon;

select throws_ok('select * from public.courses', '42501', null, 'anon cannot read tables');
select is((select count(*)::int from storage.objects where bucket_id = 'syllabi'), 0, 'anon cannot see files');
select throws_ok($$select public.save_course('{}', '[]')$$, '42501', null, 'anon cannot call save_course');

select * from finish();
rollback;
