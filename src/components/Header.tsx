"use client";

import { useState } from "react";
import { IconMenu, IconPlus, IconSparkles } from "./icons";

interface Props {
  onOpenSidebar: () => void;
  onNewChat: () => void;
  userName: string;
  userEmail: string;
  userImage: string | null;
  doubtsRemaining: number | null;
  onSignOut: () => void;
}

export default function Header({
  onOpenSidebar,
  onNewChat,
  userName,
  userEmail,
  userImage,
  doubtsRemaining,
  onSignOut,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = (userName || userEmail || "?").charAt(0).toUpperCase();

  const badge =
    doubtsRemaining !== null ? (
      <span
        className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-block ${
          doubtsRemaining > 0
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        Doubts left: {doubtsRemaining}
      </span>
    ) : null;

  return (
    <header className="relative flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 sm:px-4">
      <button
        onClick={onOpenSidebar}
        aria-label="Open history"
        className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 md:hidden"
      >
        <IconMenu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
          <IconSparkles className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-zinc-900">AnswerDe</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50"
        >
          <IconPlus className="h-4 w-4" />
          <span className="hidden sm:inline">New chat</span>
        </button>

        {badge}

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account menu"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-zinc-700 transition hover:ring-2 hover:ring-indigo-200"
          >
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userImage}
                alt={userName || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">{initial}</span>
            )}
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {userName || "User"}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{userEmail}</p>
                  {doubtsRemaining !== null && (
                    <p
                      className={`mt-1.5 text-xs font-semibold ${
                        doubtsRemaining > 0 ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      Doubts left: {doubtsRemaining}
                    </p>
                  )}
                </div>
                <div className="my-1 border-t border-zinc-100" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
