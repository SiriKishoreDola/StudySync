# StudySync

AI-powered academic planner that combines all your syllabi into one timeline and flags workload clusters before they become a problem.

StudySync is a syllabus-based academic planning tool that helps students organize academic requirements and identify periods of high academic workload. Students currently have to review multiple syllabi and manually transfer assignments, exams, and other requirements into their calendars or planners, which can lead to missed deadlines, incorrect entries, and difficulty recognizing when multiple courses create demanding periods. StudySync automates this process by extracting requirements from uploaded syllabi, organizing them into a single unified timeline, and flagging workload clusters so students can plan ahead.

## Key Features
- **Syllabus upload** — Upload syllabi from multiple courses (PDF)
- **AI requirement extraction & verification** — Automatically extract assignments, exams, projects, and other academic requirements, with a review step to confirm or correct them
- **Unified semester timeline** — Combine all verified requirements into one visual timeline across every course
- **Workload cluster detection** — Identify periods where multiple requirements occur close together, so students can spot demanding weeks early
- **AI planning assistant** — Get context-aware recommendations on what to prioritize and how to prepare

## Tech Stack
- **Frontend & Backend:** Next.js (API routes)
- **Auth:** NextAuth
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **AI:** Gemini API (syllabus extraction + planning assistant)
- **PDF Processing:** PDF parsing library (converts uploaded syllabi to text for extraction)
- **Data Visualization:** Recharts
- **Deployment:** Vercel
