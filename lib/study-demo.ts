export const demoDeadlines = [
  { course: "MATH 201", title: "Problem set 4", due: "Tue, Oct 13 · 11:59 PM", status: "Not started" },
  { course: "WRIT 110", title: "Essay outline", due: "Wed, Oct 14 · 5:00 PM", status: "In progress" },
  { course: "PHYS 210", title: "Physics exam", due: "Thu, Oct 15 · 10:00 AM", status: "Not started" },
  { course: "ENGR 220", title: "Engineering project", due: "Fri, Oct 16 · 5:00 PM", status: "Not started" },
];

export const suggestedPrompts = ["What’s due this week?", "What should I start early?", "Which week is busiest?"];

export function demoResponse(question: string) {
  if (/busiest/i.test(question)) return "In this fictional example, October 12–18, 2026 is the busiest week: four deadlines across four courses. Leave a little time each day for Math and Writing, and begin Physics revision and the Engineering project early.";
  if (/due/i.test(question)) return `Fictional deadlines for October 12–18, 2026:\n\n${demoDeadlines.map(d => `${d.course}: ${d.title} — ${d.due}`).join("\n\n")}\n\nConsider checking each assignment’s requirements before planning your sessions.`;
  return "Start these two early\n\nFictional deadlines: PHYS 210 exam — Thursday, October 15 at 10 AM. ENGR 220 project — Friday, October 16 at 5 PM.\n\nMonday, October 12\n30 min: review Physics concepts.\n30 min: scope the Engineering project.\n\nTuesday, October 13\n45 min: Physics practice problems.\n30 min: outline the project.\n\nWednesday, October 14\n45 min: take a Physics practice exam.\n45 min: draft the project.\n\nThursday, October 15\n20 min: Physics review before 10 AM.\n60 min: finalize the project for Friday.\n\nLeave time for Tuesday’s Math problem set and Wednesday’s Writing outline, too. This is a preset demonstration, not an AI-generated plan.";
}
