"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X, Share, PlusSquare, WifiOff, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // 2. Check if user dismissed recently (24 hours cooldown)
    const lastDismissed = localStorage.getItem("rekberin_pwa_dismissed");
    const now = Date.now();
    const isCooldownActive = lastDismissed && now - parseInt(lastDismissed, 10) < 24 * 60 * 60 * 1000;

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    setIsIos(isIosDevice && isSafari);

    if (isIosDevice && isSafari && !isCooldownActive) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    // 4. Capture native beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (!isCooldownActive) {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Network status monitor
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 3500);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // 6. Manual trigger from Navbar or Footer
    const handleManualOpen = () => {
      setIsVisible(true);
    };
    window.addEventListener("rekberin:open-pwa-install", handleManualOpen);

    if (!navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("rekberin:open-pwa-install", handleManualOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("rekberin_pwa_dismissed", Date.now().toString());
  };

  return (
    <>
      {/* ── Offline Banner ── */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-300">
          <WifiOff size={15} className="shrink-0" />
          <span>Anda sedang dalam <strong>Mode Offline</strong>. Halaman cache tetap dapat dibuka.</span>
        </div>
      )}

      {/* ── Online Restored Toast ── */}
      {showOnlineToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 size={16} />
          <span>Koneksi tersambung kembali. Anda online!</span>
        </div>
      )}

      {/* ── PWA Install Prompt Banner ── */}
      {isVisible && !isStandalone && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-sm w-auto animate-in slide-in-from-bottom-5 duration-300">
          <div className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-white">
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              aria-label="Tutup"
              className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>

            <div className="flex items-start gap-3.5 pr-5">
              {/* App Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shrink-0 shadow-md shadow-blue-500/30 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-192.png" alt="Rekberin" className="w-full h-full object-cover rounded-[10px]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm text-white tracking-tight">Install Rekberin</h4>
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-300 border border-blue-400/30">
                    PWA App
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Akses instan dari layar utama, navigasi lebih mulus & hemat kuota.
                </p>
              </div>
            </div>

            {/* iOS Instructions vs Native Install Button */}
            {isIos ? (
              <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-300 bg-slate-800/60 rounded-xl p-2.5 space-y-1">
                <p className="font-semibold text-white flex items-center gap-1">
                  <span>Cara install di iPhone/iPad:</span>
                </p>
                <p className="flex items-center gap-1.5 text-slate-300">
                  1. Ketuk tombol <Share size={13} className="text-blue-400 shrink-0" /> <strong>Bagikan</strong> di Safari.
                </p>
                <p className="flex items-center gap-1.5 text-slate-300">
                  2. Pilih <PlusSquare size={13} className="text-emerald-400 shrink-0" /> <strong>Tambah ke Layar Utama</strong>.
                </p>
              </div>
            ) : (
              <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Nanti Saja
                </button>
                <button
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>Install Sekarang</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
