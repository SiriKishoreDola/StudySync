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
