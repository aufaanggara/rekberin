"use client";

import { MessageCircle, type LucideIcon } from "lucide-react";

export type ConversationTab = "chat" | "action";

export function ConversationTabs({
  active,
  onChange,
  actionLabel,
  ActionIcon,
}: {
  active: ConversationTab;
  onChange: (tab: ConversationTab) => void;
  actionLabel: string;
  ActionIcon: LucideIcon;
}) {
  return (
    <div role="tablist" aria-label="Bagian percakapan" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] lg:static lg:mx-auto lg:mb-5 lg:max-w-4xl lg:rounded-2xl lg:border lg:p-1 lg:shadow-none">
      {([
        { key: "chat" as const, label: "Chat", Icon: MessageCircle },
        { key: "action" as const, label: actionLabel, Icon: ActionIcon },
      ]).map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          role="tab"
          id={`mobile-${key}-tab`}
          aria-selected={active === key}
          aria-controls={`mobile-${key}-panel`}
          onClick={() => {
            onChange(key);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex min-h-16 flex-col items-center justify-center gap-0.5 px-2 py-1 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 lg:min-h-12 lg:flex-row lg:gap-2 lg:rounded-xl lg:text-sm ${active === key ? "text-blue-800 lg:bg-blue-50" : "text-slate-500 lg:hover:bg-slate-50"}`}
        >
          <span className={`flex h-8 min-w-16 items-center justify-center rounded-full lg:min-w-0 lg:bg-transparent ${active === key ? "bg-blue-100" : ""}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
