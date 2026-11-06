export type Role = "user" | "assistant";

export interface ChatMessage {
  id?: string;
  role: Role;
  content: string;
  createdAt?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
