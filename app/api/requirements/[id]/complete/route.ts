import { getCurrentUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Marks one requirement done or not done. Row-level security means a user can
// only change their own rows; someone else's id simply finds nothing (404).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const { data, error } = await supabase
    .from("requirements")
    .update({ completed: Boolean(body.completed) })
    .eq("user_id", userId)
    .eq("id", id)
    .select("id, completed")
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ assignment: data });
}
