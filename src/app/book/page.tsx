import type { Metadata } from "next";
import CalendlyEmbed from "./CalendlyEmbed";

const CALENDLY_URL = "https://calendly.com/mezaninvesting/30min";

export const metadata: Metadata = {
  title: "Book a Chart Setup Session — Mezan Research",
  description:
    "Book a free 30-minute call to set up your charts, watchlists, and trade plan with Mezan.",
  alternates: { canonical: "https://mezaninvesting.com/book" },
};

const COVERED = [
  "Walk through your trading platform and chart layout",
  "Set up watchlists aligned to the Mezan strategies",
  "Configure indicators (VWAP, RSI, MACD) for swing setups",
  "Quick review of your current trade plan + risk sizing",
];

const BRING = [
  "A laptop with your broker / TradingView open",
  "List of tickers you currently watch or hold",
  "Any specific question you want answered",
];

export default function BookPage() {
  return (
    <main className="min-h-screen bg-[#060a10] text-white">
      {/* NAV */}
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

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute -top-32 left-1/2 h-80 w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-20 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs uppercase tracking-wider text-emerald-400">
            Free · 30 minutes · 1-on-1
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Book a{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Chart Setup Session
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/50">
            We&apos;ll get your charts, watchlists, and trade plan set up the way the Mezan
            strategies expect. Bring questions — leave with a system you can run on your own.
          </p>
        </div>
      </section>

      {/* CALENDAR + INFO */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          {/* INFO SIDEBAR */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                What we&apos;ll cover
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/70">
                {COVERED.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-1 text-emerald-400">✓</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                What to bring
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/70">
                {BRING.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-1 text-white/30">·</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-sm text-white/50">
              Calls happen over Google Meet — link arrives in your confirmation email.
              If you need to reschedule, use the link in that email.
            </div>
          </aside>

          {/* CALENDLY EMBED */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2 md:p-3">
            <CalendlyEmbed url={CALENDLY_URL} />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Mezan Research ·{" "}
          <a href="/" className="hover:text-white transition">mezaninvesting.com</a>
        </div>
      </footer>
    </main>
  );
}
