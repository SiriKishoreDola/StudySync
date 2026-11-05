export type Assignment = {
  id: number;
  course: string;
  name: string;
  dueDate: string; // YYYY-MM-DD
  weight: number;
  type: "assignment" | "quiz" | "exam";
  completed: boolean;
};

// Temporary fake database. Resets when the dev server restarts.
// Replaced by Supabase later.
const initial: { assignments: Assignment[] } = {
  assignments: [
    { id: 1, course: "Research Methods", name: "Research proposal draft", dueDate: "2026-10-16", weight: 10, type: "assignment", completed: false },
    { id: 2, course: "Linear Algebra", name: "Problem set 06", dueDate: "2026-10-16", weight: 5, type: "assignment", completed: false },
    { id: 3, course: "Modern Literature", name: "Reading response", dueDate: "2026-10-19", weight: 5, type: "assignment", completed: false },
    { id: 4, course: "Cognitive Psychology", name: "Midterm review quiz", dueDate: "2026-10-20", weight: 10, type: "quiz", completed: false },
    { id: 5, course: "General Chemistry", name: "Lab report: Kinetics", dueDate: "2026-10-21", weight: 15, type: "assignment", completed: false },
    { id: 6, course: "Linear Algebra", name: "Midterm exam", dueDate: "2026-10-23", weight: 25, type: "exam", completed: false },
    { id: 7, course: "Linear Algebra", name: "Problem set 05", dueDate: "2026-10-12", weight: 5, type: "assignment", completed: true },
    { id: 8, course: "General Chemistry", name: "Pre-lab questions", dueDate: "2026-10-09", weight: 5, type: "assignment", completed: true },
  ],
};

// Keep one shared copy so every API route sees the same data.
const g = globalThis as unknown as { __db?: typeof initial };
export const db = (g.__db ??= initial);