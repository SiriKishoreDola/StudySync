import type { Metadata } from "next";
import { placeholderStudent } from "@/lib/placeholder-student";

export const metadata: Metadata = {
  title: "Profile · StudySync",
};

const details = [
  {
    label: "SCHOOL",
    value: placeholderStudent.school,
    note: "Undergraduate · Year 2",
  },
  {
    label: "EMAIL",
    value: placeholderStudent.email,
    note: "Primary student email",
  },
];

const semester = [
  { label: "SEMESTER START", value: "September 3, 2026", note: "Fall semester" },
  { label: "SEMESTER END", value: "December 18, 2026", note: "Fall semester" },
  { label: "TIME ZONE", value: "Eastern Time (ET)", note: "America / New York" },
];

function DetailGrid({
  items,
}: {
  items: { label: string; value: string; note: string }[];
}) {
  return (
    <dl className="mt-4 grid gap-6 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] font-semibold">{item.label}</dt>
          <dd className="mt-1 font-semibold [overflow-wrap:anywhere]">
            {item.value}
          </dd>
          <dd className="text-sm">{item.note}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ProfilePage() {
  return (
    <section className="profile-page">
      <div className="flex flex-col items-center gap-2 py-1 text-center">
        <div className="avatar" aria-hidden="true">
          {placeholderStudent.initials}
        </div>
        <p className="text-[11px] font-semibold">STUDENT PROFILE</p>
        <h1 className="text-[28px] font-semibold">{placeholderStudent.name}</h1>
        <p className="text-sm">they / them</p>
      </div>

      <div className="grid flex-1 gap-5 lg:grid-cols-2">
        <section className="surface p-6">
          <h2 className="text-lg font-semibold">Student details</h2>
          <DetailGrid items={details} />
        </section>

        <section className="surface p-6">
          <h2 className="text-lg font-semibold">Semester</h2>
          <DetailGrid items={semester} />
        </section>
      </div>
    </section>
  );
}
