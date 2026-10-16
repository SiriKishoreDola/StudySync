"use client";

import { useEffect, useState } from "react";
import { getPriority, priorityOrder, type TaskType } from "@/lib/priority";

type Task = {
  id: number;
  day: string;
  weekday: string;
  title: string;
  course: string;
  type: TaskType;
  effort: string;
};

type Week = {
  label: string;
  range: string;
  tasks: Task[];
};

const weeks: Week[] = [
  {
    label: "Week 03",
    range: "Sep 16 — 22",
    tasks: [
      {
        id: 1,
        day: "16",
        weekday: "MON",
        title: "Reading response",
        course: "LIT 201",
        type: "Assignment",
        effort: "1.5 hours",
      },
      {
        id: 2,
        day: "18",
        weekday: "WED",
        title: "Research proposal",
        course: "SOC 204",
        type: "Assignment",
        effort: "4 hours",
      },
      {
        id: 3,
        day: "20",
        weekday: "FRI",
        title: "Lab analysis",
        course: "BIO 118",
        type: "Assignment",
        effort: "3 hours",
      },
      {
        id: 4,
        day: "22",
        weekday: "SUN",
        title: "Quiz 1",
        course: "HIST 230",
        type: "Quiz",
        effort: "2 hours",
      },
    ],
  },
  {
    label: "Week 04",
    range: "Sep 23 — 29",
    tasks: [
      {
        id: 5,
        day: "23",
        weekday: "MON",
        title: "Sketchbook review",
        course: "ART 145",
        type: "Assignment",
        effort: "2 hours",
      },
      {
        id: 6,
        day: "25",
        weekday: "WED",
        title: "Chapter 3 quiz",
        course: "SOC 204",
        type: "Quiz",
        effort: "1 hour",
      },
      {
        id: 7,
        day: "27",
        weekday: "FRI",
        title: "Calculus problem set",
        course: "MATH 112",
        type: "Assignment",
        effort: "2 hours",
      },
      {
        id: 8,
        day: "29",
        weekday: "SUN",
        title: "Project proposal",
        course: "HIST 230",
        type: "Project",
        effort: "2.5 hours",
      },
    ],
  },
  {
    label: "Week 05",
    range: "Sep 30 — Oct 06",
    tasks: [
      {
        id: 9,
        day: "30",
        weekday: "MON",
        title: "Peer feedback",
        course: "LIT 201",
        type: "Assignment",
        effort: "1 hour",
      },
      {
        id: 10,
        day: "02",
        weekday: "WED",
        title: "Genetics quiz",
        course: "BIO 118",
        type: "Quiz",
        effort: "1.5 hours",
      },
      {
        id: 11,
        day: "04",
        weekday: "FRI",
        title: "Exam 1",
        course: "HIST 230",
        type: "Exam",
        effort: "3 hours",
      },
      {
        id: 12,
        day: "06",
        weekday: "SUN",
        title: "Composition project",
        course: "ART 145",
        type: "Project",
        effort: "4 hours",
      },
    ],
  },
];

