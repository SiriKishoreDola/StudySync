import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { z } from 'zod';
import { CATEGORIES } from '@/utils/schema';

const updateRequirementSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.enum(CATEGORIES as unknown as [string, ...string[]]).optional(),
  due_date: z.string().nullable().optional(),
  weight: z.number().nullable().optional(),
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
    const validation = updateRequirementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('requirements')
      .update({ ...validation.data, category: undefined, ...(validation.data.category !== undefined ? { type: validation.data.category } : {}) })
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
      .from('requirements')
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