// Checks and cleans whatever the AI sends back, so a bad answer can't break the review page.
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const CATEGORIES = ["assignment", "exam", "quiz", "project", "reading"] as const;

// Thrown when the AI finds nothing usable, e.g. the file isn't a syllabus.
export class NotASyllabusError extends Error {
   name = "NotASyllabusError";
}

// Keeps a date only if it's a real calendar date written as YYYY-MM-DD, otherwise "".
// (Round-tripping through Date catches impossible dates like 2026-02-31.)
function cleanDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const real =
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d;
  return real ? value : "";
}

// A missing or null text field becomes "", and the review page shows "Not found".
const text = z
  .string()
  .nullish()
  .transform((s) => (s ?? "").trim());

const date = z
  .string()
  .nullish()
  .transform((s) => cleanDate((s ?? "").trim()));

const courseSchema = z.object({
  code: text,
  name: text,
  instructor: text,
  semester: text,
  startDate: date,
  endDate: date,
});

const requirementSchema = z.object({
  type: z.enum(CATEGORIES),
  title: z.string().trim().min(1),
  date, // a bad date becomes "" so the user is asked to fix it on the review page
  // A missing or out-of-range weight becomes null instead of failing the whole item.
  weight: z
    .number()
    .min(0)
    .max(100)
    .nullish()
    .catch(null)
    .transform((w) => w ?? null),
});

// Takes the raw JSON text from Gemini and returns clean data in the shape
// the review page expects: { course, requirements }.
export function parseExtraction(raw: string) {
  const json = JSON.parse(raw) as { course?: unknown; requirements?: unknown };

  const course = courseSchema.parse(json.course ?? {});
  const list = Array.isArray(json.requirements) ? json.requirements : [];

  const requirements = list
    .flatMap((item) => {
      // Check each item on its own: one bad item is dropped, the rest are kept.
      const parsed = requirementSchema.safeParse(item);
      return parsed.success ? [{ id: randomUUID(), ...parsed.data }] : [];
    })
    // Oldest first; items with no date go to the end.
    .sort((a, b) =>
      (a.date || "9999-99-99").localeCompare(b.date || "9999-99-99")
    );

  if (!course.code && !course.name && requirements.length === 0) {
    throw new NotASyllabusError("No course details or requirements found.");
  }

  return { course, requirements };
}