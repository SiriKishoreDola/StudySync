import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { CATEGORIES } from '@/utils/schema';

const requirementSchema = z.object({
  title: z.string().min(1, 'Requirement title is required'),
  category: z.enum(CATEGORIES as unknown as [string, ...string[]]),
  due_date: z.string().nullable().optional(),
  weight: z.number().nullable().optional(),
});

const courseSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  syllabusId: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Course title is required'),
  code: z.string().nullable().optional(),
  term: z.string().nullable().optional(),
  requirements: z.array(requirementSchema).default([]),
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const rawBody: unknown = await req.json();
    
    const bodyObj = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as Record<string, unknown>;
    
    if (!bodyObj.term && typeof bodyObj.semester === 'string') {
      bodyObj.term = bodyObj.semester;
    }

    const validation = courseSchema.safeParse(bodyObj);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    const { userId, syllabusId, title, code, term, requirements } = validation.data;

    // Call Person 1's atomic Postgres RPC function[cite: 2]
    const { data: courseId, error } = await supabase.rpc('save_syllabus_course', {
      p_user_id: userId,
      p_syllabus_id: syllabusId ?? null,
      p_title: title,
      p_code: code ?? null,
      p_term: term ?? null,
      p_requirements: requirements, // Passed directly as native array for jsonb_to_recordset
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, courseId });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("API /api/courses Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}