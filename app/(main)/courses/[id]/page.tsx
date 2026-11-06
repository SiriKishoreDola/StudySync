"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ProgressRing from "@/components/ProgressRing";
import Timeline from "../Timeline";
import {
  COURSE_COLORS, TYPES, type CourseData, type Item, type ItemType,
  doneWeight, fmt, relative, saveCourses, startOfToday, totalWeight, useCourses,
} from "@/utils/courses";
import styles from "../courses.module.css";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>(); // the part of the URL after /courses/
  const courses = useCourses();

  const [filter, setFilter] = useState<"all" | ItemType>("all");
  const [hovered, setHovered] = useState<Item | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null); // gets keyboard focus

  if (!courses) return <p className={styles.sub}>Loading…</p>;

  const index = courses.findIndex((c) => c.id === id);
  const course = courses[index];
  if (!course) {
    return (
      <>
        <p className={styles.sub}>We couldn&apos;t find that course.</p>
        <Link href="/courses" className={styles.back}>← My courses</Link>
      </>
    );
  }

  const today = startOfToday();
  const color = COURSE_COLORS[index % COURSE_COLORS.length];

  // ----- Editing: every change is saved straight away -----
  const update = (change: (c: CourseData) => CourseData) =>
    saveCourses(courses.map((c) => (c.id === id ? change(c) : c)));

  const editItem = (itemId: string, patch: Partial<Item>) =>
    update((c) => ({ ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }));

  const removeItem = (itemId: string) =>
    update((c) => ({ ...c, items: c.items.filter((i) => i.id !== itemId) }));

  function addItem() {
    const newId = crypto.randomUUID();
    update((c) => ({
      ...c,
      items: [...c.items, { id: newId, type: filter === "all" ? "assignment" : filter, title: "", date: "", weight: 0, done: false }],
    }));
    setJustAdded(newId);
  }

  // ----- Numbers for the summary panel -----
  const total = totalWeight(course);
  const complete = Math.abs(total - 100) < 0.5;
  const byType = (Object.keys(TYPES) as ItemType[])
    .map((t) => ({ t, sum: course.items.filter((i) => i.type === t).reduce((a, i) => a + i.weight, 0), n: course.items.filter((i) => i.type === t).length }))
    .filter((x) => x.n > 0);
  const sumAll = byType.reduce((a, x) => a + x.sum, 0) || 1;

  // Donut segments: each one is a stroked circle, shifted by the length before it.
  const R = 40, L = 2 * Math.PI * R;
  let offset = 0;
  const arcs = byType.map(({ t, sum }) => {
    const len = (sum / sumAll) * L;
    const arc = (
      <circle key={t} cx={60} cy={60} r={R} fill="none" stroke={TYPES[t].color} strokeWidth={18}
        strokeDasharray={`${len} ${L - len}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)" />
    );
    offset += len;
    return arc;
  });

  const visible = course.items
    .filter((i) => filter === "all" || i.type === filter)
    .sort((a, b) => (a.date || "9").localeCompare(b.date || "9")); // undated items last

  return (
    <>
      <Link href="/courses" className={styles.back}>← My courses</Link>

      <div className={styles.top}>
        <div>
          <span className={styles.code} style={{ background: color }}>{course.code}</span>
          <h1 className={`${styles.title} ${styles.titleSmall}`}>{course.name}</h1>
          <p className={styles.sub}>{course.instructor}</p>
        </div>
        <a href={`/api/courses/${course.id}/syllabus`} target="_blank" rel="noopener noreferrer" className={styles.button}>
          View syllabus
        </a>
      </div>

      {/* Course name and instructor are editable too */}
      <div className={styles.meta}>
        <div>
          <label htmlFor="cn" className={styles.fieldLabel}>COURSE NAME</label>
          <input id="cn" className={styles.input} value={course.name}
            onChange={(e) => update((c) => ({ ...c, name: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="ci" className={styles.fieldLabel}>INSTRUCTOR</label>
          <input id="ci" className={styles.input} value={course.instructor}
            onChange={(e) => update((c) => ({ ...c, instructor: e.target.value }))} />
        </div>
      </div>

      <div className={styles.two}>
        {/* Where the grade comes from */}
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Where the grade comes from</h2>
          <p className={styles.hint}>Click a type to filter the list below.</p>
          <div className={styles.donutWrap}>
            <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
              <svg width={120} height={120} viewBox="0 0 120 120" role="img" aria-label="Grade weight by type">{arcs}</svg>
              <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", fontSize: 13, fontWeight: 600 }}>
                {doneWeight(course)}%<br />done
              </span>
            </div>
            <div className={styles.legend}>
              <button type="button" className={styles.lg} aria-pressed={filter === "all"} onClick={() => setFilter("all")}
                style={{ "--col": "var(--border)" } as React.CSSProperties}>
                <i className={styles.lgDot} />All<span>{course.items.length}</span>
              </button>
              {byType.map(({ t, sum }) => (
                <button key={t} type="button" className={styles.lg} aria-pressed={filter === t} onClick={() => setFilter(t)}
                  style={{ "--col": TYPES[t].color } as React.CSSProperties}>
                  <i className={styles.lgDot} />{TYPES[t].many}<span>{Math.round(sum * 100) / 100}%</span>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.meter}>
            <i style={{ width: `${Math.min(100, total)}%`, background: complete ? "var(--ok)" : "var(--warn)" }} />
          </div>
          <p className={styles.msg} style={{ color: complete ? "var(--ok)" : "var(--warn)" }}>
            Weights add up to {total}% ·{" "}
            {complete ? "✓ complete" : total < 100 ? `${Math.round((100 - total) * 100) / 100}% unassigned` : `${Math.round((total - 100) * 100) / 100}% over`}
          </p>
        </section>

        {/* Timeline */}
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Semester at a glance</h2>
          <p className={styles.hint}>Every dot is a due date. Filled means done, squares are exams.</p>
          <div style={{ margin: "30px 0 8px" }}>
            <Timeline items={course.items} color={color} today={today} onHover={setHovered} />
          </div>
          <p className={styles.cap}>
            {hovered
              ? <><b>{hovered.title}</b> · {TYPES[hovered.type].one} · {fmt(hovered.date)} · {hovered.weight}% of grade · {hovered.done ? "done" : relative(hovered.date, today)}</>
              : <><b>Hover a dot</b> to see what it is.</>}
          </p>
          <ProgressRing percent={doneWeight(course)} size={0 + 56} caption="grade done" />
        </section>
      </div>

      {/* Editable list */}
      <section className={styles.list}>
        <div className={styles.listHead}>
          <h2 className={styles.panelTitle}>{filter === "all" ? "All items" : TYPES[filter].many}</h2>
          <span className={styles.hint}>Edit any field. Changes update the charts. Tick the circle when something is done.</span>
        </div>

        <div className={`${styles.itemRow} ${styles.rowHead}`} aria-hidden="true">
          <span /><span>TYPE</span><span>NAME</span><span>DATE</span><span>WEIGHT</span><span />
        </div>

        {visible.length === 0 && <p className={styles.empty}>Nothing here yet.</p>}

        {visible.map((i) => (
          <div key={i.id} className={`${styles.itemRow} ${i.done ? styles.itemDone : ""}`}
            style={{ "--col": TYPES[i.type].color } as React.CSSProperties}>
            <button type="button" className={styles.check} aria-pressed={i.done} aria-label={`Mark ${i.title || "item"} ${i.done ? "not done" : "done"}`}
              onClick={() => editItem(i.id, { done: !i.done })}>
              {i.done ? "✓" : ""}
            </button>

            <select className={`${styles.input} ${styles.cType}`} aria-label="Type" value={i.type}
              onChange={(e) => editItem(i.id, { type: e.target.value as ItemType })}>
              {(Object.keys(TYPES) as ItemType[]).map((t) => <option key={t} value={t}>{TYPES[t].one}</option>)}
            </select>

            <input className={`${styles.input} ${styles.cName}`} aria-label="Name" placeholder="Name" value={i.title}
              autoFocus={i.id === justAdded} onChange={(e) => editItem(i.id, { title: e.target.value })} />

            <input type="date" className={`${styles.input} ${styles.cDate}`} aria-label="Date" value={i.date}
              onChange={(e) => editItem(i.id, { date: e.target.value })} />

            <div className={`${styles.weightBox} ${styles.cWeight}`}>
              <input type="number" min={0} max={100} step="any" className={styles.input} aria-label="Weight" value={i.weight}
                onChange={(e) => editItem(i.id, { weight: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })} />
              <span aria-hidden="true">%</span>
            </div>

            <button type="button" className={`${styles.remove} ${styles.cRemove}`} aria-label={`Delete ${i.title || "item"}`}
              onClick={() => removeItem(i.id)}>×</button>
          </div>
        ))}

        <button type="button" className={styles.addBtn} onClick={addItem}>
          + Add {filter === "all" ? "item" : TYPES[filter].one.toLowerCase()}
        </button>
      </section>
    </>
  );
}