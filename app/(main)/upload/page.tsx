import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload · StudySync",
};

export default function UploadPage() {
  return (
    <section className="profile-page">
      <div>
        <p className="text-[11px] font-semibold">FALL SEMESTER</p>
        <h1 className="text-[28px] font-semibold">Upload syllabus</h1>
        <p className="mt-1 text-sm">
          Add your course syllabi to build your semester timeline.
        </p>
      </div>

      <div className="surface upload-placeholder">
        <p className="text-lg font-semibold">Syllabus upload is coming soon</p>
        <p className="text-sm">PDF files will be supported.</p>
        <button className="ss-button primary mt-2" disabled type="button">
          Choose file
        </button>
      </div>
    </section>
  );
}
