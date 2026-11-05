// Placeholder grading criteria. The backend will replace this with weights
// extracted from each course syllabus.

export type TaskType = "Exam" | "Project" | "Quiz" | "Assignment";

export type GradeWeight = {
  type: TaskType;
  weight: number;
  note: string;
};

export const gradeWeights: GradeWeight[] = [
  { type: "Exam", weight: 30, note: "Exam 1 & 2 · 30% each" },
  { type: "Project", weight: 10, note: "Final project · 10%" },
  { type: "Quiz", weight: 3.75, note: "3.75% each" },
  { type: "Assignment", weight: 3.75, note: "3.75% each" },
];

// Breaks ties between equally weighted types (Quiz ranks above Assignment).
const tieBreak: Record<TaskType, number> = {
  Exam: 0,
  Project: 1,
  Quiz: 2,
  Assignment: 3,
};

export const priorityOrder: GradeWeight[] = [...gradeWeights].sort(
  (a, b) => b.weight - a.weight || tieBreak[a.type] - tieBreak[b.type],
);

const priorityLabels = ["Highest", "High", "Medium", "Low"];

export type Priority = {
  rank: number;
  label: string;
  weight: number;
  note: string;
};

export function getPriority(type: TaskType): Priority {
  const index = priorityOrder.findIndex((item) => item.type === type);
  const { weight, note } = priorityOrder[index];
  return {
    rank: index + 1,
    label: priorityLabels[index] ?? "Low",
    weight,
    note,
  };
}
