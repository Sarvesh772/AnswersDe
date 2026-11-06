import { hasDatabase, sql } from "@/lib/db";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  if (!hasDatabase()) {
    return jsonError("DATABASE_URL is not set. Add it to your .env.local file.", 500);
  }
  const { id } = await params;
  try {
    const rows = await sql()`SELECT id, role, content, created_at AS "createdAt" FROM messages WHERE conversation_id = ${id} ORDER BY created_at ASC`;
    return Response.json({ messages: rows });
  } catch (err) {
    console.error("AnswerDe: load messages failed:", err);
    return jsonError("Failed to load messages.", 500);
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  if (!hasDatabase()) {
    return jsonError("DATABASE_URL is not set. Add it to your .env.local file.", 500);
  }
  const { id } = await params;
  try {
    await sql()`DELETE FROM conversations WHERE id = ${id}`;
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("AnswerDe: delete conversation failed:", err);
    return jsonError("Failed to delete conversation.", 500);
  }
}
