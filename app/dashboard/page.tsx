"use client";

import Link from "next/link";
import { useState } from "react";

type Assignment = {
  id: number;
  course: string;
  name: string;
  dueDate: string; // ISO date, YYYY-MM-DD
  weight: number; // percent of final grade
  type: "assignment" | "quiz" | "exam";
  completed: boolean;
};

// MOCK DATA: replace with a fetch to the dashboard API once the backend exists.
const initialAssignments: Assignment[] = [
  { id: 1, course: "Research Methods", name: "Research proposal draft", dueDate: "2026-10-16", weight: 10, type: "assignment", completed: false },
  { id: 2, course: "Linear Algebra", name: "Problem set 06", dueDate: "2026-10-16", weight: 5, type: "assignment", completed: false },
  { id: 3, course: "Modern Literature", name: "Reading response", dueDate: "2026-10-19", weight: 5, type: "assignment", completed: false },
  { id: 4, course: "Cognitive Psychology", name: "Midterm review quiz", dueDate: "2026-10-20", weight: 10, type: "quiz", completed: false },
  { id: 5, course: "General Chemistry", name: "Lab report: Kinetics", dueDate: "2026-10-21", weight: 15, type: "assignment", completed: false },
  { id: 6, course: "Linear Algebra", name: "Midterm exam", dueDate: "2026-10-23", weight: 25, type: "exam", completed: false },
  { id: 7, course: "Linear Algebra", name: "Problem set 05", dueDate: "2026-10-12", weight: 5, type: "assignment", completed: true },
  { id: 8, course: "General Chemistry", name: "Pre-lab questions", dueDate: "2026-10-09", weight: 5, type: "assignment", completed: true },
];

// Fixed "today" so the mock page looks the same every time. Use new Date() later.
const TODAY = new Date("2026-10-15");
const DAY_MS = 86400000;

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Timeline", href: "/timeline" },
  { label: "Upload", href: "/upload" },
  { label: "My Courses", href: "/courses" },
];

function daysUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - TODAY.getTime()) / DAY_MS);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function DashboardPage() {
  const [assignments, setAssignments] = useState(initialAssignments);

  function toggle(id: number) {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a)),
    );
  }

  const sorted = [...assignments].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate),
  );
  const open = sorted.filter((a) => !a.completed);

  const dueThisWeek = open.filter((a) => daysUntil(a.dueDate) <= 7).length;
  const upcomingExams = open.filter((a) => a.type === "exam").length;
  const courses = Array.from(new Set(assignments.map((a) => a.course)));

  const progress = courses.map((course) => {
    const items = assignments.filter((a) => a.course === course);
    const done = items.filter((a) => a.completed).length;
    return { course, percent: Math.round((done / items.length) * 100) };
  });

  const nextDeadline = open[0];
  const nextDays = nextDeadline ? daysUntil(nextDeadline.dueDate) : 0;
  const nextLabel =
    nextDays <= 0 ? "Due today" : nextDays === 1 ? "Due tomorrow" : `Due in ${nextDays} days`;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(TODAY.getTime() + i * DAY_MS);
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
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar (Chat lives in the floating bubble only) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6 md:flex">
        <p className="mb-8 px-2 text-lg font-bold tracking-tight">StudySync</p>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                item.label === "Dashboard"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t border-gray-200 pt-4">
          <Link href="/profile" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900">
            Profile
          </Link>
          <Link href="/settings" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900">
            Settings
          </Link>
        </div>
      </aside>

      <div className="flex-1">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-5">
          <div>
            <h1 className="text-xl font-semibold">Good evening, Abhishek</h1>
            <p className="text-sm text-gray-500">Thursday, October 15</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
            A
          </div>
        </header>

        <main className="space-y-6 px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Overview</h2>
              <p className="text-sm text-gray-500">Your semester at a glance</p>
            </div>
            <Link href="/upload" className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
              + Upload syllabus
            </Link>
          </div>

          {/* Next deadline callout */}
          {nextDeadline && (
            <div className="rounded-xl border border-gray-300 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Next deadline
              </p>
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
              <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-4xl font-bold">{String(stat.value).padStart(2, "0")}</p>
                  <p className="text-xs text-gray-400">{stat.note}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Assignment table */}
            <section className="rounded-xl border border-gray-200 bg-white lg:col-span-2">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h3 className="font-semibold">Assignments</h3>
                <Link href="/timeline" className="text-sm text-gray-500 hover:text-gray-900">
                  View timeline →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-gray-400">
                    <tr>
                      <th className="w-12 px-5 py-3 font-medium">Done</th>
                      <th className="px-3 py-3 font-medium">Assignment</th>
                      <th className="px-3 py-3 font-medium">Course</th>
                      <th className="px-3 py-3 font-medium">Due</th>
                      <th className="px-5 py-3 text-right font-medium">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((a) => (
                      <tr
                        key={a.id}
                        className={`border-t border-gray-100 ${a.completed ? "text-gray-400" : ""}`}
                      >
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            checked={a.completed}
                            onChange={() => toggle(a.id)}
                            aria-label={`Mark ${a.name} complete`}
                            className="h-4 w-4 accent-gray-900"
                          />
                        </td>
                        <td className={`px-3 py-3 font-medium ${a.completed ? "line-through" : ""}`}>
                          {a.name}
                        </td>
                        <td className="px-3 py-3">{a.course}</td>
                        <td className="px-3 py-3">{formatDate(a.dueDate)}</td>
                        <td className="px-5 py-3 text-right">{a.weight}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="space-y-6">
              {/* Workload alert */}
              <section className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="font-semibold">Workload Alert</h3>
                <p className="mt-3 font-medium">
                  {heavy
                    ? `Heavy week ahead: ${weekTotal} deadlines`
                    : `Light week ahead: ${weekTotal} deadlines`}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {heavy
                    ? "Plan a focused study block before your busiest day."
                    : "You have room to get ahead on upcoming work."}
                </p>
                <div className="mt-4 rounded-lg bg-gray-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Deadlines by day
                  </p>
                  <div className="mt-3 flex h-24 items-end gap-2">
                    {weekDays.map((d, i) => (
                      <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                        <div
                          className={`w-full rounded-sm ${d.count >= 2 ? "bg-gray-600" : "bg-gray-300"}`}
                          style={{ height: `${Math.max(6, (d.count / maxCount) * 80)}%` }}
                        />
                        <span className="text-xs text-gray-500">{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Progress per course */}
              <section className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="font-semibold">Progress by course</h3>
                <ul className="mt-4 space-y-3">
                  {progress.map((p) => (
                    <li key={p.course}>
                      <div className="flex justify-between text-sm">
                        <span>{p.course}</span>
                        <span className="text-gray-500">{p.percent}%</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-gray-700" style={{ width: `${p.percent}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Floating chat bubble */}
      <button
        type="button"
        aria-label="Open chat assistant"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-800"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 20l1.1-4.9A8.4 8.4 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
        </svg>
      </button>
    </div>
  );
}