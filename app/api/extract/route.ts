import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { extractSyllabus, type SyllabusSource } from "@/utils/gemini";

// Use the full Node.js runtime (mammoth and Buffer need it).
export const runtime = "nodejs";
// Gemini can take 10-20 seconds, so allow up to 60 on Vercel.
export const maxDuration = 60;

// The browser also checks these, but never trust the browser: check again here.
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  // 1. Get the uploaded file out of the form data.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail("We couldn't read that upload. Please try again.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return fail("No file was uploaded.", 400);

  // 2. Check type and size.
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "doc") {
    return fail(
      "Older .doc files aren't supported. Please save it as a PDF or DOCX and try again.",
      415
    );
  }
  if (extension !== "pdf" && extension !== "docx") {
    return fail("Please upload a PDF or DOCX file.", 415);
  }
  if (file.size === 0) return fail("That file looks empty.", 400);
  if (file.size > MAX_BYTES) {
    return fail("That file is too large. The maximum size is 10 MB.", 413);
  }

  // 3. Check the file's first bytes match its extension (a renamed .txt isn't a PDF).
  const bytes = Buffer.from(await file.arrayBuffer());
  const looksLikePdf = bytes.subarray(0, 5).toString("latin1") === "%PDF-";
  const looksLikeDocx = bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK": DOCX is a zip file
  if ((extension === "pdf" && !looksLikePdf) || (extension === "docx" && !looksLikeDocx)) {
    return fail("That file looks damaged or isn't really a " + extension.toUpperCase() + ".", 400);
  }

  // 4. Prepare it for Gemini.
  let source: SyllabusSource;
  if (extension === "pdf") {
    // Gemini reads PDFs directly, including scanned pages.
    source = { kind: "pdf", base64: bytes.toString("base64") };
  } else {
    try {
      // Convert to HTML (not plain text) so tables, like a weekly schedule, keep their rows.
       const { value: html } = await mammoth.convertToHtml({ buffer: bytes });
      // Images become huge base64 strings and would eat the character limit, so remove them.
      const value = html.replace(/<img[^>]*>/g, "");
      if (!value.trim()) return fail("We couldn't find any text in that document.", 422);
      source = { kind: "text", text: value };
    } catch {
      return fail("We couldn't open that DOCX file. Is it damaged?", 422);
    }
  }

  // 5. Ask Gemini and return the cleaned result.
  try {
    const result = await extractSyllabus(source);
    return NextResponse.json({ fileName: file.name, ...result });
  } catch (error) {
    // The real reason goes to the terminal; the user gets a friendly message.
    console.error("Syllabus extraction failed:", error);

    if (
      error instanceof Error &&
      error.name === "NotASyllabusError"
    ) {
      return fail("We couldn't find any course details in that file. Is it a syllabus?", 422);
    }
    const status = (error as { status?: number }).status;
    if (status === 429 || status === 503) {
      return fail(
        "The AI service is busy right now. Please try again in a minute.",
        503
      );
    }
    return fail("We couldn't read that syllabus. Please try again.", 502);
  }
}