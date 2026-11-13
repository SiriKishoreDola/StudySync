import { getCurrentUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Course = { code: string; name: string };
type Row = {
  id: string;
  title: string;
  type: string;
  due_date: string;
  weight: number | string | null;
  completed: boolean;
  course: Course | Course[] | null;
};

// Returns the signed-in user's requirements. Supabase's row-level security
// already limits the rows to this user, so we never ask for a user id.
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("requirements")
    .select("id, title, type, due_date, weight, completed, course:courses(code, name)")
    .eq("user_id", userId)
    .not("due_date", "is", null)
    .order("due_date", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const assignments = ((data ?? []) as unknown as Row[]).map((r) => {
    const course = Array.isArray(r.course) ? r.course[0] : r.course;
    return {
      id: r.id,
      course: course?.name || course?.code || "Course",
      name: r.title,
      dueDate: r.due_date,
      weight: Number(r.weight ?? 0),
      type: r.type,
      completed: r.completed,
    };
  });

  return Response.json({ assignments });
}
