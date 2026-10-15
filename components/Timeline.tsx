"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";

type Task = {
  id: number;
  day: string;
  weekday: string;
  title: string;
  course: string;
  type: string;
  effort: string;
  description: string;
  steps: string[];
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
        type: "Writing",
        effort: "1.5 hours",
        description:
          "Respond to the assigned chapters with a focused analysis and two discussion questions.",
        steps: [
          "Read and annotate the chapters",
          "Select two key passages",
          "Draft the response",
          "Write discussion questions",
          "Proofread and submit",
        ],
      },
      {
        id: 2,
        day: "18",
        weekday: "WED",
        title: "Research proposal",
        course: "SOC 204",
        type: "Assignment",
        effort: "4 hours",
        description:
          "Develop a focused research question and outline the proposed methodology for your semester study.",
        steps: [
          "Review the proposal rubric",
          "Narrow the research topic",
          "Draft the research question",
          "Outline methods and sources",
          "Proofread and submit",
        ],
      },
      {
        id: 3,
        day: "20",
        weekday: "FRI",
        title: "Lab analysis",
        course: "BIO 118",
        type: "Lab report",
        effort: "3 hours",
        description:
          "Analyze this week’s experiment and present the results in a concise lab report.",
        steps: [
          "Clean the experiment data",
          "Create the results chart",
          "Interpret key findings",
          "Write the discussion",
          "Check formatting",
        ],
      },
      {
        id: 4,
        day: "22",
        weekday: "SUN",
        title: "Source annotations",
        course: "HIST 230",
        type: "Research",
        effort: "2 hours",
        description:
          "Prepare short annotations for five primary sources related to the semester research topic.",
        steps: [
          "Confirm five sources",
          "Check source credibility",
          "Summarize each source",
          "Add relevance notes",
          "Format citations",
        ],
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
        type: "Studio",
        effort: "2 hours",
        description:
          "Curate your strongest process sketches and prepare them for an individual progress review.",
        steps: [
          "Review recent sketches",
          "Tag strongest directions",
          "Add missing annotations",
          "Sequence the pages",
          "Prepare talking points",
        ],
      },
      {
        id: 6,
        day: "25",
        weekday: "WED",
        title: "Seminar discussion",
        course: "SOC 204",
        type: "Discussion",
        effort: "1 hour",
        description:
          "Lead a short seminar conversation using the assigned article and your prepared prompts.",
        steps: [
          "Re-read the article",
          "Summarize the argument",
          "Draft three prompts",
          "Find one counterpoint",
          "Practice your introduction",
        ],
      },
      {
        id: 7,
        day: "27",
        weekday: "FRI",
        title: "Calculus problem set",
        course: "MATH 112",
        type: "Problem set",
        effort: "2 hours",
        description:
          "Complete the assigned set on derivatives, including two written-response challenge problems.",
        steps: [
          "Review lecture examples",
          "Complete questions 1–12",
          "Attempt challenge problems",
          "Check and correct answers",
          "Upload a clean scan",
        ],
      },
      {
        id: 8,
        day: "29",
        weekday: "SUN",
        title: "Project outline",
        course: "HIST 230",
        type: "Planning",
        effort: "2.5 hours",
        description:
          "Turn your initial research into a structured outline for the upcoming history project.",
        steps: [
          "Review research notes",
          "Define the main claim",
          "Group supporting evidence",
          "Build section headings",
          "Check the argument flow",
        ],
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
        type: "Workshop",
        effort: "1 hour",
        description:
          "Give specific, constructive feedback on two classmates’ comparative essay drafts.",
        steps: [
          "Read both drafts",
          "Mark strong arguments",
          "Note unclear sections",
          "Write actionable feedback",
          "Submit review notes",
        ],
      },
      {
        id: 10,
        day: "02",
        weekday: "WED",
        title: "Data worksheet",
        course: "BIO 118",
        type: "Worksheet",
        effort: "1.5 hours",
        description:
          "Complete the genetics data worksheet and show your reasoning for each conclusion.",
        steps: [
          "Review the genetics model",
          "Complete data tables",
          "Show calculations",
          "Answer analysis questions",
          "Check your reasoning",
        ],
      },
      {
        id: 11,
        day: "04",
        weekday: "FRI",
        title: "Midterm study guide",
        course: "HIST 230",
        type: "Exam prep",
        effort: "3 hours",
        description:
          "Create a complete study guide covering lectures, readings, and primary sources from weeks 1–5.",
        steps: [
          "Organize notes by theme",
          "Create an event timeline",
          "Define key terms",
          "Draft essay outlines",
          "Complete a recall test",
        ],
      },
      {
        id: 12,
        day: "06",
        weekday: "SUN",
        title: "Composition draft",
        course: "ART 145",
        type: "Studio",
        effort: "4 hours",
        description:
          "Develop a refined composition draft that applies feedback from your sketchbook review.",
        steps: [
          "Revisit critique notes",
          "Choose a direction",
          "Create three variations",
          "Refine the strongest draft",
          "Document your process",
        ],
      },
    ],
  },
];

