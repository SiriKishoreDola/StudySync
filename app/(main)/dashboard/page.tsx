"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Assignment = {
  id: string;
  course: string;
  name: string;
  dueDate: string; // ISO date, YYYY-MM-DD
  weight: number; // percent of final grade
  type: "assignment" | "quiz" | "exam";
  completed: boolean;
};

const DAY_MS = 86400000;

// Demo data shown when the user has no saved assignments yet.
function demoAssignments(): Assignment[] {
  const t = getToday().getTime();
  const d = (n: number) => new Date(t + n * DAY_MS).toISOString().slice(0, 10);
  return [
    { id: "demo-1", course: "Data Structures", name: "Problem Set 4", dueDate: d(1), weight: 5, type: "assignment", completed: false },
    { id: "demo-2", course: "Calculus II", name: "Quiz 3", dueDate: d(2), weight: 3, type: "quiz", completed: false },
    { id: "demo-3", course: "Intro to Psychology", name: "Midterm Exam", dueDate: d(4), weight: 25, type: "exam", completed: false },
    { id: "demo-4", course: "Data Structures", name: "Lab 6", dueDate: d(6), weight: 4, type: "assignment", completed: false },
    { id: "demo-5", course: "English Composition", name: "Essay Draft", dueDate: d(9), weight: 10, type: "assignment", completed: false },
    { id: "demo-6", course: "Calculus II", name: "Midterm Exam", dueDate: d(12), weight: 20, type: "exam", completed: false },
    { id: "demo-7", course: "Intro to Psychology", name: "Reading Response", dueDate: d(-1), weight: 2, type: "assignment", completed: true },
  ];
}

