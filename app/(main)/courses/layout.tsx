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

      <main className={styles.wrap}>{children}</main>
    </div>
  );
}