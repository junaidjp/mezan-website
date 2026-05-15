import type { Metadata } from "next";
import Calculator from "./Calculator";

export const metadata: Metadata = {
  title: "Risk : Reward Calculator — Mezan Research",
  description:
    "Free reward-to-risk ratio calculator. Enter entry, stop, and target — instantly see if a trade is worth taking. Used by professional traders worldwide.",
  keywords: [
    "risk reward calculator",
    "risk to reward ratio",
    "trade R:R calculator",
    "stock target calculator",
    "halal trading",
  ],
  openGraph: {
    title: "Risk : Reward Calculator — Mezan Research",
    description:
      "Is this trade worth taking? Get the R:R ratio + setup quality grade. Free, no signup.",
    type: "website",
    url: "https://mezaninvesting.com/tools/risk-reward-calculator",
  },
  alternates: { canonical: "https://mezaninvesting.com/tools/risk-reward-calculator" },
};

export default function RiskRewardCalculatorPage() {
  return (
    <main className="min-h-screen bg-[#060a10] text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#060a10]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="text-lg font-semibold tracking-tight">
            Mezan <span className="text-emerald-400">Investing</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-white/50 md:flex">
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
        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-20 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs uppercase tracking-wider text-emerald-400">
            Free Tool
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Risk : Reward <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Calculator</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/50">
            Is this trade worth taking? Enter entry, stop, and target — we&apos;ll tell you the R:R ratio
            and grade the setup quality.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <Calculator />
      </section>

      <section className="border-t border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-2xl font-bold">Why R:R is the math that matters</h2>
          <p className="mt-4 text-white/60 leading-relaxed">
            Most retail traders obsess over win rate. Pros obsess over reward-to-risk. Here&apos;s why:
            you can be wrong 60% of the time and still print money — if your winners are 3× the size
            of your losers.
          </p>

          <div className="mt-10 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-emerald-400">The formula</h3>
              <pre className="mt-3 rounded-xl border border-white/10 bg-[#0c1118] p-5 text-sm text-white/70 overflow-x-auto">
{`Risk             =  | Entry − Stop |
Reward           =  | Target − Entry |
R:R Ratio        =  Reward ÷ Risk

Expected Value   =  (Win % × Reward) − (Loss % × Risk)`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-emerald-400">The thresholds we use</h3>
              <ul className="mt-3 space-y-3 text-white/60">
                <li className="flex items-start gap-3">
                  <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 mt-0.5">SKIP</span>
                  <span><strong className="text-white">R:R &lt; 1.0</strong> — you&apos;re risking more than you stand to make. Even a 70% win rate barely breaks even after slippage. Pass.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 mt-0.5">MARGINAL</span>
                  <span><strong className="text-white">R:R 1.0 – 2.0</strong> — only worth it if you have a strong edge (60%+ win rate). For most setups, wait for a better entry.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 mt-0.5">STRONG</span>
                  <span><strong className="text-white">R:R 2.0 – 3.0</strong> — the textbook standard. Profitable even at a 40% win rate.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 mt-0.5">EXCEPTIONAL</span>
                  <span><strong className="text-white">R:R 3.0+</strong> — these are the trades that pay for the losers. You can be right 25% of the time and still net positive at 4:1.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Got the right R:R?</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Now size the position correctly.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="/tools/position-size-calculator"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-4 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-emerald-300"
            >
              Position Size Calculator →
            </a>
            <a
              href="/elite"
              className="rounded-xl border border-white/10 px-8 py-4 text-sm font-semibold transition hover:border-white/20 hover:bg-white/5"
            >
              Mezan Research
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-white/30">
          <p>
            <strong className="text-white/50">Disclaimer:</strong> Educational only, not financial advice.
            Trading involves substantial risk. Always do your own research.
          </p>
          <p className="mt-3">
            © {new Date().getFullYear()} Mezan Research · <a href="/" className="hover:text-white transition">mezaninvesting.com</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
