import Link from "next/link";
import { Newsreader } from "next/font/google";
import styles from "./courses.module.css";

// Loaded here so every page inside /courses can use it. Other pages aren't affected.
const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-courses-serif",
});

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${styles.shell} ${serif.variable}`}>
      <header className={styles.header}>
        <Link href="/" aria-label="StudySync home" className={styles.brand}>
          <svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true">
            <rect x="0" y="7" width="5" height="11" fill="currentColor" />
            <rect x="7.5" y="0" width="5" height="18" fill="currentColor" />
            <rect x="15" y="4" width="5" height="14" fill="currentColor" />
          </svg>
          StudySync
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <Link href="/" className={styles.navLink}>Home</Link>
          <Link href="/courses" className={`${styles.navLink} ${styles.navActive}`}>My Courses</Link>
        </nav>
        <Link href="/upload" className={`${styles.button} ${styles.primary}`}>Upload syllabus →</Link>
      </header>
      <main className={styles.wrap}>{children}</main>
    </div>
  );
}