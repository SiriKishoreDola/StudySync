import { createClient } from "@/lib/supabase/server";

// Marks one requirement done or not done. Row-level security means a user can
// only change their own rows; someone else's id simply finds nothing (404).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("requirements")
    .update({ completed: Boolean(body.completed) })
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