// Today's date (in the user's time zone) as midnight UTC, so it lines up with
// YYYY-MM-DD due dates.
function getToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function daysUntil(iso: string, today: Date) {
  return Math.round((new Date(iso).getTime() - today.getTime()) / DAY_MS);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function DashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  // Set after the page loads in the browser so server and browser always agree.
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(getToday());
  }, []);

  // Get the signed-in user's name from Supabase.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const fullName = user.user_metadata?.full_name as string | undefined;
      setUserName(fullName || user.email?.split("@")[0] || "");
    });
  }, []);

  // Load assignments from the API when the page opens.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();
        if (!cancelled)
          setAssignments(data.assignments?.length ? data.assignments : demoAssignments());
      } catch {
        if (!cancelled) setAssignments(demoAssignments());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Update the checkbox right away, then save it. Undo if saving fails.
  async function toggle(id: string) {
    const current = assignments.find((a) => a.id === id);
    if (!current) return;
    const next = !current.completed;

    setError("");
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: next } : a)),
    );

    if (id.startsWith("demo-")) return;

    try {
      const res = await fetch(`/api/requirements/${id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: next }),
      });
      if (!res.ok) throw new Error("Request failed");
    } catch {
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, completed: !next } : a)),
      );
      setError("Couldn't save that change. Please try again.");
    }
  }

  if (!today) return <div className="dashboard-page" />;

  const sorted = [...assignments].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate),
  );
  const open = sorted.filter((a) => !a.completed);

  const dueThisWeek = open.filter((a) => daysUntil(a.dueDate, today) <= 7).length;
  const upcomingExams = open.filter((a) => a.type === "exam").length;
  const courses = Array.from(new Set(assignments.map((a) => a.course)));

  const progress = courses.map((course) => {
    const items = assignments.filter((a) => a.course === course);
    const done = items.filter((a) => a.completed).length;
    return { course, percent: Math.round((done / items.length) * 100) };
  });

  const nextDeadline = open[0];
  const nextDays = nextDeadline ? daysUntil(nextDeadline.dueDate, today) : 0;
  const nextLabel =
    nextDays < 0
      ? "Overdue"
      : nextDays === 0
        ? "Due today"
        : nextDays === 1
          ? "Due tomorrow"
          : `Due in ${nextDays} days`;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today.getTime() + i * DAY_MS);
    const iso = date.toISOString().slice(0, 10);
    return {
      label: ["S", "M", "T", "W", "T", "F", "S"][date.getUTCDay()],
      count: open.filter((a) => a.dueDate === iso).length,
    };
  });
  const weekTotal = weekDays.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(1, ...weekDays.map((d) => d.count));
  const heavy = weekTotal >= 4;

  return (
    <div className="dashboard-page">
      <div className="intro-row">
        <div>
          <h1 className="text-[28px] font-semibold">
            Good evening{userName ? `, ${userName}` : ""}
          </h1>
          <p className="mt-1 text-sm">
            {today.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}{" "}
            · Your semester at a glance
          </p>
        </div>
        <Link href="/upload" className="ss-button primary inline-block">
          + Upload syllabus
        </Link>
      </div>

      {error && (
        <p role="alert" className="alert-box">
          {error}
        </p>
      )}

      {/* Next deadline callout */}
      {nextDeadline && (
        <div className="surface p-5">
          <p className="text-[11px] font-semibold">NEXT DEADLINE</p>
          <p className="mt-1 text-lg font-semibold">
            {nextLabel}: {nextDeadline.course} {nextDeadline.name}
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Due this week", value: dueThisWeek, note: "still open" },
          { label: "Upcoming exams", value: upcomingExams, note: "not yet taken" },
          { label: "Courses this semester", value: courses.length, note: "all active" },
        ].map((stat) => (
          <div key={stat.label} className="surface p-5">
            <p className="text-sm">{stat.label}</p>
            <p className="mt-4 text-[28px] font-semibold">
              {String(stat.value).padStart(2, "0")}
            </p>
            <p className="text-xs">{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Assignment table */}
        <section className="surface lg:col-span-2">
          <div className="section-header">
            <h2 className="text-lg font-semibold">Assignments</h2>
            <Link href="/timeline" className="text-link text-sm">
              View timeline ↗
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="assignment-table">
              <thead>
                <tr>
                  <th>Done</th>
                  <th>Assignment</th>
                  <th>Course</th>
                  <th>Due</th>
                  <th className="text-right">Weight</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5}>Loading assignments...</td>
                  </tr>
                )}
                {!loading && sorted.length === 0 && (
                  <tr>
                    <td colSpan={5}>No assignments yet.</td>
                  </tr>
                )}
                {sorted.map((a) => (
                  <tr key={a.id} className={a.completed ? "is-complete" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={a.completed}
                        onChange={() => toggle(a.id)}
                        aria-label={`Mark ${a.name} complete`}
                      />
                    </td>
                    <td className={`font-semibold ${a.completed ? "line-through" : ""}`}>
                      {a.name}
                    </td>
                    <td>{a.course}</td>
                    <td>{formatDate(a.dueDate)}</td>
                    <td className="text-right">{a.weight}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-5">
          {/* Workload alert */}
          <section className="surface p-5">
            <h2 className="text-lg font-semibold">Workload Alert</h2>
            <p className="mt-3 text-sm font-semibold">
              {heavy
                ? `Heavy week ahead: ${weekTotal} deadlines`
                : `Light week ahead: ${weekTotal} deadlines`}
            </p>
            <p className="mt-1 text-sm">
              {heavy
                ? "Plan a focused study block before your busiest day."
                : "You have room to get ahead on upcoming work."}
            </p>
            <div className="day-chart mt-4">
              <p className="text-[11px] font-semibold">DEADLINES BY DAY</p>
              <div className="day-chart-bars">
                {weekDays.map((d, i) => (
                  <div key={i} className="day-chart-day">
                    <div
                      className={`day-chart-bar ${d.count >= 2 ? "is-busy" : ""}`}
                      style={{ height: `${Math.max(6, (d.count / maxCount) * 80)}%` }}
                    />
                    <span className="text-xs">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Progress per course */}
          <section className="surface p-5">
            <h2 className="text-lg font-semibold">Progress by course</h2>
            <ul className="mt-4 space-y-3">
              {progress.map((p) => (
                <li key={p.course}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{p.course}</span>
                    <span>{p.percent}%</span>
                  </div>
                  <span className="progress-bar progress-bar-full" aria-hidden="true">
                    <i style={{ width: `${p.percent}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

    </div>
  );
}