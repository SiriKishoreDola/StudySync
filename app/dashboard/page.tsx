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

// StudySync theme (from the team design guide):
// cream #e6d8c1 page bg | surface #f8f2e9 cards | mauve #a37c76 primary/selected
// ink #211b19 text | border #bead99 | avatar #2d2826
const fontStyle = {
  fontFamily: "Inter, Arial, Helvetica, sans-serif",
  lineHeight: 1.5,
};
const focusRing =
  "focus-visible:[outline:3px_solid_#211b19] focus-visible:[outline-offset:3px]";
const surface = "rounded-[14px] border border-[#bead99] bg-[#f8f2e9]";
const primaryButton = `inline-block rounded-[6px] border border-[#a37c76] bg-[#a37c76] px-[15px] py-[9px] text-sm font-semibold text-[#211b19] hover:brightness-[.96] ${focusRing}`;
const navLink = `whitespace-nowrap rounded-[4px] px-4 py-2 text-sm ${focusRing}`;

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Timeline", href: "/timeline" },
  { label: "Upload", href: "/upload" },
  { label: "My Courses", href: "/courses" },
  { label: "Profile", href: "/profile" },
  { label: "Settings", href: "/settings" },
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
    <div className="min-h-screen bg-[#e6d8c1] text-[#211b19]" style={fontStyle}>
      {/* Top nav (Chat lives in the floating bubble only) */}
      <header className="flex min-h-[72px] items-center gap-4 border-b border-[#bead99] bg-[#f8f2e9] px-4 py-[15px] sm:px-7">
        <p className="shrink-0 text-xl font-semibold">StudySync</p>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`${navLink} ${
                item.label === "Dashboard" ? "bg-[#a37c76] font-semibold" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2d2826] text-sm font-semibold text-[#f8f2e9]">
          A
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] space-y-5 px-4 pb-[110px] pt-6 sm:px-16 sm:pt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold">Good evening, Abhishek</h1>
            <p className="mt-1 text-sm">Thursday, October 15 · Your semester at a glance</p>
          </div>
          <Link href="/upload" className={primaryButton}>
            + Upload syllabus
          </Link>
        </div>

        {/* Next deadline callout */}
        {nextDeadline && (
          <div className={`${surface} p-5`}>
            <p className="text-xs font-semibold">NEXT DEADLINE</p>
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
            <div key={stat.label} className={`${surface} p-5`}>
              <p className="text-sm">{stat.label}</p>
              <p className="mt-4 text-[28px] font-semibold">
                {String(stat.value).padStart(2, "0")}
              </p>
              <p className="text-xs">{stat.note}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Assignment table */}
          <section className={`${surface} lg:col-span-2`}>
            <div className="flex items-center justify-between border-b border-[#bead99] p-5">
              <h2 className="text-lg font-semibold">Assignments</h2>
              <Link
                href="/timeline"
                className={`text-sm underline underline-offset-2 ${focusRing}`}
              >
                View timeline ↗
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-5 py-4 font-semibold">Done</th>
                    <th className="px-5 py-4 font-semibold">Assignment</th>
                    <th className="px-5 py-4 font-semibold">Course</th>
                    <th className="px-5 py-4 font-semibold">Due</th>
                    <th className="px-5 py-4 text-right font-semibold">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((a) => (
                    <tr
                      key={a.id}
                      className={`border-t border-[#bead99] ${a.completed ? "opacity-[.55]" : ""}`}
                    >
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={a.completed}
                          onChange={() => toggle(a.id)}
                          aria-label={`Mark ${a.name} complete`}
                          className={`h-4 w-4 accent-[#a37c76] ${focusRing}`}
                        />
                      </td>
                      <td className={`px-5 py-4 font-semibold ${a.completed ? "line-through" : ""}`}>
                        {a.name}
                      </td>
                      <td className="px-5 py-4">{a.course}</td>
                      <td className="px-5 py-4">{formatDate(a.dueDate)}</td>
                      <td className="px-5 py-4 text-right">{a.weight}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="space-y-5">
            {/* Workload alert */}
            <section className={`${surface} p-5`}>
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
              <div className="mt-4 rounded-[8px] border border-[#bead99] bg-[#e6d8c1] p-4">
                <p className="text-xs font-semibold">DEADLINES BY DAY</p>
                <div className="mt-3 flex h-24 items-end gap-2">
                  {weekDays.map((d, i) => (
                    <div
                      key={i}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                    >
                      <div
                        className={`w-full rounded-[4px] ${d.count >= 2 ? "bg-[#a37c76]" : "bg-[#bead99]"}`}
                        style={{ height: `${Math.max(6, (d.count / maxCount) * 80)}%` }}
                      />
                      <span className="text-xs">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Progress per course */}
            <section className={`${surface} p-5`}>
              <h2 className="text-lg font-semibold">Progress by course</h2>
              <ul className="mt-4 space-y-3">
                {progress.map((p) => (
                  <li key={p.course}>
                    <div className="flex justify-between text-sm">
                      <span>{p.course}</span>
                      <span>{p.percent}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-[#e6d8c1]">
                      <div
                        className="h-2 rounded-full bg-[#a37c76]"
                        style={{ width: `${p.percent}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Floating chat bubble (launcher styling from the guide) */}
      <button
        type="button"
        aria-label="Open chat assistant"
        className={`fixed bottom-4 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-[#a37c76] bg-[#a37c76] text-[#211b19] hover:brightness-[.96] sm:bottom-6 sm:right-6 ${focusRing}`}
        style={{ boxShadow: "0 4px 18px #211b1920" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 20l1.1-4.9A8.4 8.4 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
        </svg>
      </button>
    </div>
  );
}