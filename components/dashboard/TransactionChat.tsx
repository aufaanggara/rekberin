"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Send, ShieldCheck, User, Store, Lock, Info, Image as ImageIcon, X, ZoomIn, Paperclip, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { ChatSenderRole, TransactionStatus } from "@/types";
import { toast } from "sonner";

interface TransactionChatProps {
  transactionId: string;
  defaultRole?: ChatSenderRole;
  defaultUserName?: string;
  buyerName: string;
  sellerName: string;
  adminName: string;
  transactionStatus?: TransactionStatus;
}

interface ApiChatMessage {
  id: string;
  transactionId: string;
  sender: {
    username: string;
    fullName: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
  };
  message: string;
  createdAt: string;
}

interface ChatMessageView {
  id: string;
  transactionId: string;
  senderRole: ChatSenderRole;
  senderName: string;
  message: string;
  timestamp: string;
  attachmentUrl?: string;
}

const screenshotPresets = [
  { label: "Bukti Transfer", url: "/screenshots/efootball_89.jpg" },
  { label: "Skuad Game", url: "/screenshots/efootball_rich.jpg" },
  { label: "Data Akun / Unbind", url: "/screenshots/efootball_legends.jpg" },
];

export function TransactionChat({
  transactionId,
  defaultRole = "BUYER",
  defaultUserName,
  buyerName,
  sellerName,
  adminName,
  transactionStatus,
}: TransactionChatProps) {
  const [activeRole, setActiveRole] = useState<ChatSenderRole>(defaultRole);
  const [inputText, setInputText] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isChatClosed = transactionStatus === "COMPLETED" || transactionStatus === "CANCELLED";

  const getMessageRole = (message: ApiChatMessage): ChatSenderRole => {
    if (message.sender.role === "ADMIN" || message.sender.role === "SUPER_ADMIN") return "ADMIN";
    if ([message.sender.username, message.sender.fullName].includes(sellerName)) return "SELLER";
    return "BUYER";
  };

  const loadMessages = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);

    try {
      const response = await fetch(`/api/transactions/${transactionId}/messages`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Gagal memuat pesan");

      const data = (await response.json()) as { messages: ApiChatMessage[] };
      setMessages(
        data.messages.map((message) => ({
          id: message.id,
          transactionId: message.transactionId,
          senderRole: getMessageRole(message),
          senderName: message.sender.fullName || message.sender.username,
          message: message.message,
          timestamp: message.createdAt,
        }))
      );
      setLoadError(null);
    } catch {
      setLoadError("Pesan belum dapat dimuat. Coba lagi sebentar.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages(true);
    const interval = window.setInterval(() => void loadMessages(), 5000);
    return () => window.clearInterval(interval);
  }, [transactionId]);

  // Auto-scroll to bottom on new message or typing status
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const getSenderDisplayName = (role: ChatSenderRole) => {
    if (role === "BUYER") return buyerName;
    if (role === "SELLER") return sellerName;
    return adminName;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Harap unggah file gambar (JPG/PNG)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setAttachment(dataUrl);
      setShowPresets(false);
      toast.success("Foto screenshot siap dikirim!");
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if ((!trimmed && !attachment) || isChatClosed || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/transactions/${transactionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed || "[Lampiran Foto/Screenshot]",
        }),
      });
      if (!response.ok) throw new Error("Pesan gagal dikirim");

      setInputText("");
      setAttachment(null);
      setShowPresets(false);
      await loadMessages();
    } catch {
      toast.error("Pesan gagal dikirim. Coba lagi.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickReplies: Record<ChatSenderRole, string[]> = {
    BUYER: [
      "Siap min, saya transfer sekarang.",
      "Sudah transfer ya, bukti terlampir.",
      "Data akun sudah saya terima dan berhasil login!",
    ],
    SELLER: [
      "Data akun sudah siap di Vault, konfirmasi jika dana sudah aman.",
      "Data login sudah saya serahkan ke admin.",
      "Bisa bantu verifikasi email pembeli?",
    ],
    ADMIN: [
      "Dana aman di escrow Rekberin. Penjual silakan serahkan data akun ke Vault.",
      "Pembeli silakan cek data akun di Vault & amankan sandi/2FA.",
      "Transaksi selesai, dana diteruskan ke penjual.",
    ],
  };

  return (
    <>
      <div id="transaction-chat-section" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[560px] sm:h-[640px] scroll-mt-20">
        {/* Chat Room Header */}
        <div className="bg-slate-900 text-white px-3.5 py-3 sm:p-5 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-bold text-sm sm:text-base tracking-tight">
                Room Chat Transaksi (3 Arah)
              </h3>
            </div>
            <p className="text-[11px] text-slate-300 hidden sm:block mt-0.5">
              Komunikasi terpantau aman antara Pembeli, Penjual, dan Admin Rekber
            </p>
          </div>

          {/* Simulasi Ganti Role (Testing Friendly) */}
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 p-0.5 sm:p-1 rounded-xl text-xs">
            <span className="text-slate-400 px-1.5 font-medium hidden md:inline text-[11px]">Kirim sbg:</span>
            <button
              type="button"
              onClick={() => setActiveRole("BUYER")}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                activeRole === "BUYER"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Pembeli
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("SELLER")}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                activeRole === "SELLER"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Penjual
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("ADMIN")}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                activeRole === "ADMIN"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Participants & Escrow Badge Combined Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 sm:px-4 sm:py-2 flex flex-wrap items-center justify-between gap-1.5 text-[11px] sm:text-xs">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1 text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="font-semibold text-slate-900">Pembeli:</span>
              <span className="truncate max-w-[80px] sm:max-w-none">{buyerName}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-900">Penjual:</span>
              <span className="truncate max-w-[80px] sm:max-w-none">{sellerName}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-800 font-semibold bg-amber-100/70 border border-amber-200 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px]">
            <ShieldCheck size={12} className="text-amber-600" />
            <span>Escrow: {adminName}</span>
          </div>
        </div>

        {/* Chat Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              Memuat percakapan...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
              <Info size={36} className="text-slate-300 mb-2" />
              <p className="text-sm font-medium">Belum ada percakapan.</p>
              <p className="text-xs text-slate-400 mt-1">
                Kirim pesan atau foto screenshot pertama untuk mulai koordinasi transaksi ini.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderRole === activeRole;
              const isAdmin = m.senderRole === "ADMIN";
              const isSeller = m.senderRole === "SELLER";
              const isBuyer = m.senderRole === "BUYER";

              const timeStr = new Date(m.timestamp).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <Avatar name={m.senderName} size={34} />

                  {/* Message Bubble Container */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-2xs text-xs sm:text-sm leading-relaxed ${
                      isMe
                        ? activeRole === "ADMIN"
                          ? "bg-amber-500 text-slate-950 font-medium rounded-tr-xs"
                          : activeRole === "SELLER"
                          ? "bg-emerald-600 text-white rounded-tr-xs"
                          : "bg-blue-600 text-white rounded-tr-xs"
                        : isAdmin
                        ? "bg-amber-50 border border-amber-200 text-slate-900 rounded-tl-xs"
                        : isSeller
                        ? "bg-emerald-50 border border-emerald-200 text-slate-900 rounded-tl-xs"
                        : "bg-white border border-slate-200 text-slate-900 rounded-tl-xs"
                    }`}
                  >
                    {/* Sender Label & Role Badge */}
                    <div
                      className={`flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold ${
                        isMe ? (activeRole === "ADMIN" ? "text-slate-900" : "text-white/90") : "text-slate-700"
                      }`}
                    >
                      <span>{m.senderName}</span>
                      {isAdmin && (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isMe
                              ? "bg-slate-900 text-amber-300"
                              : "bg-amber-200/80 text-amber-900 border border-amber-300"
                          }`}
                        >
                          <ShieldCheck size={10} /> Admin Rekber
                        </span>
                      )}
                      {isSeller && (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isMe
                              ? "bg-white/20 text-white"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          <Store size={10} /> Penjual
                        </span>
                      )}
                      {isBuyer && (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isMe
                              ? "bg-white/20 text-white"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          <User size={10} /> Pembeli
                        </span>
                      )}
                    </div>

                    {/* Image Attachment (if any) */}
                    {m.attachmentUrl && (
                      <div className="mb-2 relative rounded-xl overflow-hidden border border-black/10 group cursor-pointer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.attachmentUrl}
                          alt="Lampiran chat"
                          className="max-h-56 w-auto object-cover rounded-xl transition-transform group-hover:scale-105"
                          onClick={() => setZoomImage(m.attachmentUrl || null)}
                        />
                        <button
                          type="button"
                          onClick={() => setZoomImage(m.attachmentUrl || null)}
                          className="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ZoomIn size={14} />
                        </button>
                      </div>
                    )}

                    {/* Message Body */}
                    {m.message && m.message.startsWith("[Dari Diskusi Listing]:") ? (
                      <div className="space-y-1.5 pt-0.5">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isMe
                              ? activeRole === "ADMIN"
                                ? "bg-slate-900/20 text-slate-900"
                                : "bg-white/20 text-white"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          <MessageSquare size={10} />
                          <span>Dari Tanya Jawab Postingan Akun</span>
                        </div>
                        <p className="whitespace-pre-wrap font-medium">
                          {m.message.replace("[Dari Diskusi Listing]:", "").trim()}
                        </p>
                      </div>
                    ) : (
                      m.message && <p className="whitespace-pre-wrap">{m.message}</p>
                    )}

                    {/* Timestamp */}
                    <div
                      className={`mt-1.5 text-[10px] text-right font-medium ${
                        isMe ? (activeRole === "ADMIN" ? "text-slate-800" : "text-white/75") : "text-slate-400"
                      }`}
                    >
                      {timeStr}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {loadError && <p className="text-center text-xs text-rose-600">{loadError}</p>}

          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Preview Banner before send */}
        {attachment && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attachment} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-blue-200" />
              <span className="text-xs font-semibold text-blue-900">1 Foto Screenshot terlampir</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-100 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Presets popover */}
        {showPresets && (
          <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-500">Pilih Contoh:</span>
            {screenshotPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAttachment(p.url);
                  setShowPresets(false);
                }}
                className="bg-white border border-slate-300 hover:border-blue-500 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Quick Replies Strip */}
        <div className="bg-white border-t border-slate-100 px-3.5 py-2 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Template:
          </span>
          {quickReplies[activeRole].map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(q)}
              disabled={isChatClosed || isSending}
              className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Input Box Footer */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          {/* Attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isChatClosed || isSending}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Upload Foto / Screenshot"
          >
            <ImageIcon size={18} />
          </button>

          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            disabled={isChatClosed || isSending}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Pilih Template Gambar"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isChatClosed || isSending}
            placeholder="Tulis pesan..."
            className="flex-1 bg-slate-100/80 border border-slate-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={isChatClosed || isSending || (!inputText.trim() && !attachment)}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Send size={14} className="sm:w-[15px] sm:h-[15px]" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
        {isChatClosed && (
          <div className="bg-slate-100 border-t border-slate-200 px-4 py-2 text-center text-xs text-slate-500">
            Chat ditutup karena transaksi sudah selesai atau dibatalkan.
          </div>
        )}
      </div>

      {/* Lightbox for zooming chat images */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomImage(null)}
        >
          <button
            onClick={() => setZoomImage(null)}
            className="absolute top-4 right-4 bg-white/20 text-white p-2 rounded-full hover:bg-white/30"
          >
            <X size={20} />
          </button>
          <div className="max-w-4xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomImage} alt="Zoomed screenshot" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </>
  );
}
