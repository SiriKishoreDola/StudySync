import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { z } from 'zod';
import { CATEGORIES } from '@/utils/schema';

const requirementSchema = z.object({
  title: z.string().min(1, 'Requirement title is required'),
  category: z.enum(CATEGORIES as unknown as [string, ...string[]]),
  due_date: z.string().nullable().optional(),
  weight: z.number().nullable().optional(),
});

const courseSchema = z.object({
  syllabusId: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Course title is required'),
  code: z.string().nullable().optional(),
  term: z.string().nullable().optional(),
  requirements: z.array(requirementSchema).default([]),
});


export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();
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

    const { syllabusId, title, code, term, requirements } = validation.data;

    // Call Person 1's atomic Postgres RPC function[cite: 2]
    const { data: courseId, error } = await supabase.rpc('save_course', {
      p_course: { name: title, code: code ?? '', semester: term ?? '' },
      p_syllabus_id: syllabusId ?? null,
      p_requirements: requirements.map(item => ({ type: item.category, title: item.title, date: item.due_date ?? '', weight: item.weight ?? null })),
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