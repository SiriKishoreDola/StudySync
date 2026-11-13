import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';


export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId parameter' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('requirements')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, requirements: data });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}