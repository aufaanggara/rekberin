import { HowItWorks } from "@/components/landing/HowItWorks";
// import { TopAdmins } from "@/components/landing/TopAdmins";
import { TrustSafety } from "@/components/landing/TrustStats";
import { FAQ } from "@/components/landing/FAQ";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang Kami — Rekberin",
  description:
    "Pelajari cara kerja Rekberin dan FAQ seputar jual beli akun game yang aman di eFootball, Mobile Legends, dan FC Mobile.",
};

export default function TentangKamiPage() {
  return (
    <>
      {/* Tentang Kami Header */}
      <section className="bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 pt-12 pb-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center z-10">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            Tentang <span className="text-blue-200">Rekberin</span>
          </h1>
          <p className="text-blue-100/80 max-w-2xl mx-auto text-sm sm:text-lg leading-relaxed">
            Platform marketplace & rekber akun game terpercaya di Indonesia. 
            Kami hadir untuk menghilangkan rasa takut kena <em>ripper</em> saat jual beli akun game.
          </p>
        </div>
      </section>

      <HowItWorks />
      {/* <TopAdmins /> */}
      <TrustSafety />
      <FAQ />
    </>
  );
}
