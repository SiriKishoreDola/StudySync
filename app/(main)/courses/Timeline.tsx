import { type Item, DAY, fmt, parseDate } from "@/utils/courses";
import styles from "./courses.module.css";

// One dot per dated item, spread from the first to the last due date.
// Filled = done, square = exam, vertical line = today.
export default function Timeline({
  items, color, today, onHover,
}: {
  items: Item[];
  color: string;
  today: Date;
  onHover?: (item: Item | null) => void;
}) {
  const dated = items.filter((i) => i.date);
  if (dated.length === 0) return <p className={styles.sub}>No dated items yet.</p>;

  const times = dated.map((i) => parseDate(i.date).getTime());
  const start = Math.min(...times);
  const end = Math.max(...times);
  const span = end - start || DAY; // avoids dividing by zero when there's one date
  const at = (t: number) => ((t - start) / span) * 100;
  const todayShown = today.getTime() >= start && today.getTime() <= end;

  return (
    <div>
      <div className={styles.tl} style={{ "--col": color } as React.CSSProperties}>
        {dated.map((i) => (
          <span
            key={i.id}
            title={`${i.title} · ${fmt(i.date)}`}
            className={`${styles.dot} ${i.done ? styles.dotDone : ""} ${i.type === "exam" ? styles.dotExam : ""}`}
            style={{ left: `${at(parseDate(i.date).getTime())}%` }}
            onMouseEnter={() => onHover?.(i)}
            onMouseLeave={() => onHover?.(null)}
          />
        ))}
        {todayShown && <span className={styles.today} style={{ left: `${at(today.getTime())}%` }} />}
      </div>
      <div className={styles.ends}>
        <span>{fmt(dated.find((i) => parseDate(i.date).getTime() === start)!.date)}</span>
        <span>{fmt(dated.find((i) => parseDate(i.date).getTime() === end)!.date)}</span>
      </div>
    </div>
  );
}