"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { IconSend } from "./icons";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="shrink-0 border-t border-zinc-200 bg-white px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Apna doubt poochho… (Hindi ya English)"
          className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400"
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition enabled:hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
        >
          <IconSend className="h-4 w-4" />
        </button>
      </div>
      <p className="mx-auto mt-1.5 w-full max-w-3xl text-center text-[11px] text-zinc-400">
        AnswerDe can make mistakes. Double-check important answers.
      </p>
    </div>
  );
}
