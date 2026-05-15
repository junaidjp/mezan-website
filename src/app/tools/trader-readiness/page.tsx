import type { Metadata } from "next";
import Checklist from "./Checklist";

export const metadata: Metadata = {
  title: "Trader Readiness Checklist — Mezan Research",
  description:
    "A 12-step, 7-phase programme to build real trading edge before risking real capital. Paper trade, journal, and graduate phase by phase. Free, tracks progress in your browser.",
  keywords: [
    "trader readiness",
    "trading checklist",
    "paper trading plan",
    "trading journal",
    "trader training programme",
    "halal trading",
    "Mezan Investing",
  ],
  openGraph: {
    title: "Trader Readiness Checklist — Mezan Research",
    description:
      "Complete every phase before risking real capital. Think like a trader, not a gambler.",
    type: "website",
    url: "https://mezaninvesting.com/tools/trader-readiness",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trader Readiness Checklist",
    description: "12 steps · 7 phases · ~3–4 months. Build real edge before going live.",
  },
  alternates: {
    canonical: "https://mezaninvesting.com/tools/trader-readiness",
  },
};

export default function TraderReadinessPage() {
  return (
    <main className="min-h-screen bg-[#060a10] text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#060a10]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="text-lg font-semibold tracking-tight">
            Mezan <span className="text-emerald-400">Investing</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-white/50 md:flex">
            <a href="/" className="hover:text-white transition">Home</a>
            <a href="/tools" className="hover:text-white transition">Tools</a>
            <a href="/elite" className="hover:text-white transition">Mezan Research</a>
            <a
              href="https://apps.apple.com/us/app/mezan-investing/id6755348850"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              Get the App
            </a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute -top-32 left-1/2 h-80 w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-20 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs uppercase tracking-wider text-emerald-400">
            Free Programme · 3–4 Months
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Trader Readiness{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Checklist
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/55">
            Complete every phase before risking real capital — think like a trader, not a gambler.
            12 steps across 7 phases. Work through each phase in order; don&apos;t advance until the
            current one is fully complete.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <Checklist />
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Ready for the signals?</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Mezan Research delivers the trades.<br />This checklist gets you ready to take them.
          </h2>
          <div className="mt-8 flex justify-center gap-3">
            <a
              href="/elite"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-4 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-emerald-300"
            >
              Explore Mezan Research →
            </a>
            <a
              href="/tools"
              className="rounded-xl border border-white/10 px-8 py-4 text-sm font-semibold transition hover:border-white/20 hover:bg-white/5"
            >
              Back to Tools
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-white/30">
          <p>
            <strong className="text-white/50">Disclaimer:</strong> This programme is for educational
            purposes only and is not financial advice. Trading involves substantial risk of loss.
            Past results do not guarantee future outcomes. Always consult a licensed financial advisor.
          </p>
          <p className="mt-3">
            © {new Date().getFullYear()} Mezan Research ·{" "}
            <a href="/" className="hover:text-white transition">mezaninvesting.com</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