function Timeline() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
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

  const openTask = (task: Task) => {
    setSelectedTask(task);
    setCompletedSteps([]);
  };

  const toggleStep = (index: number) => {
    setCompletedSteps((current) =>
      current.includes(index)
        ? current.filter((step) => step !== index)
        : [...current, index],
    );
  };

  return (
    <>
      <section className="intro-row">
        <div>
          <div className="eyebrow mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
            SEMESTER PLANNER
          </div>
          <h1 className="text-[18px] font-medium tracking-[-0.035em] text-zinc-700 md:text-[21px]">
            Track every task across your semester, one week at a time.
          </h1>
        </div>
        <div className="progress-compact">
          <span>Semester progress</span>
          <div>
            <i />
          </div>
          <strong>38%</strong>
        </div>
      </section>

      <section className="timeline-panel">
        <div className="timeline-toolbar">
          <h2>Timeline</h2>
          <div className="week-switcher">
            <button
              aria-label="Show previous week's tasks"
              disabled={activeWeek === 0}
              onClick={() => setActiveWeek((current) => current - 1)}
            >
              <Icon name="arrow" size={16} />
            </button>
            <div>
              <span>{weeks[activeWeek].label}</span>
              <strong>{weeks[activeWeek].range}</strong>
            </div>
            <button
              aria-label="Show next week's tasks"
              disabled={activeWeek === weeks.length - 1}
              onClick={() => setActiveWeek((current) => current + 1)}
            >
              <Icon name="arrow" size={16} />
            </button>
          </div>
          <button
            className="semester-view-button"
            onClick={() => setShowSemester(true)}
          >
            <Icon name="calendar" size={14} />
            Semester view
          </button>
        </div>

        <div className="timeline-viewport">
          <div
            className="timeline-track"
            style={{ transform: `translateX(-${activeWeek * 100}%)` }}
          >
            {weeks.map((week, weekIndex) => (
              <div className="week-slide" key={week.label}>
                <div className="timeline-axis" />
                {week.tasks.map((task, index) => {
                  const isTop = index % 2 === 0;
                  const tabIndex = activeWeek === weekIndex ? 0 : -1;
                  return (
                    <article
                      className={`timeline-event ${
                        isTop ? "event-top" : "event-bottom"
                      }`}
                      key={task.id}
                    >
                      <button
                        className="event-card"
                        onClick={() => openTask(task)}
                        tabIndex={tabIndex}
                      >
                        <span className="event-course">{task.course}</span>
                        <strong>{task.title}</strong>
                        <span className="event-effort">
                          <Icon name="clock" size={13} />
                          {task.effort}
                        </span>
                      </button>
                      <span className="event-stem" />
                      <button
                        aria-label={`View plan for ${task.title}`}
                        className="event-dot"
                        onClick={() => openTask(task)}
                        tabIndex={tabIndex}
                      >
                        <span />
                      </button>
                      <div className="event-date">
                        <strong>{task.day}</strong>
                        <span>{task.weekday}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="timeline-footer">
          <span>Use the arrows to view the next week</span>
          <div className="slide-dots" aria-label="Timeline week position">
            {weeks.map((week, index) => (
              <button
                aria-label={`View ${week.label}`}
                className={index === activeWeek ? "active" : ""}
                key={week.label}
                onClick={() => setActiveWeek(index)}
              />
            ))}
          </div>
          <span className="hidden sm:block">
            Select any task to view its plan
          </span>
        </div>
      </section>

      <div
        className={`semester-backdrop ${showSemester ? "is-open" : ""}`}
        onClick={() => setShowSemester(false)}
      />
      <section
        aria-hidden={!showSemester}
        aria-label="Entire semester timeline"
        className={`semester-modal ${showSemester ? "is-open" : ""}`}
      >
        <div className="semester-modal-header">
          <div>
            <span className="eyebrow">FALL SEMESTER</span>
            <h2>Entire semester</h2>
            <p>Every upcoming task, mapped from September to October.</p>
          </div>
          <button
            aria-label="Close semester timeline"
            className="close-button"
            onClick={() => setShowSemester(false)}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="semester-modal-scroll">
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
              .flatMap((week) => week.tasks)
              .map((task, index) => {
                const isLeft = index % 2 === 0;
                const month = task.id <= 9 ? "SEP" : "OCT";
                return (
                  <article
                    className={`semester-event ${
                      isLeft ? "semester-left" : "semester-right"
                    }`}
                    key={task.id}
                  >
                    <button
                      className="semester-event-card"
                      onClick={() => {
                        setShowSemester(false);
                        openTask(task);
                      }}
                    >
                      <span>{task.course}</span>
                      <strong>{task.title}</strong>
                      <small>
                        {task.type} · {task.effort}
                      </small>
                    </button>
                    <button
                      aria-label={`View ${task.title}`}
                      className="semester-event-dot"
                      onClick={() => {
                        setShowSemester(false);
                        openTask(task);
                      }}
                    >
                      <span />
                    </button>
                    <div className="semester-event-date">
                      <strong>{task.day}</strong>
                      <span>{month}</span>
                    </div>
                  </article>
                );
              })}
          </div>
        </div>
      </section>

      <div
        className={`drawer-backdrop ${selectedTask ? "is-open" : ""}`}
        onClick={() => setSelectedTask(null)}
      />
      <aside
        aria-hidden={!selectedTask}
        aria-label="Task details"
        className={`task-drawer ${selectedTask ? "is-open" : ""}`}
      >
        {selectedTask && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-black/8 px-6 py-5 sm:px-8">
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
                TASK DETAILS
              </span>
              <button
                aria-label="Close task details"
                className="close-button"
                onClick={() => setSelectedTask(null)}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="drawer-scroll flex-1 overflow-y-auto px-6 py-7 sm:px-8">
              <div className="mb-7 flex items-center gap-4">
                <div className="drawer-date">
                  <strong>{selectedTask.day}</strong>
                  <span>{selectedTask.weekday}</span>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold tracking-[0.12em] text-zinc-600">
                    {selectedTask.course}
                  </p>
                  <h2 className="text-[26px] font-medium leading-tight tracking-[-0.04em]">
                    {selectedTask.title}
                  </h2>
                </div>
              </div>

              <p className="mb-7 text-sm leading-6 text-zinc-600">
                {selectedTask.description}
              </p>

              <div className="mb-8 grid grid-cols-2 gap-3">
                <div className="info-tile">
                  <span>EST. EFFORT</span>
                  <strong>{selectedTask.effort}</strong>
                </div>
                <div className="info-tile">
                  <span>TYPE</span>
                  <strong>{selectedTask.type}</strong>
                </div>
              </div>

              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="eyebrow mb-2">PLAN OF ACTION</p>
                  <h3 className="text-lg font-semibold tracking-[-0.03em]">
                    Break it into steps
                  </h3>
                </div>
                <span className="text-xs text-zinc-600">
                  {completedSteps.length}/{selectedTask.steps.length}
                </span>
              </div>

              <div className="space-y-2">
                {selectedTask.steps.map((step, index) => {
                  const done = completedSteps.includes(index);
                  return (
                    <button
                      className={`plan-step ${done ? "is-done" : ""}`}
                      key={step}
                      onClick={() => toggleStep(index)}
                    >
                      <span className="step-number">
                        {done ? (
                          <Icon name="check" size={14} />
                        ) : (
                          String(index + 1).padStart(2, "0")
                        )}
                      </span>
                      <span>{step}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-black/8 p-5 sm:px-8">
              <button
                className="primary-button"
                onClick={() => setSelectedTask(null)}
              >
                Add plan to my week
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default Timeline;
