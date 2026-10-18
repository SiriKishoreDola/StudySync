import Link from "next/link";
import { Newsreader } from "next/font/google";
import styles from "./page.module.css";

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-landing-serif",
});

// The four category tabs in the review preview (10 assignments, 2 exams, ...).
// "active: true" marks the tab that is highlighted.
const stats = [
  { count: 10, label: "Assignments", active: true },
  { count: 2, label: "Exams" },
  { count: 1, label: "Project" },
  { count: 5, label: "Readings" },
];

// The rows in the requirements table.
const requirements = [
  { type: "ASSIGNMENT", title: "Research proposal", date: "Oct 14", weight: "8%" },
  { type: "EXAM", title: "Midterm exam", date: "Oct 16", weight: "15%" },
  { type: "PROJECT", title: "Group presentation", date: "Oct 21", weight: "10%" },
];


const steps = [
  "Upload each course syllabus",
  "Verify the important details",
  "See your complete semester timeline",
];

// Decorative chart: heights are percentages. The real chart on /semester will use Recharts.
const bars = [40, 58, 34, 76, 100, 64, 44, 82];
const peakIndex = 4;

const features = [
  {
    n: "01",
    title: "Nothing gets lost",
    body: "Assignments, exams, projects, and readings organized across every course.",
  },
  {
    n: "02",
    title: "You stay in control",
    body: "Confirm every extracted detail before it appears in your semester plan.",
  },
];

function Brand() {
  return (
    <span className={styles.brand}>
      <svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true">
        <rect x="0" y="7" width="5" height="11" fill="currentColor" />
        <rect x="7.5" y="0" width="5" height="18" fill="currentColor" />
        <rect x="15" y="4" width="5" height="14" fill="currentColor" />
      </svg>
      StudySync
    </span>
  );
}


export default function Home() 
{
  return (
    <div className={`${styles.page} ${serif.variable}`}>
      <header className={styles.header}>
        <Link href="/" aria-label="StudySync home">
          <Brand />
        </Link>

        <nav className={styles.nav} aria-label="Main">
          <Link href="/" aria-current="page" className={`${styles.navLink} ${styles.navActive}`}>
            Home
          </Link>
          <Link href="/upload" className={`${styles.button} ${styles.primary}`}>
            Upload Syllabus →
          </Link>
        </nav>
      </header>
      <main>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>
            <span className={styles.marker} aria-hidden="true"/>
            AI-powered semester planning
          </p>

          <h1 className={styles.title}>
            Every syllabus.
            <span className={styles.titleSoft}> One clear plan.</span>
          </h1>

          <p className={styles.lead}>
            Upload your course syllabus and turn scattered deadlines into one semester timeline you can actually plan around.
          </p>

          <Link href="/upload" className={`${styles.button} ${styles.primary} ${styles.large}`}>
            Upload Syllabus →
          </Link>

          <ul className={styles.trust}>
            <li>✓ You confirm every detail</li>
            <li>✓ Your files stay private</li>
          </ul>
        </section>
        {/*Product Preview section*/}
        <section aria-label="Product preview">
          <div className={styles.frame}>
            <div className={styles.window}>
              <div className={styles.chrome}>
                <span className={styles.dots} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className={styles.url}>studysync / review</span>
              </div>
              <div className={styles.canvas}>
                <div className={`${styles.card} ${styles.reviewCard}`}>
                  <p className={styles.eyebrow}>AI EXTRACTION COMPLETE</p>
                  <h2 className={styles.reviewTitle}>Check every detail.</h2>
                  <p className={styles.found}>✓ 18 items found</p>

                  <div className={styles.field}>
                    <div>
                      <p className={styles.fieldLabel}>COURSE</p>
                      <p className={styles.fieldValue}>
                        CS 101 · Introduction to Computer Science
                      </p>
                    </div>
                    <span className={styles.confirmed}>✓ Found</span>
                  </div>

                  <div className={styles.field}>
                    <div>
                      <p className={styles.fieldLabel}>SEMESTER</p>
                      <p className={styles.fieldValue}>Fall 2026</p>
                    </div>
                    <span className={styles.confirmed}>✓ Found</span>
                  </div>

                  <div className={styles.reqHead}>
                    <p className={styles.fieldLabel}>ACADEMIC REQUIREMENTS</p>
                    <p className={styles.hint}>Select any field to edit</p>
                  </div>

                  <div className={styles.tabs}>
                    {stats.map((s) => (
                      <div
                        key={s.label}
                        className={`${styles.tab} ${
                          s.active ? styles.tabActive : ""
                        }`}
                      >
                        <span className={styles.tabCount}>{s.count}</span>
                        <span className={styles.tabLabel}>{s.label}</span>
                      </div>
                    ))}
                  </div>

                  <ul className={styles.reqList}>
                    {requirements.map((r) => (
                      <li key={r.title} className={styles.reqRow}>
                        <span className={styles.reqType}>{r.type}</span>
                        <span className={styles.reqTitle}>{r.title}</span>
                        <span className={styles.reqDate}>{r.date}</span>
                        <span className={styles.reqWeight}>{r.weight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
            

                <div className={styles.toast} role="status">
                  <span className={styles.toastIcon} aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <span className={styles.toastLabel}>READY FOR REVIEW</span>
                    <span className={styles.toastText}>
                      Check every detail before you save
                    </span>
                  </span>
                </div>
              </div>
    
            </div>
          </div>
          <div className={styles.strip}>
            <div className={styles.stripInner}>
              <p className={styles.stripLabel}>FROM FILES TO A PLAN</p>
              {steps.map((step, i) => (
                <div key={step} className={styles.step}>
                  {/* i starts at 0, so i + 1 gives 1, 2, 3.
                      padStart(2, "0") turns 1 into "01". */}
                  <span className={styles.stepNum}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className={styles.workload}>
          <div className={styles.workloadHead}>
            <p className={styles.eyebrow}>PLAN AHEAD, NOT BEHIND</p>
            <h2 className={styles.workloadTitle}>
              See the demanding weeks before they arrive.
            </h2>
          </div>
          <div className={styles.cards}>
            {/* Chart card */}
            <div className={`${styles.card} ${styles.chartCard}`}>
              {/* role="img" + aria-label describe the chart to screen readers */}
              <div
                className={styles.bars}
                role="img"
                aria-label="Bar chart: workload peaks in the week of October 19 to 25"
              >
                {bars.map((h, i) => (
                  <div
                    key={i}
                    // inline style sets each bar's height from the array (e.g. 40%)
                    style={{ height: `${h}%` }}
                    // the tallest bar gets the extra dark class
                    className={`${styles.bar} ${
                      i === peakIndex ? styles.barPeak : ""
                    }`}
                  />
                ))}
              </div>
              <div className={styles.chartMeta}>
                <p className={styles.chartLabel}>WEEKLY WORKLOAD</p>
                <p className={styles.chartDate}>October 19–25</p>
                <p className={styles.chartNote}>High workload · 4 deadlines</p>
              </div>
            </div>
            {features.map((f) => (
              <article key={f.n} className={`${styles.card} ${styles.feature}`}>
                <span className={styles.featureNum}>{f.n}</span>
                <div>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureBody}>{f.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}