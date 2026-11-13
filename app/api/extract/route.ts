import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


    // 1. Extract the file from the incoming FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded in form data' },
        { status: 400 }
      );
    }

    const originalFilename = file.name;
    const fileType = file.type || 'application/pdf';

    // Default test user ID (replace with real auth user ID when ready)

    const filePath = `${userId}/${crypto.randomUUID()}.${originalFilename.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "pdf"}`;

    // 2. Upload file directly to Supabase Storage bucket 'syllabi'
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('syllabi')
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload to storage: ${uploadError.message}`);
    }

    // 3. Create initial database row with 'pending' status
    const { data: syllabusRow, error: dbError } = await supabase
      .from('syllabi')
      .insert({
        user_id: userId,
        file_path: filePath,
        file_name: originalFilename,
        status: 'pending',
      })
      .select('id')
      .single();

    if (dbError || !syllabusRow) {
      throw new Error(dbError?.message || 'Failed to create database record');
    }

    const syllabusId: string = syllabusRow.id;

    try {
      // 4. Encode buffer to base64 and structure inline data payload safely
      const base64Pdf = buffer.toString('base64');
      const promptText = `Extract course details from this syllabus. Return strictly as valid JSON with these exact keys:
        - "title": (string, the name of the course)
        - "code": (string, the course code like CS101)
        - "semester": (string)
        - "instructor": (string)
        - "requirements": (array of objects, each containing:
            - "name": string
            - "category": MUST BE EXACTLY ONE OF: "assignment", "exam", "quiz", "project", "reading"
            - "dueDate": string (YYYY-MM-DD format or null)
            - "weight": string or number
)`;

      let response;
      const retries = 3;
      let delay = 2000;

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite', // High quota tier (500 requests/day)
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: fileType === 'application/pdf' ? 'application/pdf' : 'application/octet-stream',
                      data: base64Pdf,
                    },
                  },
                  {
                    text: promptText,
                  },
                ],
              },
            ],
            config: {
              responseMimeType: 'application/json',
              maxOutputTokens: 2048,
            },
          });
          break; // Success! Exit retry loop
        } catch (apiErr: unknown) {
          const err = apiErr as { status?: number; message?: string };
          const isOverloaded =
            err?.status === 503 ||
            err?.status === 429 ||
            err?.message?.includes('503') ||
            err?.message?.includes('429') ||
            err?.message?.includes('high demand') ||
            err?.message?.includes('overloaded');

          if (isOverloaded && attempt < retries) {
            console.warn(`Gemini high demand / rate limit (Attempt ${attempt}/${retries}). Retrying in ${delay / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
          } else {
            throw apiErr;
          }
        }
      }

      const rawText = response?.text ? response.text.trim() : '{}';

      // Safely parse JSON with markdown cleaning
      let extractedData: unknown;
      try {
        const cleanJson = rawText.replace(/^```json\s*|^```\s*|\s*```$/g, '').trim();
        extractedData = JSON.parse(cleanJson);
      } catch (parseErr: unknown) {
        const errorMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        throw new Error(`Failed to parse AI JSON response (${errorMsg}): ${rawText.slice(0, 100)}...`);
      }

      // 5. Update database record status to 'success'
      await supabase
        .from('syllabi')
        .update({ status: 'extracted' })
        .eq('user_id', userId)
      .eq('id', syllabusId);

      return NextResponse.json({ syllabusId, extractedData });
    } catch (extractionErr: unknown) {
      const errorMessage = extractionErr instanceof Error ? extractionErr.message : String(extractionErr);

      // Record failure state in database
      await supabase
        .from('syllabi')
        .update({ status: 'failed', error: errorMessage })
        .eq('user_id', userId)
      .eq('id', syllabusId);

      return NextResponse.json({ error: errorMessage, syllabusId }, { status: 500 });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
