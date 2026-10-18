// Client component: this page reacts to clicks and typing (editing rows, switching tabs).
"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Newsreader } from "next/font/google";
import styles from "./page.module.css";

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-review-serif",
});

// ---------- Data shapes ----------
// These describe the JSON that /api/extract should return (we build that route next).

type Category = "assignment" | "quiz" | "exam" | "project" | "reading";

type Requirement = {
  id: string;
  type: Category;
  title: string;
  date: string; // always "YYYY-MM-DD", which is what <input type="date"> uses
  weight: number | null; // percent of the grade; null for things like readings
};

type Course = {
  code: string;
  name: string;
  instructor: string;
  semester: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
};

type Extraction = {
  fileName?: string;
  course: Course;
  requirements: Requirement[];
};

// The five  tabs. "key" is stored in the data, the other two are display names.
const CATEGORIES: { key: Category; singular: string; plural: string }[] = [
  { key: "assignment", singular: "Assignment", plural: "Assignments" },
  { key: "quiz", singular: "Quiz", plural: "Quizzes" },
  { key: "exam", singular: "Exam", plural: "Exams" },
  { key: "project", singular: "Project", plural: "Projects" },
  { key: "reading", singular: "Reading", plural: "Readings" },
];
// ---------- Sample data ----------
// Shown when nothing has been uploaded yet, so you can build and test this page now.
// Values come from your design. The exam and reading dates are placeholders.
const SAMPLE: Extraction = {
  fileName: "2026.08.Fall.PSYC101.Syllabus.Aug14.v3.pdf",
  course: {
    code: "PSYC 101",
    name: "Introduction to Psychology",
    instructor: "Dr. Maya Chen",
    semester: "Fall 2026",
    startDate: "2026-09-02",
    endDate: "2026-12-14",
  },
  requirements: [
    { id: "a1", type: "assignment", title: "Reflection response 1", date: "2026-09-12", weight: 3 },
    { id: "a2", type: "assignment", title: "Research question", date: "2026-09-19", weight: 3 },
    { id: "a3", type: "assignment", title: "Article analysis", date: "2026-09-26", weight: 4 },
    { id: "a4", type: "assignment", title: "Reflection response 2", date: "2026-10-03", weight: 3 },
    { id: "a5", type: "assignment", title: "Research proposal", date: "2026-10-14", weight: 8 },
    { id: "a6", type: "assignment", title: "Data worksheet", date: "2026-10-24", weight: 4 },
    { id: "a7", type: "assignment", title: "Reflection response 3", date: "2026-11-02", weight: 3 },
    { id: "a8", type: "assignment", title: "Peer review", date: "2026-11-12", weight: 4 },
    { id: "a9", type: "assignment", title: "Final paper draft", date: "2026-11-21", weight: 7 },
    { id: "a10", type: "assignment", title: "Final paper", date: "2026-12-05", weight: 11 },
    { id: "e1", type: "exam", title: "Midterm exam", date: "2026-10-16", weight: 15 },
    { id: "e2", type: "exam", title: "Final exam", date: "2026-12-12", weight: 25 },
    { id: "p1", type: "project", title: "Group presentation", date: "2026-10-21", weight: 10 },
    { id: "r1", type: "reading", title: "Chapters 1–2", date: "2026-09-08", weight: null },
    { id: "r2", type: "reading", title: "Chapters 3–4", date: "2026-09-22", weight: null },
    { id: "r3", type: "reading", title: "Chapters 5–6", date: "2026-10-06", weight: null },
    { id: "r4", type: "reading", title: "Chapters 7–8", date: "2026-10-20", weight: null },
    { id: "r5", type: "reading", title: "Chapters 9–10", date: "2026-11-03", weight: null },
  ],
};


const STORAGE_KEY = "studysync:extraction"; // same key the upload page saves to

// True only for real dates written as YYYY-MM-DD.
function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  // Adding T00:00:00 makes the browser read it as local time, avoiding off-by-one-day bugs.
  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

// "2026-09-02" -> "September 2, 2026" (or "September 2" when withYear is false)
function formatDate(iso: string, withYear = true): string {
  const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
  if (withYear) options.year = "numeric";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", options);
}

