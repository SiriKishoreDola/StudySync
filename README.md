# StudySync

AI-powered academic planner that combines all your syllabi into one timeline and flags overlapping deadlines before they become a problem.

StudySync is a syllabus-based academic planning tool that helps students organize deadlines and identify periods of high academic workload. Students currently have to review multiple syllabi and manually transfer deadlines into their calendars or planners, which can lead to missed deadlines, incorrect entries, and difficulty recognizing overlaps between courses. StudySync automates this process by extracting deadlines from uploaded syllabi, organizing them into a single unified timeline, and flagging overlapping deadlines so students can plan ahead.

## Key Features
- **Syllabus upload** — Upload syllabi from multiple courses (PDF)
- **AI deadline extraction** — Automatically extract assignments, exams, projects, and other deadlines
- **Unified timeline** — Combine all deadlines into one visual timeline across every course
- **Overlap detection** — Identify periods where multiple deadlines overlap, so students can spot crunch weeks early
- **AI planning assistant** — Get AI-assisted recommendations on what to prioritize and how to prepare

## Tech Stack
- **Frontend & Backend:** Next.js (API routes)
- **Auth:** NextAuth
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **AI:** Gemini API (syllabus extraction + planning assistant)
- **PDF Processing:** PDF parsing library (converts uploaded syllabi to text for extraction)
- **Data Visualization:** Recharts
- **Deployment:** Vercel

## Database (Supabase)
Schema, row-level security, the private `syllabi` storage bucket and the `save_course()` function live in `supabase/migrations/`. The Supabase CLI is a dev dependency, so no global install is needed.

- **First time (hosted project):** `npx supabase login`, then `npx supabase link --project-ref <ref>` (ref is the subdomain of `NEXT_PUBLIC_SUPABASE_URL`; asks for the database password).
- **Apply migrations to the linked project:** `npm run db:push` (shows the pending migrations and asks to confirm; add `-- --dry-run` to preview only)
- **Local database (needs Docker):** `npx supabase start`, then `npx supabase db reset` to rebuild it from the migrations.
- **Test security rules locally:** `npm run test:db`
- **Regenerate TypeScript types after a schema change:** `npm run db:types`

New schema changes go in a new file: `npx supabase migration new <name>`. Don't edit a migration that has already been pushed.
