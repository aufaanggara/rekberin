"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ArrowDown } from "lucide-react";

interface FloatingChatJumpButtonProps {
  targetId?: string;
  theme?: "blue" | "emerald" | "amber";
}

export function FloatingChatJumpButton({
  targetId = "transaction-chat-section",
  theme = "blue",
}: FloatingChatJumpButtonProps) {
  const [isChatInView, setIsChatInView] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      const target = document.getElementById(targetId);
      if (!target) {
        setIsChatInView(false);
        return;
      }
      const rect = target.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      // Tombol hilang seketika saat bagian atas chat sudah masuk layar (top <= 65% tinggi layar) dan chat masih aktif di viewport
      const isInView = rect.top <= windowHeight * 0.65 && rect.bottom >= 80;
      setIsChatInView(isInView);
    };

    // Pengecekan awal saat mount
    checkVisibility();

    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility, { passive: true });

    // Listener interval pendek untuk mendeteksi perubahan tab tanpa jeda
    const interval = setInterval(checkVisibility, 200);

    return () => {
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
      clearInterval(interval);
    };
  }, [targetId]);

  const scrollToChat = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (isChatInView) return null;

  const colorClasses =
    theme === "emerald"
      ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400/40 shadow-emerald-900/30"
      : theme === "amber"
      ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-300 shadow-amber-900/30 font-extrabold"
      : "bg-blue-600 hover:bg-blue-700 text-white border-blue-400/40 shadow-blue-900/30";

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-40 animate-in fade-in zoom-in-95 duration-150">
      <button
        type="button"
        onClick={scrollToChat}
        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full shadow-xl text-xs font-bold transition-all transform active:scale-95 cursor-pointer border ${colorClasses}`}
        aria-label="Scroll langsung ke chat"
      >
        <MessageSquare size={13} />
        <span>Chat</span>
        <ArrowDown size={13} className="animate-bounce" />
      </button>
    </div>
  );
}
