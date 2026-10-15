"use client";

import Link from "next/link";
import { useState } from "react";
import { Assistant, type AssistantScenario } from "./assistant";
import { Settings } from "./settings";
import { demoDeadlines } from "@/lib/study-demo";

export function DemoHost() {
  const [view, setView] = useState<"profile" | "dashboard">("profile");
  const [scenario, setScenario] = useState<AssistantScenario>("normal");
  return <div className="studysync-demo min-h-screen">
    <a className="skip-link" href="#demo-content">Skip to content</a>
    <header className="demo-nav"><Link href="/" className="mr-5 text-xl font-semibold">StudySync</Link><nav aria-label="Demo navigation" className="flex flex-wrap gap-2"><button className={`nav-button ${view === "dashboard" ? "selected" : ""}`} aria-current={view === "dashboard" ? "page" : undefined} onClick={() => setView("dashboard")}>Dashboard</button><span className="nav-placeholder">Upload</span><span className="nav-placeholder">Timeline</span><span className="nav-placeholder">My Courses</span><button className={`nav-button ${view === "profile" ? "selected" : ""}`} aria-current={view === "profile" ? "page" : undefined} onClick={() => setView("profile")}>Profile &amp; Settings</button></nav></header>
    <div className="demo-banner"><strong>Integration preview</strong> · No Profile page or shared navigation exists in this repository yet. This host supplies fictional profile content and temporary navigation for review only.</div>
    <main id="demo-content" className="demo-main">
      {view === "profile" ? <>
        <h1 className="text-[28px] font-semibold">Profile &amp; Settings</h1><p className="mt-1 text-sm">Your student profile and study preferences, together.</p>
        <section aria-label="Fictional student profile" className="my-7 space-y-5">
          <div className="flex flex-col items-center gap-2 py-1"><div className="avatar">JD</div><p className="text-[11px] font-semibold">STUDENT PROFILE · DEMO</p><h2 className="text-[28px] font-semibold">Jordan Davis</h2><p className="text-sm">they / them</p></div>
          <div className="surface grid gap-6 p-6 sm:grid-cols-2"><div><p className="text-xs font-semibold">SCHOOL</p><p className="mt-3 font-semibold">Northwood University</p><p className="mt-2 text-sm">Undergraduate · Year 2</p></div><div><p className="text-xs font-semibold">AGE</p><p className="mt-3 font-semibold">20 years old</p><p className="mt-2 text-sm">Student account · Fictional</p></div></div>
          <div className="surface p-6"><div className="mb-5 flex justify-between"><h2 className="text-lg font-semibold">Courses</h2><p className="text-sm">4 enrolled</p></div><div className="grid gap-4 sm:grid-cols-2">{[["SO", "SOC 204", "Social Research Methods", "Dr. A. Chen", "42%"], ["MA", "MATH 112", "Applied Calculus", "Prof. M. Reyes", "36%"], ["HI", "HIST 230", "Modern World History", "Dr. S. Okafor", "40%"], ["AR", "ART 145", "Visual Composition", "Prof. L. Park", "34%"]].map(([initials, code, title, teacher, progress]) => <div key={code} className="course-card"><span className="course-initials">{initials}</span><div className="flex-1"><p className="text-[11px]">{code}</p><h3 className="font-semibold">{title}</h3><p className="mt-1 text-xs">{teacher}</p></div><span className="text-xs font-semibold">{progress}</span></div>)}</div></div>
        </section><Settings />
      </> : <>
        <h1 className="text-[28px] font-semibold">Dashboard</h1><p className="mt-1 mb-5 text-sm">Monday, October 12, 2026 · Fictional fall semester</p>
        <div className="mb-5 grid gap-4 sm:grid-cols-3">{[["DUE THIS WEEK", "4 deadlines", "October 12–18"], ["START EARLY", "2 priorities", "Physics exam · Engineering project"], ["BUSIEST WEEK", "Oct 12–18", "4 deadlines across 4 courses"]].map(([label, value, detail]) => <div className="surface p-5" key={label}><p className="text-xs">{label}</p><p className="my-1 text-[28px] font-semibold">{value}</p><p className="text-xs">{detail}</p></div>)}</div>
        <section className="surface overflow-hidden" aria-labelledby="deadlines-heading"><h2 id="deadlines-heading" className="p-5 text-lg font-semibold">Upcoming deadlines</h2><div className="overflow-x-auto"><table className="deadline-table"><thead><tr><th>Course &amp; deadline</th><th>Due date</th><th>Status</th></tr></thead><tbody>{demoDeadlines.map(d => <tr key={d.course}><td>{d.title}<small className="mt-1 block">{d.course}</small></td><td>{d.due}</td><td>{d.status}</td></tr>)}</tbody></table></div></section>
        <div className="surface mt-5 p-5"><h2 className="font-semibold">Plan ahead, one session at a time</h2><p className="mt-3 text-sm">Start Physics revision and the Engineering project before Thursday. Ask StudySync for a short plan.</p><p className="mt-3 text-xs">Fictional data · No live connections or calendar editing</p></div>
      </>}
      <details className="surface mt-8 p-5"><summary className="cursor-pointer font-semibold">Assistant demo scenarios</summary><label htmlFor="demo-scenario" className="mt-4 block text-sm">Choose a scenario, then open the assistant. Changing scenarios resets the chat.</label><select id="demo-scenario" className="mt-3" value={scenario} onChange={event => setScenario(event.target.value as AssistantScenario)}><option value="normal">Normal: welcome → loading → conversation</option><option value="error">Simulated error → retry succeeds</option><option value="empty">No deadlines</option></select><p className="mt-3 text-xs">Any typed question receives a preset example; no AI service is called.</p></details>
    </main><Assistant key={scenario} scenario={scenario} />
  </div>;
}
