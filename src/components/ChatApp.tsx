"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth/client";
import type { ChatMessage, Conversation } from "@/lib/types";
import {
  ChatError,
  deleteConversation,
  fetchMe,
  getMessages,
  listConversations,
  streamChat,
} from "@/lib/client";
import Sidebar from "./Sidebar";
import WelcomeScreen from "./WelcomeScreen";
import ChatMessageView from "./ChatMessage";
import ChatInput from "./ChatInput";
import Header from "./Header";
import AuthScreen from "./AuthScreen";
import UpgradeModal from "./UpgradeModal";

export default function ChatApp() {
  const {
    data: session,
    isPending: sessionPending,
    refetch: refetchSession,
  } = authClient.useSession();
  const user = session?.user ?? null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [doubtsRemaining, setDoubtsRemaining] = useState<number | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    kind: "success" | "error";
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setDoubtsRemaining(null);
      return;
    }
    let cancelled = false;
    fetchMe()
      .then((d) => {
        if (!cancelled) setDoubtsRemaining(d.doubtsRemaining);
      })
      .catch(() => {
        if (!cancelled) setDoubtsRemaining(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    listConversations()
      .then(setConversations)
      .catch(() => setConversations([]));
  }, [userId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loadingConversation]);

  const refreshDoubts = useCallback(() => {
    fetchMe()
      .then((d) => setDoubtsRemaining(d.doubtsRemaining))
      .catch(() => {});
  }, []);

  const refreshConversations = useCallback(() => {
    listConversations()
      .then(setConversations)
      .catch(() => {});
  }, []);

  // Handle the PayU redirect back to the app (?payment=success / failure).
  useEffect(() => {
    if (!userId) return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    if (status === "success") {
      setToast({
        message: "Payment successful! Aapke 100 doubts add ho gaye hain.",
        kind: "success",
      });
      refreshDoubts();
    } else if (status === "failure") {
      setToast({
        message: "Payment failed or was cancelled. Please try again.",
        kind: "error",
      });
    }
    if (status) {
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    }
  }, [userId, refreshDoubts]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
  }, []);

  const handleSelect = useCallback(async (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
    setMessages([]);
    setLoadingConversation(true);
    try {
      setMessages(await getMessages(id));
    } catch {
      setMessages([]);
    } finally {
      setLoadingConversation(false);
    }
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      try {
        await deleteConversation(id);
      } catch {
        // already removed from the UI
      }
    },
    [activeId],
  );

  const handleSignOut = useCallback(async () => {
    await authClient.signOut().catch(() => {});
    setMessages([]);
    setActiveId(null);
    setConversations([]);
    setDoubtsRemaining(null);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming || !user) return;

      const userMessage: ChatMessage = { role: "user", content: trimmed };
      setMessages((prev) => [
        ...prev,
        userMessage,
        { role: "assistant", content: "" },
      ]);
      setIsStreaming(true);

      const apiMessages: ChatMessage[] = [...messages, userMessage];

      try {
        const result = await streamChat({
          messages: apiMessages,
          conversationId: activeId,
          onChunk: (acc) => {
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: acc };
              return copy;
            });
          },
        });

        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: result.text };
          return copy;
        });

        if (result.conversationId && result.conversationId !== activeId) {
          setActiveId(result.conversationId);
        }
        refreshConversations();
        refreshDoubts();
      } catch (err) {
        if (err instanceof ChatError) {
          if (err.status === 403) {
            setMessages((prev) => prev.slice(0, -1));
            setShowUpgrade(true);
            return;
          }
          if (err.status === 401) {
            setMessages((prev) => prev.slice(0, -1));
            await refetchSession();
            return;
          }
        }
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: `⚠️ ${message}`,
          };
          return copy;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [
      messages,
      activeId,
      isStreaming,
      user,
      refreshConversations,
      refreshDoubts,
      refetchSession,
    ],
  );

  if (sessionPending) {
    return (
      <div className="flex h-dvh items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-zinc-50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={activeId}
        onNewChat={handleNewChat}
        onSelect={handleSelect}
        onDelete={handleDelete}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          onNewChat={handleNewChat}
          userName={user.name ?? ""}
          userEmail={user.email ?? ""}
          userImage={user.image ?? null}
          doubtsRemaining={doubtsRemaining}
          onSignOut={handleSignOut}
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <WelcomeScreen onSelectSuggestion={handleSend} />
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
              {messages.map((m, i) => (
                <ChatMessageView
                  key={m.id ?? `${i}-${m.role}`}
                  message={m}
                  streaming={
                    isStreaming &&
                    i === messages.length - 1 &&
                    m.role === "assistant"
                  }
                />
              ))}
              {loadingConversation && (
                <p className="text-center text-sm text-zinc-400">
                  Loading conversation…
                </p>
              )}
            </div>
          )}
        </div>

        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </main>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />

      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-[60] flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.kind === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          <span>{toast.kind === "success" ? "✅" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
