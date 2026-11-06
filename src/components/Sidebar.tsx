"use client";

import type { Conversation } from "@/lib/types";
import { IconPlus, IconSparkles, IconTrash, IconX } from "./icons";

interface Props {
  open: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({
  open,
  onClose,
  conversations,
  activeId,
  onNewChat,
  onSelect,
  onDelete,
}: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 px-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <IconSparkles className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-zinc-900">
              AnswerDe
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 md:hidden"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50"
          >
            <IconPlus className="h-4 w-4" />
            New chat
          </button>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto px-3 pb-3">
          {conversations.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-zinc-400">
              No conversations yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => (
                <li key={c.id} className="group relative flex items-center">
                  <button
                    onClick={() => onSelect(c.id)}
                    className={`flex-1 truncate rounded-lg px-3 py-2 pr-8 text-left text-sm transition ${
                      activeId === c.id
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {c.title}
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    aria-label="Delete conversation"
                    className="absolute right-1 rounded-md p-1.5 text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-red-500 group-hover:opacity-100"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-zinc-200 p-3 text-center text-[11px] text-zinc-400">
          Class 10–12 · Step-by-step doubt solver
        </div>
      </aside>
    </>
  );
}
