"use client";

import { useState, useEffect } from "react";
import { createClient as getSupabase } from "@/lib/supabase/client";
import { useUserId } from "@/components/auth-user-provider";

export type ItemType = "assignment" | "quiz" | "exam" | "project" | "reading";

export type Item = {
  id: string;
  type: ItemType;
  title: string;
  date: string;
  weight: number;
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

export const TYPES: Record<ItemType, { one: string; many: string; color: string }> = {
  assignment: { one: "Assignment", many: "Assignments", color: "var(--ss-mauve)" },
  quiz: { one: "Quiz", many: "Quizzes", color: "var(--ss-amber)" },
  exam: { one: "Exam", many: "Exams", color: "var(--ss-ink)" },
  project: { one: "Project", many: "Projects", color: "var(--ss-sage)" },
  reading: { one: "Reading", many: "Readings", color: "var(--ss-brown)" },
};

export const COURSE_COLORS = ["var(--ss-mauve)", "var(--ss-sage)", "var(--ss-amber)", "var(--ss-brown)"];

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

const round = (n: number) => Math.round(n * 100) / 100;
export const totalWeight = (c: CourseData) => round(c.items.reduce((a, i) => a + i.weight, 0));
export const doneWeight = (c: CourseData) =>
  Math.round(c.items.filter((i) => i.done).reduce((a, i) => a + i.weight, 0));

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
];

const KEY = "studysync:courses";
const EVENT = "studysync:courses-changed";

function readRaw(userId: string): string {
  try {
    return localStorage.getItem(`${KEY}:${userId}`) ?? "";
  } catch {
    return "";
  }
}

// Explicit types for database rows
interface DbRequirement {
  id?: string;
  title?: string;
  type?: ItemType;
  due_date?: string;
  weight?: number;
}

interface DbCourse {
  id: string;
  code?: string;
  name: string;
  instructor?: string;
  semester?: string;
  requirements?: DbRequirement[];
}

export function useCourses(): CourseData[] | undefined {
  const userId = useUserId();
  const [courses, setCourses] = useState<CourseData[] | undefined>(undefined);

  useEffect(() => {
    async function fetchUserCourses() {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        
        let combinedCourses: CourseData[] = [];

        // 1. Get local storage courses first
        const raw = readRaw(userId);
        if (raw) {
          try {
            combinedCourses = JSON.parse(raw);
          } catch {
            combinedCourses = [];
          }
        }

        // 2. If logged in, fetch from Supabase and merge
        if (session?.user?.id) {
          const { data: dbCourses, error: courseError } = await supabase
            .from('courses')
            .select(`
              id,
              code,
              name,
              instructor,
              semester,
              requirements (
                id,
                title,
                type,
                due_date,
                weight
              )
            `)
            .eq('user_id', session.user.id);

          if (!courseError && dbCourses && dbCourses.length > 0) {
            const formattedDb: CourseData[] = (dbCourses as DbCourse[]).map((c) => ({
              id: c.id,
              code: c.code || 'COURSE',
              name: c.name,
              instructor: c.instructor || 'TBA',
              semester: c.semester || 'Current Semester',
              items: (c.requirements || []).map((r, idx) => ({
                id: r.id || `item_${idx}`,
                type: r.type || 'assignment',
                title: r.title || 'Untitled Requirement',
                date: r.due_date ? r.due_date.split('T')[0] : '',
                weight: r.weight ?? 0,
                done: false,
              })),
            }));

            // Merge DB courses with local storage ones
            combinedCourses = [...formattedDb, ...combinedCourses];
          }
        }

        if (combinedCourses.length === 0) {
          combinedCourses = SAMPLE_COURSES;
        }

        // 3. Deduplicate by course code or title so duplicates never appear
        const seenCodes = new Set<string>();
        const uniqueCourses = combinedCourses.filter((course) => {
          const codeKey = (course.code || course.name).trim().toLowerCase();
          if (seenCodes.has(codeKey)) {
            return false;
          }
          seenCodes.add(codeKey);
          return true;
        });

        setCourses(uniqueCourses);
        
        // Keep localStorage clean with only deduplicated courses
        try {
          localStorage.setItem(`${KEY}:${userId}`, JSON.stringify(uniqueCourses));
        } catch {
          // ignore
        }
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setCourses(SAMPLE_COURSES);
      }
    }

    fetchUserCourses();

    const handleUpdate = () => fetchUserCourses();
    window.addEventListener(EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [userId]);

  return courses;
}

export function saveCoursesLocally(next: CourseData[], userId: string) {
  try {
    localStorage.setItem(`${KEY}:${userId}`, JSON.stringify(next));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(EVENT));
}

export type ReviewCourse = {
  code: string;
  name: string;
  instructor: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
};

export type ReviewItem = {
  type: ItemType;
  title: string;
  date: string;
  weight: number | null;
};

let isSubmittingCourse = false;

export async function uploadAndExtractSyllabus(file: File, userId: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (userId) {
    formData.append('userId', userId);
  }

  const response = await fetch('/api/extract', {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json()) as {
    syllabusId?: string;
    extractedData?: unknown;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || 'Extraction failed');
  }

  return data;
}

export async function addCourse(
  course: ReviewCourse,
  items: ReviewItem[],
  userId: string,
  syllabusId?: string | null
): Promise<string | null> {
  if (isSubmittingCourse) {
    return null;
  }

  isSubmittingCourse = true;
  try {
    let activeUserId = userId;
    const { data: { session } } = await getSupabase().auth.getSession();
    if (!session?.user?.id) throw new Error("Sign in before saving a course.");
    if (session.user.id !== userId) throw new Error("Account changed. Reload before saving.");
    activeUserId = session.user.id;

    const termValue = course.semester || 'Current Semester';
    const formattedRequirements = Array.isArray(items) ? items.map((i, idx) => ({
      id: `item_local_${Date.now()}_${idx}`,
      title: i.title || 'Untitled Requirement',         
      type: i.type || 'assignment',         
      date: i.date || '',
      weight: i.weight ?? 0,
      done: false,
    })) : [];

    const generatedCourseId = `course_${Date.now()}`;

    const newCourseData: CourseData = {
      id: generatedCourseId,
      code: course.code || 'COURSE',
      name: course.name,
      instructor: course.instructor || 'TBA',
      semester: termValue,
      items: formattedRequirements,
    };

    const existingRaw = readRaw(userId);
    const existingCourses: CourseData[] = existingRaw ? JSON.parse(existingRaw) : [];
    saveCoursesLocally([newCourseData, ...existingCourses], activeUserId);

    const payload = {
      userId: activeUserId,
      syllabusId: syllabusId ?? null,
      title: course.name,
      code: course.code,
      term: termValue,
      semester: termValue,
      instructor: course.instructor,
      requirements: items.map((i) => ({
        title: i.title || 'Untitled Requirement',         
        category: i.type || 'assignment',         
        due_date: i.date ? `${i.date}T00:00:00Z` : null,
        weight: i.weight ?? 0,
      })),
    };

    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.courseId) {
      console.warn("Supabase background save warning:", data.error || data);
    } else {
      newCourseData.id = data.courseId;
      saveCoursesLocally([newCourseData, ...existingCourses], activeUserId);
    }

    return generatedCourseId;
  } finally {
    isSubmittingCourse = false;
  }
}

export async function saveCourses(courses: CourseData[], userId: string): Promise<void> {
  saveCoursesLocally(courses, userId);
}