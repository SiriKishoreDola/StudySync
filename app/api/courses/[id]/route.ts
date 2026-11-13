import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { z } from 'zod';

const updateCourseSchema = z.object({
  title: z.string().min(1).optional(),
  code: z.string().nullable().optional(),
  term: z.string().nullable().optional(),
});


export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();
  try {
    const { id } = await params;
    const body: unknown = await req.json();
    const validation = updateCourseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('courses')
      .update({ ...(validation.data.title !== undefined ? { name: validation.data.title } : {}), ...(validation.data.code !== undefined ? { code: validation.data.code } : {}), ...(validation.data.term !== undefined ? { semester: validation.data.term } : {}) })
      .eq('user_id', userId)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('user_id', userId)
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}