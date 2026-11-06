"use client";

import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/lib/types";
import { IconSparkles, IconUser } from "./icons";

interface Props {
  message: ChatMessage;
  streaming?: boolean;
}

export default function ChatMessageView({ message, streaming }: Props) {
  const isUser = message.role === "user";
  const isEmpty = !message.content;

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
          <IconSparkles className="h-4 w-4" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? "order-first" : ""}`}>
        {isUser ? (
          <div className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-[15px] text-white shadow-sm">
            {message.content}
          </div>
        ) : isEmpty && streaming ? (
          <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-4 py-3.5 shadow-sm">
            <span className="typing-dot h-2 w-2 rounded-full bg-zinc-400" />
            <span className="typing-dot h-2 w-2 rounded-full bg-zinc-400" />
            <span className="typing-dot h-2 w-2 rounded-full bg-zinc-400" />
          </div>
        ) : (
          <div className="answer-md rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600">
          <IconUser className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