function Timeline() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeWeek, setActiveWeek] = useState(0);
  const [showSemester, setShowSemester] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedTask(null);
        setShowSemester(false);
      }
      if (!selectedTask && !showSemester && event.key === "ArrowRight") {
        setActiveWeek((current) => Math.min(current + 1, weeks.length - 1));
      }
      if (!selectedTask && !showSemester && event.key === "ArrowLeft") {
        setActiveWeek((current) => Math.max(current - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTask, showSemester]);

  const week = weeks[activeWeek];
  const priority = selectedTask ? getPriority(selectedTask.type) : null;

  const openFromSemester = (task: Task) => {
    setShowSemester(false);
    setSelectedTask(task);
  };

  return (
    <>
      <section className="intro-row">
        <div>
          <p className="text-[11px] font-semibold">FALL SEMESTER</p>
          <h1 className="text-[28px] font-semibold">Semester planner</h1>
          <p className="mt-1 text-sm">
            Track every task across your semester, one week at a time.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span>Semester progress</span>
          <span className="progress-bar" aria-hidden="true">
            <i style={{ width: "38%" }} />
          </span>
          <strong>38%</strong>
        </div>
      </section>

      <section className="surface timeline-panel">
        <div className="timeline-toolbar">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <div className="week-switcher">
            <button
              aria-label="Show previous week's tasks"
              className="ss-button"
              disabled={activeWeek === 0}
              onClick={() => setActiveWeek((current) => current - 1)}
            >
              ←
            </button>
            <div aria-live="polite">
              <span className="block text-xs">{week.label}</span>
              <strong className="block text-sm font-semibold">
                {week.range}
              </strong>
            </div>
            <button
              aria-label="Show next week's tasks"
              className="ss-button"
              disabled={activeWeek === weeks.length - 1}
              onClick={() => setActiveWeek((current) => current + 1)}
            >
              →
            </button>
          </div>
          <button
            className="ss-button semester-view-button"
            onClick={() => setShowSemester(true)}
          >
            Semester view ↗
          </button>
        </div>

        <div className="timeline-viewport">
          <div className="timeline-track">
            <div className="week-slide">
              <div className="timeline-axis" />
              {week.tasks.map((task, index) => (
                <article
                  className={`timeline-event ${
                    index % 2 === 0 ? "event-top" : "event-bottom"
                  }`}
                  key={task.id}
                >
                  <button
                    className="event-card"
                    onClick={() => setSelectedTask(task)}
                  >
                    <span className="block text-[11px] font-semibold">
                      {task.course}
                    </span>
                    <strong className="mt-1 block truncate font-semibold">
                      {task.title}
                    </strong>
                    <span className="mt-2 block text-xs">
                      {task.type} · {task.effort}
                    </span>
                  </button>
                  <span className="event-stem" />
                  <button
                    aria-label={`View details for ${task.title}`}
                    className="event-dot"
                    onClick={() => setSelectedTask(task)}
                  >
                    <span />
                  </button>
                  <div className="event-date">
                    <strong className="text-lg font-semibold">
                      {task.day}
                    </strong>
                    <span className="text-[11px] font-semibold">
                      {task.weekday}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="timeline-footer">
          <span>Use the arrows to view the next week</span>
          <div className="segmented text-sm" role="group" aria-label="Week">
            {weeks.map((item, index) => (
              <button
                aria-pressed={index === activeWeek}
                key={item.label}
                onClick={() => setActiveWeek(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className="hidden sm:block">
            Select any task to view its priority
          </span>
        </div>
      </section>

      {showSemester && (
        <>
          <div
            className="dialog-backdrop"
            onClick={() => setShowSemester(false)}
          />
          <section
            aria-labelledby="semester-title"
            aria-modal="true"
            className="semester-modal"
            role="dialog"
          >
            <div className="dialog-header">
              <div>
                <p className="text-[11px] font-semibold">FALL SEMESTER</p>
                <h2 className="text-lg font-semibold" id="semester-title">
                  Entire semester
                </h2>
                <p className="text-sm">
                  Every upcoming task, mapped from September to October.
                </p>
              </div>
              <button
                aria-label="Close semester timeline"
                autoFocus
                className="ss-button"
                onClick={() => setShowSemester(false)}
              >
                ×
              </button>
            </div>

            <div className="dialog-body">
              <div className="semester-curve-wrap">
                <svg
                  aria-hidden="true"
                  className="semester-curve"
                  preserveAspectRatio="none"
                  viewBox="0 0 200 1440"
                >
                  <path d="M100 0 C100 25 66 35 66 60 S134 130 134 180 S66 250 66 300 S134 370 134 420 S66 490 66 540 S134 610 134 660 S66 730 66 780 S134 850 134 900 S66 970 66 1020 S134 1090 134 1140 S66 1210 66 1260 S134 1330 134 1380 C134 1410 100 1420 100 1440" />
                </svg>

                {weeks
                  .flatMap((item) => item.tasks)
                  .map((task, index) => (
                    <article
                      className={`semester-event ${
                        index % 2 === 0 ? "semester-left" : "semester-right"
                      }`}
                      key={task.id}
                    >
                      <button
                        className="semester-event-card"
                        onClick={() => openFromSemester(task)}
                      >
                        <span className="block text-[11px] font-semibold">
                          {task.course}
                        </span>
                        <strong className="mt-1 block truncate font-semibold">
                          {task.title}
                        </strong>
                        <span className="mt-1 block text-xs">
                          {task.type} · {task.effort}
                        </span>
                      </button>
                      <button
                        aria-label={`View ${task.title}`}
                        className="semester-event-dot"
                        onClick={() => openFromSemester(task)}
                      >
                        <span />
                      </button>
                      <div className="semester-event-date">
                        <strong className="text-lg font-semibold">
                          {task.day}
                        </strong>
                        <span className="text-[11px] font-semibold">
                          {task.id <= 9 ? "SEP" : "OCT"}
                        </span>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          </section>
        </>
      )}

      {selectedTask && priority && (
        <>
          <div
            className="dialog-backdrop"
            onClick={() => setSelectedTask(null)}
          />
          <aside
            aria-labelledby="task-title"
            aria-modal="true"
            className="task-drawer"
            role="dialog"
          >
            <div className="dialog-header items-center">
              <h2 className="text-lg font-semibold">Task details</h2>
              <button
                aria-label="Close task details"
                autoFocus
                className="ss-button"
                onClick={() => setSelectedTask(null)}
              >
                ×
              </button>
            </div>

            <div className="dialog-body">
              <div className="flex items-center gap-4">
                <div className="drawer-date">
                  <strong className="text-[28px] font-semibold leading-none">
                    {selectedTask.day}
                  </strong>
                  <span className="mt-1 text-[11px] font-semibold">
                    {selectedTask.weekday}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{selectedTask.course}</p>
                  <h3 className="text-2xl font-semibold" id="task-title">
                    {selectedTask.title}
                  </h3>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="detail-tile">
                  <p className="text-[11px] font-semibold">TYPE</p>
                  <p className="mt-1 text-base font-semibold">
                    {selectedTask.type}
                  </p>
                </div>
                <div className="detail-tile">
                  <p className="text-[11px] font-semibold">PRIORITY</p>
                  <p className="mt-1 text-base font-semibold">
                    {priority.label}
                  </p>
                  <p className="text-xs">{priority.note}</p>
                </div>
              </div>

              <section className="surface mt-5 p-5">
                <h3 className="text-lg font-semibold">Priority order</h3>
                <p className="mt-1 text-sm">Based on grading criteria</p>
                <ol className="mt-4 space-y-2.5">
                  {priorityOrder.map((item, index) => {
                    const isCurrent = item.type === selectedTask.type;
                    return (
                      <li
                        aria-current={isCurrent ? "true" : undefined}
                        className={`setting-row ${
                          isCurrent ? "is-current" : ""
                        }`}
                        key={item.type}
                      >
                        <span className="flex items-center gap-3">
                          <span className="course-initials">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {item.type}
                        </span>
                        <span className="text-xs">{item.note}</span>
                      </li>
                    );
                  })}
                </ol>
              </section>

              <p className="demo-note mt-5">
                Weights are placeholders until grading criteria are imported
                from each syllabus.
              </p>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

export default Timeline;
