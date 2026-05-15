import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Trading Tools — Mezan Research",
  description:
    "Free, professional-grade calculators for stock traders. Position sizing, reward-to-risk, and more. No signup required.",
  keywords: [
    "trading tools",
    "stock calculator",
    "position size calculator",
    "risk reward calculator",
    "halal trading tools",
  ],
  alternates: { canonical: "https://mezaninvesting.com/tools" },
};

const TOOLS = [
  {
    href: "/tools/position-size-calculator",
    icon: "📊",
    title: "Position Size Calculator",
    description:
      "How many shares should you buy? Enter account size, risk %, entry, and stop. Implements the 1%/2% rule.",
    cta: "Open calculator",
  },
  {
    href: "/tools/risk-reward-calculator",
    icon: "⚖️",
    title: "Risk : Reward Calculator",
    description:
      "Is this trade worth taking? Enter entry, stop, and target — get the R:R ratio + setup quality grade.",
    cta: "Open calculator",
  },
  {
    href: "/tools/trader-readiness",
    icon: "✅",
    title: "Trader Readiness Checklist",
    description:
      "12 steps across 7 phases. Paper trade, journal, and graduate phase by phase before risking real capital. Progress saves in your browser.",
    cta: "Start the programme",
  },
];

export default function ToolsHubPage() {
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
        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-20 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs uppercase tracking-wider text-emerald-400">
            Free Tools
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Tools that <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">discipline pays for</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/50">
            Free, no-signup calculators we use ourselves before every trade. Built for halal investors,
            useful for everyone.
          </p>
        </div>
      </section>

      {/* TOOLS GRID */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <a
              key={t.href}
              href={t.href}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition hover:border-emerald-500/30 hover:bg-white/[0.04]"
            >
              <div className="text-4xl">{t.icon}</div>
              <h3 className="mt-4 text-xl font-bold">{t.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/50">{t.description}</p>
              <p className="mt-5 text-sm font-semibold text-emerald-400 transition group-hover:translate-x-1">
                {t.cta} →
              </p>
            </a>
          ))}
        </div>

        {/* More coming soon */}
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-7 text-center">
          <p className="text-xs uppercase tracking-wider text-white/30">More coming</p>
          <p className="mt-2 text-sm text-white/50">
            ATR-based stop calculator · Compound interest visualizer · Halal portfolio backtester
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Ready for the signals?</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Mezan Research delivers the trades.<br />These tools help you size them right.
          </h2>
          <div className="mt-8 flex justify-center gap-3">
            <a
              href="/elite"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-4 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-emerald-300"
            >
              Explore Mezan Research →
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Mezan Research · <a href="/" className="hover:text-white transition">mezaninvesting.com</a>
        </div>
      </footer>
    </main>
  );
}
