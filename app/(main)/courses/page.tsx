"use client";

import Link from "next/link";
import ProgressRing from "@/components/ProgressRing";
import Timeline from "./Timeline";
import {
  COURSE_COLORS, DAY, type CourseData, doneWeight, fmt, parseDate, relative, startOfToday, useCourses,
} from "@/utils/courses";
import styles from "./courses.module.css";


export default function CoursesPage() {
  const courses = useCourses();
  if (!courses) return <p className={styles.sub}>Loading…</p>;

  const today = startOfToday();
  const all = courses.flatMap((c) => c.items);
  const week = all.filter(
    (i) => !i.done && i.date && parseDate(i.date) >= today && parseDate(i.date).getTime() - today.getTime() <= 7 * DAY
  ).length;

  return (
    <>
      <div className={styles.top}>
        <div>
          <p className={styles.eyebrow}>MY SEMESTER</p>
          <h1 className={styles.title}>My Courses</h1>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}><b>{courses.length}</b><span>courses<br />this semester</span></div>
        <div className={styles.stat}><b>{all.length}</b><span>assignments, quizzes<br />and exams tracked</span></div>
        <div className={styles.stat}><b>{String(week).padStart(2, "0")}</b><span>due in the<br />next 7 days</span></div>
      </div>

     

      <div className={styles.grid}>
        {courses.map((c, ci) => {
          const color = COURSE_COLORS[ci % COURSE_COLORS.length];
          const next = c.items
            .filter((i) => !i.done && i.date)
            .sort((a, b) => a.date.localeCompare(b.date))[0];
          return (
            <article key={c.id} className={styles.tile} style={{ "--col": color } as React.CSSProperties}>
              <div className={styles.row}>
                <div>
                  <span className={styles.code}>{c.code}</span>
                  {/* The title link is stretched (in CSS) to cover the whole tile */}
                  <h3 className={styles.tileTitle}>
                    <Link href={`/courses/${c.id}`} className={styles.stretch}>{c.name}</Link>
                  </h3>
                  <p className={styles.sub}>{c.instructor}</p>
                </div>
                <ProgressRing percent={doneWeight(c)} caption="grade done" />
              </div>

              <div className={styles.mini}>
                <span><b>{c.items.length}</b> items</span>
                <span><b>{c.items.filter((i) => i.type === "exam").length}</b> exams</span>
                <span><b>{c.items.filter((i) => !i.done).length}</b> to go</span>
              </div>

              <Timeline items={c.items} color={color} today={today} />

              <p className={styles.sub}>
                {next ? <>Next up · <b>{next.title}</b> · {fmt(next.date)} ({relative(next.date, today)})</> : "Nothing left to do"}
              </p>

              <div className={styles.foot}>
                {/* Route for the original file: your teammate's /api/courses/[id]/syllabus */}
                <a href={`/api/courses/${c.id}/syllabus`} target="_blank" rel="noopener noreferrer"
                  className={`ss-button ${styles.lift}`}>Syllabus</a>
                <span className="ss-button primary">View &amp; edit →</span>
              </div>
            </article>
          );
        })}
      </div>

      <p className={styles.key}>
        <span><b>Ring</b> = share of the grade already finished</span>
        <span><b>●</b> deadline (filled = done)</span>
        <span><b>■</b> exam</span>
        <span><b>│</b> today</span>
        <span>Click a course to edit its items</span>
      </p>
    </>
  );
}