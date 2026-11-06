import { hasDatabase, sql } from "@/lib/db";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET() {
  if (!hasDatabase()) {
    return jsonError(
      "DATABASE_URL is not set. Add it to your .env.local file.",
      500,
    );
  }
  try {
    const rows = await sql()`SELECT id, title, created_at AS "createdAt", updated_at AS "updatedAt" FROM conversations ORDER BY updated_at DESC LIMIT 100`;
    return Response.json({ conversations: rows });
  } catch (err) {
    console.error("AnswerDe: list conversations failed:", err);
    return jsonError("Failed to load conversations.", 500);
  }
}

export async function POST(req: Request) {
  if (!hasDatabase()) {
    return jsonError("DATABASE_URL is not set. Add it to your .env.local file.", 500);
  }

  let title = "New chat";
  try {
    const body = await req.json();
    if (typeof body?.title === "string" && body.title.trim()) {
      title = body.title.trim().slice(0, 80);
    }
  } catch {
    // use default title
  }

  try {
    const rows = await sql()`INSERT INTO conversations (title) VALUES (${title}) RETURNING id, title, created_at AS "createdAt", updated_at AS "updatedAt"`;
    return Response.json(rows[0], { status: 201 });
  } catch (err) {
    console.error("AnswerDe: create conversation failed:", err);
    return jsonError("Failed to create conversation.", 500);
  }
}
