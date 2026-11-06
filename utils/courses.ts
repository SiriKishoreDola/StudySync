"use client";

// Shared types, helpers and the data source for the My Courses pages.
import { useMemo, useSyncExternalStore } from "react";

export type ItemType = "assignment" | "quiz" | "exam" | "project" | "reading";

export type Item = {
  id: string;
  type: ItemType;
  title: string;
  date: string; // "YYYY-MM-DD", or "" when the date is TBA
  weight: number; // percent of the final grade
  done: boolean;
};

export type CourseData = {
  id: string;
  code: string;
  name: string;
  instructor: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
  items: Item[];
};

// Display names and colors for each type.
export const TYPES: Record<ItemType, { one: string; many: string; color: string }> = {
  assignment: { one: "Assignment", many: "Assignments", color: "var(--mauve)" },
  quiz: { one: "Quiz", many: "Quizzes", color: "var(--amber)" },
  exam: { one: "Exam", many: "Exams", color: "var(--ink)" },
  project: { one: "Project", many: "Projects", color: "var(--sage)" },
  reading: { one: "Reading", many: "Readings", color: "var(--brown)" },
};

// Each course gets a color by its position in the list.
export const COURSE_COLORS = ["var(--mauve)", "var(--sage)", "var(--amber)", "var(--brown)"];

// ---------- Date helpers ----------
export const DAY = 864e5;
export const parseDate = (s: string) => new Date(`${s}T00:00:00`);

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const fmt = (s: string) =>
  s ? parseDate(s).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBA";

export function relative(s: string, today: Date): string {
  if (!s) return "date TBA";
  const n = Math.round((parseDate(s).getTime() - today.getTime()) / DAY);
  if (n === 0) return "today";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

// ---------- Grade helpers ----------
const round = (n: number) => Math.round(n * 100) / 100;
export const totalWeight = (c: CourseData) => round(c.items.reduce((a, i) => a + i.weight, 0));
export const doneWeight = (c: CourseData) =>
  Math.round(c.items.filter((i) => i.done).reduce((a, i) => a + i.weight, 0));

// ---------- Sample data (used until the database route is ready) ----------
const it = (id: string, type: ItemType, title: string, date: string, weight: number, done = false): Item => ({
  id, type, title, date, weight, done,
});

export const SAMPLE_COURSES: CourseData[] = [
  {
    id: "psyc101", code: "PSYC 101", name: "Introduction to Psychology", instructor: "Dr. Maya Chen",
    items: [
      it("p1", "assignment", "Research proposal", "2026-10-14", 8, true),
      it("p2", "exam", "Midterm exam", "2026-10-16", 15, true),
      it("p3", "project", "Group presentation", "2026-10-21", 10, true),
      it("p4", "assignment", "Data worksheet", "2026-10-28", 4),
      it("p5", "assignment", "Peer review", "2026-11-12", 4),
      it("p6", "assignment", "Final paper", "2026-12-05", 11),
      it("p7", "exam", "Final exam", "2026-12-12", 25),
      it("p8", "assignment", "Reflections (3)", "2026-09-26", 23, true),
    ],
  },
  {
    id: "stat201", code: "STAT 201", name: "Applied Statistics", instructor: "Prof. Daniel Ruiz",
    items: [
      it("s1", "quiz", "Quiz 1", "2026-09-15", 4, true),
      it("s2", "assignment", "Regression set", "2026-10-17", 8, true),
      it("s3", "exam", "Midterm exam", "2026-10-29", 24),
      it("s4", "quiz", "Quiz 3", "2026-11-03", 4),
      it("s5", "assignment", "Data project", "2026-11-17", 10),
      it("s6", "exam", "Final exam", "2026-12-10", 34),
      it("s7", "assignment", "Problem sets (rest)", "2026-11-24", 16),
    ],
  },
  {
    id: "bio108", code: "BIO 108", name: "Principles of Biology", instructor: "Dr. Samuel Ortiz",
    items: [
      it("b1", "assignment", "Lab 2", "2026-10-15", 5, true),
      it("b2", "exam", "Midterm exam", "2026-10-29", 25),
      it("b3", "assignment", "Lab 3", "2026-11-05", 5),
      it("b4", "project", "Poster", "2026-11-19", 10),
      it("b5", "exam", "Final exam", "2026-12-14", 35),
      it("b6", "quiz", "Quizzes (2)", "2026-11-12", 10),
      it("b7", "assignment", "Labs 1 and 4", "2026-12-01", 10),
    ],
  },
];

// ---------- Data source ----------
// For now the courses live in this browser's localStorage, seeded from SAMPLE_COURSES.
// When the database route is ready, replace useCourses() and saveCourses() with
// calls to your /api/courses route. The pages won't need to change.
const KEY = "studysync:courses";
const EVENT = "studysync:courses-changed";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return ""; // storage blocked: fall back to the sample
  }
}

// Returns undefined on the server and during the first render, then the courses.
export function useCourses(): CourseData[] | undefined {
  const raw = useSyncExternalStore(subscribe, readRaw, () => undefined);
  return useMemo(() => {
    if (raw === undefined) return undefined;
    try {
      return raw ? (JSON.parse(raw) as CourseData[]) : SAMPLE_COURSES;
    } catch {
      return SAMPLE_COURSES;
    }
  }, [raw]);
}

export function saveCourses(next: CourseData[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore: storage blocked or full
  }
  window.dispatchEvent(new Event(EVENT)); // tells every open page to refresh
}

// Reads what's saved, or [] if nothing has been saved yet (the demo courses don't count).
function readStored(): CourseData[]
{
    try
    {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as CourseData[]) : [];
    }catch{
        return[];
    }
}

type ReviewCourse = 
{
    code: string;
    name: string;
    instructor: string;
    semester: string;
    startDate: string;
    endDate: string;
}

type ReviewItem = 
{   type: ItemType; 
    title: string; 
    date: string; 
    weight: number | null 
};

// Saves a confirmed course and returns its id, so we can open its page.
export function addCourse(course: ReviewCourse, items: ReviewItem[]): string {
  const slug = course.code.toLowerCase().replace(/[^a-z0-9]+/g, "") || "course";
  const id = `${slug}-${Date.now().toString(36)}`; // unique, and safe to use in a URL

  const added: CourseData = {
    ...course,
    id,
    items: items.map((i) => ({
      id: crypto.randomUUID(),
      type: i.type,
      title: i.title,
      date: i.date,
      weight: i.weight ?? 0, // readings have no weight
      done: false,
    })),
  };
  // The first real course replaces the demo ones, since readStored() starts empty.
  saveCourses([...readStored(), added]);
  return id;
}