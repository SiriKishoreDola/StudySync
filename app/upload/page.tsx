"use client";

import { type DragEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Newsreader } from "next/font/google";
import styles from "./page.module.css";

const serif = Newsreader({
    subsets: ["latin"],
    style: ["normal", "italic"],
    variable: "--font-upload-serif",
});

//---------------Rules for what we accept for upload------------------
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024; // 10 MB in bytes
const ALLOWED_FILE_TYPES = ["pdf","docx"];

const findList = [
  { n: "01", title: "Course details", body: "Name, code, and instructor" },
  { n: "02", title: "Academic work", body: "Assignments, exams, and projects" },
  { n: "03", title: "Important dates", body: "Deadlines and scheduled classes" },
];

//Check if if the file is valid based on size and type. 
// Return null if valid, otherwise return an error message.
function validateFile(file: File): string | null
{
    //Take the text after the last period and check if it is in the allowed file types
    const extension = file.name.split('.').pop()?.toLowerCase() ?? "";
    if(!ALLOWED_FILE_TYPES.includes(extension))
    {
        return 'Invalid file type. Please upload a PDF or DOCX file.';
    }
    if(file.size > MAX_SIZE_BYTES)
    {
        return `File size exceeds ${MAX_SIZE_MB} MB. Please upload a smaller file.`;
    }
    if(file.size === 0)
    {
        return 'The file looks empty. Please upload a valid syllabus file.';
    }
    return null;
}

//Format the file size in a human-readable way (e.g., "2.5 MB")
function formatSize(bytes: number): string
{
    if(bytes < 1024 * 1024)
    {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// A tray with an arrow pointing up (the standard "upload" icon).
function UploadIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}

// A check mark, shown once a file is chosen.
function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

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

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function chooseFile(selectedFile?: File) {
    if (!selectedFile) return;

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) 
  {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  // Runs when "Read syllabus" is clicked.
   async function handleRead() {
    if (!file || loading) return;

    setLoading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/extract", { method: "POST", body });
      // The route answers with JSON: the extracted data, or { error: "..." }.
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Something went wrong while reading the file.");
      }

      // Save the result so the review page can read it, then go there.
      sessionStorage.setItem("studysync:extraction", JSON.stringify(data));
      router.push("/review");
    } catch (err) {
      // A TypeError means the request itself failed (offline, server not running).
      setError(
        err instanceof Error && !(err instanceof TypeError)
          ? err.message
          : "We couldn't reach the server. Check your connection and try again."
      );
      setLoading(false);
    }
  }

  return (
    <div className={`${styles.page} ${serif.variable}`}>
      {/* ===== Header ===== */}
      <header className={styles.header}>
        <Link href="/" aria-label="StudySync home">
          <Brand />
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
        </nav>
      </header>

      <main>
        {/*Step bar: back link, progress segments, "Step 1 of 2" */}
        <div className={styles.subbar}>
          <Link href="/" className={styles.back}>
            ← Back home
          </Link>

          {/* Two segments; only the first is filled because we're on step 1 */}
          <div className={styles.progress} aria-hidden="true">
            <span className={`${styles.segment} ${styles.segmentActive}`} />
            <span className={styles.segment} />
          </div>

          <p className={styles.stepCount}>STEP 1 OF 2</p>
        </div>

        <div className={styles.layout}>
          <section>
            <p className={styles.num}>01</p>
            <p className={styles.eyebrow}>ADD A COURSE</p>
            <h1 className={styles.heading}>Start with a syllabus.</h1>
            <p className={styles.intro}>
              We&apos;ll pull out the important academic details. You&apos;ll
              review all of them in the next step.
            </p>

            <p className={styles.findLabel}>WHAT WE&apos;LL FIND</p>
            <ul className={styles.findList}>
              {findList.map((item) => (
                <li key={item.n} className={styles.findItem}>
                  <span className={styles.findNum}>{item.n}</span>
                  <span>
                    <span className={styles.findTitle}>{item.title}</span>
                    <span className={styles.findBody}>{item.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Right column: the upload card*/}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardIcon} aria-hidden="true">
                <UploadIcon />
              </span>
              <div>
                <h2 className={styles.cardTitle}>Upload syllabus</h2>
                <p className={styles.cardSub}>
                  PDF or DOCX · Maximum {MAX_SIZE_MB} MB
                </p>
              </div>
            </div>

            {/* The drop area. The three on-Drag handlers make drag-and-drop work;
                the button inside handles clicking (and keyboard use). */}
            <div
              className={`${styles.dropzone} ${
                dragging ? styles.dragging : ""
              }`}
              onDragOver={(event) => {
                // required, or the browser won't allow dropping
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {/* The real file input is hidden. The button below opens it. */}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx"
                hidden
                onChange={(event) => {
                  chooseFile(event.target.files?.[0]);
                  // Clear it so choosing the same file again still triggers onChange.
                  event.target.value = "";
                }}
              />

              <button
                type="button"
                className={styles.dropButton}
                onClick={() => inputRef.current?.click()}
              >
                <span
                  className={`${styles.dropIcon} ${
                    file ? styles.dropIconDone : ""
                  }`}
                  aria-hidden="true"
                >
                  {file ? <CheckIcon /> : <UploadIcon size={20} />}
                </span>

                {/* Two versions of the text: one once a file is chosen, one before */}
                {file ? (
                  <>
                    <span className={styles.dropTitle}>{file.name}</span>
                    <span className={styles.dropHint}>
                      {formatSize(file.size)} · Ready to process · Click to
                      replace
                    </span>
                  </>
                ) : (
                  <>
                    <span className={styles.dropTitle}>
                      Drop your syllabus here
                    </span>
                    <span className={styles.dropHint}>or click to browse</span>
                  </>
                )}
              </button>
            </div>

            {/* Error message. role="alert" makes screen readers announce it. */}
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <div className={styles.note}>
              <strong>No setup needed</strong>
              StudySync will read the course name, code, semester, assignments,
              and dates directly from your syllabus.
            </div>

            {loading && (
              <p className={styles.private} role="status">
                Reading your syllabus. This usually takes under 20 seconds, but it can take
                up to a minute when the AI is busy.
              </p>
            )}
            <div className={styles.footer}>
              <p className={styles.private}>◇ Private and securely processed</p>

              {/* Disabled until a file is chosen, and while reading */}
              <button
                type="button"
                className={`${styles.button} ${styles.primary}`}
                disabled={!file || loading}
                onClick={handleRead}
              >
                {loading ? "Reading syllabus…" : "Read syllabus →"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}