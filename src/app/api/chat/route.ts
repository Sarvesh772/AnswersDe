import { SYSTEM_PROMPT } from "@/lib/prompt";
import { hasDatabase, sql } from "@/lib/db";
import { decrementDoubts, getDoubtsRemaining } from "@/lib/profile";
import { auth } from "@/lib/auth/server";
import type { ChatMessage } from "@/lib/types";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function titleFrom(text: string, max = 48): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

function extractDelta(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) return "";
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const first = choices[0] as { delta?: { content?: unknown } };
  const content = first?.delta?.content;
  return typeof content === "string" ? content : "";
}

export async function POST(req: Request) {
  // ---- 1. Require authentication ----
  let sessionUser: { id: string } | undefined;
  try {
    const { data } = await auth.getSession();
    sessionUser = data?.user;
  } catch (err) {
    console.error("AnswerDe: getSession failed:", err);
    return jsonError("Could not verify your session. Please sign in again.", 401);
  }
  if (!sessionUser?.id) {
    return jsonError("Please sign in to use AnswerDe.", 401);
  }
  const userId = sessionUser.id;

  // ---- 2. Free-trial gatekeeper ----
  let remaining = 3;
  try {
    remaining = await getDoubtsRemaining(userId);
  } catch (err) {
    console.error("AnswerDe: failed to read doubts_remaining:", err);
    return jsonError(
      "Free trial check failed. Make sure DATABASE_URL is set and you have run schema.sql (profiles table).",
      500,
    );
  }
  if (remaining <= 0) {
    return jsonError(
      "Aapke 3 free doubts khatam ho gaye hain. Please upgrade to continue.",
      403,
    );
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return jsonError(
      "DEEPSEEK_API_KEY is not set. Add it to your .env.local file.",
      500,
    );
  }

  let body: { messages?: ChatMessage[]; conversationId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return jsonError("Provide at least one message.", 400);
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userContent = lastUser?.content?.trim() ?? "";

  // ---- Persist conversation + user message (best-effort) ----
  let conversationId: string | null =
    typeof body.conversationId === "string" ? body.conversationId : null;

  if (hasDatabase()) {
    try {
      if (conversationId) {
        const existing =
          await sql()`SELECT id FROM conversations WHERE id = ${conversationId}`;
        if (existing.length === 0) conversationId = null;
      }
      if (!conversationId) {
        const inserted =
          await sql()`INSERT INTO conversations (title) VALUES (${titleFrom(userContent)}) RETURNING id`;
        conversationId = (inserted[0] as { id: string }).id;
      }
      await sql()`INSERT INTO messages (conversation_id, role, content) VALUES (${conversationId}, 'user', ${userContent})`;
      await sql()`UPDATE conversations SET updated_at = now() WHERE id = ${conversationId}`;
    } catch (err) {
      console.error("AnswerDe: failed to persist user message:", err);
      conversationId = null;
    }
  }

  // ---- Call DeepSeek (streaming) ----
  const upstream = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      temperature: 0.6,
      max_tokens: 800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    let detail = "";
    try {
      detail = (await upstream.text()).slice(0, 300);
    } catch {
      // ignore
    }
    return jsonError(`DeepSeek API error (${upstream.status}). ${detail}`, 502);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let assistantText = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";

      const handleLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) return;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]" || data === "") return;
        let payload: unknown;
        try {
          payload = JSON.parse(data);
        } catch {
          return;
        }
        const delta = extractDelta(payload);
        if (delta) {
          assistantText += delta;
          controller.enqueue(encoder.encode(delta));
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) handleLine(line);
        }
        if (buffer.trim()) handleLine(buffer);

        // Persist the assistant message after the stream completes.
        if (hasDatabase() && conversationId && assistantText.trim()) {
          try {
            await sql()`INSERT INTO messages (conversation_id, role, content) VALUES (${conversationId}, 'assistant', ${assistantText})`;
            await sql()`UPDATE conversations SET updated_at = now() WHERE id = ${conversationId}`;
          } catch (err) {
            console.error("AnswerDe: failed to persist assistant message:", err);
          }
        }

        // ---- Decrement the free doubt (after the chat was processed) ----
        try {
          await decrementDoubts(userId);
        } catch (err) {
          console.error("AnswerDe: failed to decrement doubts:", err);
        }

        controller.close();
      } catch (err) {
        console.error("AnswerDe: streaming error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      ...(conversationId ? { "x-conversation-id": conversationId } : {}),
    },
  });
}
