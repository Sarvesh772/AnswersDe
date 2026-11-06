import type { ChatMessage, Conversation } from "./types";

/** Error thrown by the chat client, carrying the HTTP status so the UI can
 *  distinguish a free-trial limit (403) from an auth failure (401). */
export class ChatError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ChatError";
    this.status = status;
  }
}

export interface MeResponse {
  user: { id: string; name: string; email: string; image: string | null };
  doubtsRemaining: number;
}

export async function fetchMe(): Promise<MeResponse> {
  const res = await fetch("/api/me", { cache: "no-store" });
  if (!res.ok) throw new Error("Not authenticated");
  return (await res.json()) as MeResponse;
}

export async function listConversations(): Promise<Conversation[]> {
  const res = await fetch("/api/conversations", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load history");
  const data = await res.json();
  return data.conversations ?? [];
}

export async function getMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const res = await fetch(`/api/conversations/${conversationId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load conversation");
  const data = await res.json();
  return data.messages ?? [];
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await fetch(`/api/conversations/${conversationId}`, { method: "DELETE" });
}

export interface StreamResult {
  conversationId: string | null;
  text: string;
}

/**
 * Stream a chat completion from /api/chat. `onChunk` receives the full
 * accumulated assistant text so far, on every streamed chunk.
 */
export async function streamChat(input: {
  messages: ChatMessage[];
  conversationId: string | null;
  onChunk: (accumulatedText: string) => void;
}): Promise<StreamResult> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: input.messages,
      conversationId: input.conversationId ?? undefined,
    }),
  });

  if (!res.ok || !res.body) {
    let message = "Something went wrong. Please try again.";
    try {
      const data = await res.json();
      if (typeof data?.error === "string") message = data.error;
    } catch {
      // ignore — fall back to the generic message
    }
    throw new ChatError(message, res.status);
  }

  const conversationId = res.headers.get("x-conversation-id");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    input.onChunk(text);
  }

  return { conversationId, text };
}
