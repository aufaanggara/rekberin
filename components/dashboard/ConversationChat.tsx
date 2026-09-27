"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: { id: string; fullName: string; username: string };
  message: string;
  createdAt: string;
}

export function ConversationChat({
  apiPath,
  viewerId,
  canSend = true,
  note,
}: {
  apiPath: string;
  viewerId: string;
  canSend?: boolean;
  note?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(apiPath, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Chat tidak dapat dimuat.");
      setMessages(payload.messages);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chat tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    setLoading(true);
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (bottomRef.current?.offsetParent) bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending || !canSend) return;
    setSending(true);
    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Pesan gagal dikirim.");
      setDraft("");
      await refresh();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Pesan gagal dikirim.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="transaction-chat-section" className="flex h-[calc(100dvh-200px)] min-h-[250px] flex-col overflow-hidden bg-white lg:h-[640px] lg:rounded-2xl lg:border lg:border-slate-200 lg:shadow-sm">
      <header className="hidden border-b border-slate-200 px-4 py-4 lg:block">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <MessageSquare className="h-5 w-5 text-blue-600" aria-hidden="true" /> Chat transaksi
        </h2>
        {note && <p className="mt-1 text-xs leading-relaxed text-slate-600">{note}</p>}
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite" aria-busy={loading}>
        {loading && <p className="text-sm text-slate-500">Memuat pesan...</p>}
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        {!loading && !error && messages.length === 0 && (
          <p className="text-sm text-slate-500">Belum ada pesan. Mulai percakapan di sini.</p>
        )}
        {messages.map((item) => {
          const own = item.sender.id === viewerId;
          return (
            <div key={item.id} className={own ? "flex justify-end" : "flex justify-start"}>
              <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm sm:max-w-[78%] ${own ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900"}`}>
                <p className={`text-xs font-bold ${own ? "text-blue-100" : "text-slate-600"}`}>{item.sender.fullName || item.sender.username}</p>
                <p className="mt-1 whitespace-pre-wrap break-words">{item.message.replace(/^\[STAGE:[A-Z]+\] /, "")}</p>
                <time className={`mt-1 block text-[11px] ${own ? "text-blue-100" : "text-slate-500"}`} dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString("id-ID")}
                </time>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {canSend ? (
        <form onSubmit={(event) => void send(event)} className="flex gap-2 border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <label htmlFor="chat-message" className="sr-only">Tulis pesan</label>
          <input
            id="chat-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={2000}
            placeholder="Tulis pesan..."
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
          <button type="submit" disabled={!draft.trim() || sending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Send className="h-4 w-4" aria-hidden="true" /> {sending ? "Mengirim..." : "Kirim"}
          </button>
        </form>
      ) : (
        <p className="border-t border-slate-200 p-3 text-sm text-slate-500">Percakapan ini sudah ditutup.</p>
      )}
    </section>
  );
}