// "September 2 – December 14, 2026". The year is shown once when both dates share it.
function formatRange(start: string, end: string): string {
  if (!isValidDate(start) || !isValidDate(end)) return "";
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${formatDate(start, !sameYear)} – ${formatDate(end)}`;
}

// Turns the text saved by the upload page back into data.
// If nothing is saved (or it's broken), fall back to the sample.
// TODO: once /api/extract works, redirect to /upload here instead of using SAMPLE.
function parseStored(raw: string | null): Extraction {
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Extraction;
      if (parsed?.course && Array.isArray(parsed.requirements)) {
        return {
          ...parsed,
          // make sure every row has an id, since React and our edit functions need one
          requirements: parsed.requirements.map((r) => ({
            ...r,
            id: r.id || crypto.randomUUID(),
          })),
        };
      }
    } catch {
      // invalid JSON: ignore and use the sample below
    }
  }
  return SAMPLE;
}

// Runs the three checks shown in the "AI check" panel and a confidence score.
// Everything is calculated from the current data, so it updates as the user edits.
// (The score is a simple average of the three checks, not a number from the AI.)
function runChecks(course: Course, items: Requirement[]) {
  const courseValues = Object.values(course);
  const filled = courseValues.filter((v) => v.trim() !== "").length;

  // Items with no date (TBA) are allowed, so only check dates that exist.
  const allDates = [
    course.startDate,
    course.endDate,
    ...items.map((r) => r.date).filter((d) => d !== ""),
  ];
  const validDates = allDates.filter(isValidDate).length;

  const unique = new Set(
    items.map((r) => `${r.title.trim().toLowerCase()}|${r.date}`)
  ).size;

  // Do the weights add up to about 100%? Skipped when the syllabus gave none.
  const weights = items
    .map((r) => r.weight)
    .filter((w): w is number => w !== null);
  const weightTotal = weights.reduce((sum, w) => sum + w, 0);
  const weightsOk =
    weights.length === 0 || (weightTotal >= 98 && weightTotal <= 102);

  const score =
    (filled / courseValues.length +
      validDates / allDates.length +
      (items.length ? unique / items.length : 1) +
      (weightsOk ? 1 : 0)) /
    4;

  return {
    detailsOk: filled === courseValues.length,
    datesOk: validDates === allDates.length,
    conflictsOk: unique === items.length,
    weightsOk,
    weightTotal,
    confidence: Math.round(score * 100),
  };
}

// ---------- Reading the saved data without useEffect ----------
// useSyncExternalStore reads from outside React (here: sessionStorage) safely.
// On the server it returns undefined, so we show "Loading…" first. In the browser
// it returns the saved text, or null if nothing is saved.

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}
function readStored(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // some privacy modes block storage
  }
}
function readOnServer(): string | null | undefined {
  return undefined;
}

function Brand() {
  return (
    <span className={styles.brand}>
      <svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true">
        <rect x="0" y="7" width="5" height="11" fill="currentColor" />
        <rect x="7.5" y="0" width="5" height="18" fill="currentColor" />
        <rect x="15" y="4" width="5" height="14" fill="currentColor" />
      </svg>
      StudySync
    </span>
  );
}

// ---------- The page ----------

// This outer component only loads the data. The real screen is <Review />, which
// starts with that data and lets the user edit it.
export default function ReviewPage() {
  const stored = useSyncExternalStore(subscribe, readStored, readOnServer);

  if (stored === undefined) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Loading…</p>
      </div>
    );
  }
  return <Review initial={parseStored(stored)} />;
}

function Review({ initial }: { initial: Extraction }) {
  const router = useRouter();
  const { fileName } = initial;
  // The course is now state, so the popup can change it.
  const [course, setCourse] = useState<Course>(initial.course);

  // State = values React remembers. When one changes, the page re-draws.
  const [items, setItems] = useState<Requirement[]>(initial.requirements);
  const [active, setActive] = useState<Category>("assignment"); // selected tab
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----- Edit course popup -----
  const dialogRef = useRef<HTMLDialogElement>(null); // handle to the <dialog> element
  const [draft, setDraft] = useState<Course>(initial.course); // what's typed in the popup
  const [formError, setFormError] = useState<string | null>(null);

  function openEditor(): void {
    setDraft(course); // start from the current values
    setFormError(null);
    dialogRef.current?.showModal(); // opens the popup with a dimmed background
  }

  function closeEditor(): void {
    dialogRef.current?.close();
  }

  function saveCourse(): void {
    // ISO dates (YYYY-MM-DD) sort correctly as plain text, so < and > work here.
    if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) {
      setFormError("The end date must come after the start date.");
      return;
    }
    setCourse({
      code: draft.code.trim(),
      name: draft.name.trim(),
      instructor: draft.instructor.trim(),
      semester: draft.semester.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
    });
    closeEditor();
  }

  // ----- Editing functions -----

  // Change some fields of one row, leaving the others alone.
  function updateItem(id: string, patch: Partial<Requirement>) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeItem(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id));
  }
  // Adds an empty row to whichever tab is open.
  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: active, title: "", date: course.startDate, weight: null },
    ]);
  }

  // ----- Saving -----

  // A row can't be saved with a blank name or a bad date.
  const incomplete = items.some(
    (r) => !r.title.trim() || (r.date !== "" && !isValidDate(r.date))
  );

  async function handleConfirm() {
    if (saving || incomplete || items.length === 0) return;
    setSaving(true);
    setError(null);

    try {
      // /api/courses doesn't exist yet. It will save the course to Supabase.
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, requirements: items }),
      });
      if (!response.ok) throw new Error("Save failed");

      sessionStorage.removeItem(STORAGE_KEY);
      router.push("/semester"); // change this to wherever the semester view lives
    } catch {
      setError("We couldn't save this course yet. Please try again.");
      setSaving(false);
    }
  }

  // ----- Values used when drawing the page -----

  const checks = runChecks(course, items);
  const allOk = checks.detailsOk && checks.datesOk && checks.conflictsOk && checks.weightsOk;
  const category = CATEGORIES.find((c) => c.key === active)!;
  const visible = items.filter((r) => r.type === active);

  // The four course fields. An empty value shows "Not found" instead of "Confirmed".
  const courseFields = [
    { label: "COURSE", value: `${course.code} · ${course.name}`.replace(/^ · | · $/g, "") },
    { label: "SEMESTER", value: course.semester },
    { label: "INSTRUCTOR", value: course.instructor },
    { label: "COURSE DATES", value: formatRange(course.startDate, course.endDate) },
  ];

  const checkList = [
    {
      ok: checks.weightsOk,
      good: "Weights add up to about 100%",
      bad: `Weights add up to ${Math.round(checks.weightTotal)}%, so items may be missing`,
    },
  ];


  return (
    <div className={`${styles.page} ${serif.variable}`}>
      {/* ===== Header ===== */}
      <header className={styles.header}>
        <Link href="/" aria-label="StudySync home">
          <Brand />
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
        </nav>
      </header>

      <main>
        {/* ===== Step bar: now on step 2, so two segments are filled ===== */}
        <div className={styles.subbar}>
          <Link href="/upload" className={styles.back}>
            ← Back
          </Link>
          <div className={styles.progress} aria-hidden="true">
            <span className={`${styles.segment} ${styles.segmentActive}`} />
            <span className={`${styles.segment} ${styles.segmentActive}`} />
          </div>
          <p className={styles.stepCount}>STEP 2 OF 2</p>
        </div>

        <div className={styles.wrap}>
          {/* ===== Title row with the big count on the right ===== */}
          <div className={styles.top}>
            <div>
              <p className={styles.eyebrow}>
                <span className={styles.marker} aria-hidden="true" />
                AI EXTRACTION COMPLETE
              </p>
              <h1 className={styles.heading}>Here&apos;s what we found.</h1>
              <p className={styles.lede}>
                Confirm the details from{" "}
                <strong>{fileName ?? "your syllabus"}</strong> before adding
                them to your semester.
              </p>
            </div>
            <div className={styles.count}>
              <span className={styles.countNum}>{items.filter((r) => r.date).length}</span>
              <span className={styles.countLabel}>
                DATES
                <br />
                FOUND
              </span>
            </div>
          </div>

          <div className={styles.layout}>
            {/* ===== Left: the big card with two sections ===== */}
            <div className={styles.card}>
              {/* --- 01 Course information --- */}
              <section>
                <div className={styles.sectionHead}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.badge}>01</span>
                    <div>
                      <h2 className={styles.sectionTitle}>Course information</h2>
                      <p className={styles.sectionSub}>Identified from the syllabus header</p>
                    </div>
                  </div>
                  <div className={styles.statusCol}>
                    <span className={checks.detailsOk ? styles.status : styles.statusWarn}>
                      {checks.detailsOk ? "✓ Complete" : "Needs review"}
                    </span>
                    <button
                      type="button"
                      className={styles.menuButton}
                      aria-label="Edit course information"
                      aria-haspopup="dialog"
                      onClick={openEditor}
                    >
                      ⋯
                    </button>
                  </div>
                </div>

                <div className={styles.fieldGrid}>
                  {courseFields.map((f) => (
                    <div key={f.label} className={styles.fieldBox}>
                      <div>
                        <p className={styles.fieldLabel}>{f.label}</p>
                        <p className={styles.fieldValue}>{f.value || "Not found"}</p>
                      </div>
                      <span className={f.value ? styles.status : styles.statusWarn}>
                        {f.value ? "✓ Found" : "Missing"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* --- 02 Academic requirements --- */}
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.badge}>02</span>
                    <div>
                      <h2 className={styles.sectionTitle}>Academic requirements</h2>
                      <p className={styles.sectionSub}>
                        Review every item by category and edit anything that looks incorrect
                      </p>
                    </div>
                  </div>
                  <span className={styles.sectionSub}>{items.length} items found</span>
                </div>

                {/* Tabs: .map() builds one button per category. The counts update live. */}
                <div className={styles.tabs} role="tablist" aria-label="Requirement categories">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      role="tab"
                      aria-selected={active === c.key}
                      className={`${styles.tab} ${active === c.key ? styles.tabActive : ""}`}
                      onClick={() => setActive(c.key)}
                    >
                      <span className={styles.tabCount}>
                        {items.filter((r) => r.type === c.key).length}
                      </span>
                      <span className={styles.tabLabel}>{c.plural}</span>
                    </button>
                  ))}
                </div>

                <div role="tabpanel">
                  <div className={styles.listHead}>
                    <div>
                      <h3 className={styles.listTitle}>{category.plural}</h3>
                      <p className={styles.sectionSub}>Showing all {visible.length}</p>
                    </div>
                    <p className={styles.sectionSub}>Select any field to edit</p>
                  </div>

                  {/* Column labels (hidden on phones) */}
                  <div className={`${styles.row} ${styles.tableHead}`} aria-hidden="true">
                    <span>TYPE</span>
                    <span>REQUIREMENT</span>
                    <span>DATE</span>
                    <span>GRADE WEIGHT</span>
                    <span />
                  </div>

                  {visible.length === 0 && (
                    <p className={styles.empty}>No {category.plural.toLowerCase()} found.</p>
                  )}

                  {/* One editable row per item. Typing calls updateItem right away. */}
                  {visible.map((r) => (
                    <div key={r.id} className={styles.row}>
                      <select
                        className={`${styles.input} ${styles.cType}`}
                        aria-label="Type"
                        value={r.type}
                        onChange={(e) => {
                          updateItem(r.id, { type: e.target.value as Category });
                          setActive(e.target.value as Category); // follow the row to its new tab
                        }}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.singular}
                          </option>
                        ))}
                      </select>

                      <input
                        className={`${styles.input} ${styles.cTitle}`}
                        aria-label="Requirement name"
                        placeholder="Requirement name"
                        value={r.title}
                        onChange={(e) => updateItem(r.id, { title: e.target.value })}
                      />

                      <input
                        type="date"
                        className={`${styles.input} ${styles.cDate}`}
                        aria-label={`Date for ${r.title || "this item"}`}
                        value={r.date}
                        onChange={(e) => updateItem(r.id, { date: e.target.value })}
                      />

                      <div className={`${styles.weight} ${styles.cWeight}`}>
                        <input
                          type="number"
                          step="any"
                          min={0}
                          max={100}
                          className={styles.input}
                          aria-label={`Grade weight for ${r.title || "this item"}`}
                          placeholder="—"
                          value={r.weight ?? ""}
                          onChange={(e) =>
                            updateItem(r.id, {
                              // an empty box means "no weight"
                              weight: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                        />
                        <span aria-hidden="true">%</span>
                      </div>

                      <button
                        type="button"
                        className={`${styles.remove} ${styles.cRemove}`}
                        aria-label={`Remove ${r.title || "this item"}`}
                        onClick={() => removeItem(r.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <button type="button" className={styles.addButton} onClick={addItem}>
                    + Add {category.singular.toLowerCase()}
                  </button>
                </div>
              </section>
            </div>

            {/* ===== Right: AI check panel ===== */}
            <aside className={styles.check}>
              <p className={styles.checkLabel}>AI CHECK</p>
              <h2 className={styles.checkTitle}>{allOk ? "Ready to add" : "Needs a look"}</h2>

              <div className={styles.ring}>
                <span className={styles.ringNum}>{checks.confidence}%</span>
                <span className={styles.ringLabel}>confidence</span>
              </div>

              <ul className={styles.checkList}>
                {checkList.map((c) => (
                  <li key={c.good} className={c.ok ? "" : styles.checkBad}>
                    <span aria-hidden="true">{c.ok ? "✓" : "!"}</span>
                    {c.ok ? c.good : c.bad}
                  </li>
                ))}
              </ul>

              <p className={styles.checkNote}>
                You can edit any detail later from the course view.
              </p>
            </aside>
          </div>

          {/* ===== Footer actions ===== */}
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {incomplete && (
            <p className={styles.hintText}>
              Give every requirement a name, and fix any dates that look wrong, to continue.
            </p>
          )}

          <div className={styles.footer}>
            <Link
              href="/upload"
              className={styles.link}
              // forget the current result so the next upload starts fresh
              onClick={() => sessionStorage.removeItem(STORAGE_KEY)}
            >
              Upload a different file
            </Link>

            <button
              type="button"
              className={`${styles.button} ${styles.primary}`}
              disabled={saving || incomplete || items.length === 0}
              onClick={handleConfirm}
            >
              {saving ? "Adding…" : "Confirm and add to semester →"}
            </button>
          </div>
        </div>
      </main>
      {/* ===== Edit course popup ===== */}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="course-dialog-title"
        // Clicking the dimmed area outside the box closes it
        onClick={(e) => {
          if (e.target === e.currentTarget) closeEditor();
        }}
      >
        <form
          className={styles.dialogBody}
          onSubmit={(e) => {
            e.preventDefault();
            saveCourse();
          }}
        >
          <h2 id="course-dialog-title" className={styles.dialogTitle}>
            Edit course information
          </h2>
          <p className={styles.sectionSub}>Fix anything the AI missed or got wrong.</p>

          <div className={styles.formGrid}>
            <label className={styles.formField}>
              <span className={styles.formLabel}>COURSE CODE</span>
              <input
                className={styles.input}
                placeholder="e.g. CS 4141"
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value })}
              />
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>SEMESTER</span>
              <input
                className={styles.input}
                placeholder="e.g. Fall 2026"
                value={draft.semester}
                onChange={(e) => setDraft({ ...draft, semester: e.target.value })}
              />
            </label>

            <label className={`${styles.formField} ${styles.formWide}`}>
              <span className={styles.formLabel}>COURSE NAME</span>
              <input
                className={styles.input}
                placeholder="e.g. Digital Logic Lab"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>

            <label className={`${styles.formField} ${styles.formWide}`}>
              <span className={styles.formLabel}>INSTRUCTOR</span>
              <input
                className={styles.input}
                placeholder="e.g. Dr. Maya Chen"
                value={draft.instructor}
                onChange={(e) => setDraft({ ...draft, instructor: e.target.value })}
              />
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>START DATE</span>
              <input
                type="date"
                className={styles.input}
                value={draft.startDate}
                onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
              />
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>END DATE</span>
              <input
                type="date"
                className={styles.input}
                value={draft.endDate}
                onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
              />
            </label>
          </div>

          {formError && (
            <p className={styles.error} role="alert">
              {formError}
            </p>
          )}

          <div className={styles.dialogActions}>
            <button type="button" className={styles.button} onClick={closeEditor}>
              Cancel
            </button>
            <button type="submit" className={`${styles.button} ${styles.primary}`}>
              Save changes
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}