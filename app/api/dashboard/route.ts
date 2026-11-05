import { db } from "../../../lib/mock-db";

export async function GET() {
  return Response.json({ assignments: db.assignments });
}