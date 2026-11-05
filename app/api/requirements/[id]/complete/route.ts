import { db } from "../../../../../lib/mock-db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const item = db.assignments.find((a) => a.id === Number(id));
  if (!item) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  item.completed = Boolean(body.completed);
  return Response.json({ assignment: item });
}