import Link from "next/link";
import styles from "./courses.module.css";

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>

      <main className={styles.wrap}>{children}</main>
    </div>
  );
}