import type { Metadata } from "next";
import Calculator from "./Calculator";

export const metadata: Metadata = {
  title: "Position Size Calculator (2% Rule) — Mezan Research",
  description:
    "Free stock position size calculator. Enter your account size, risk %, entry price, and stop loss — instantly see how many shares to buy. Implements the 1%/2% rule used by professional traders.",
  keywords: [
    "position size calculator",
    "2% rule calculator",
    "stock risk calculator",
    "share size calculator",
    "stop loss calculator",
    "risk per trade",
    "halal trading",
  ],
  openGraph: {
    title: "Position Size Calculator — Mezan Research",
    description:
      "Calculate the right number of shares for any trade. Free, instant, no signup. Used by halal-compliant traders worldwide.",
    type: "website",
    url: "https://mezaninvesting.com/tools/position-size-calculator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Position Size Calculator",
    description: "How many shares should you buy? Enter account, risk, entry, stop. Free.",
  },
  alternates: {
    canonical: "https://mezaninvesting.com/tools/position-size-calculator",
  },
};

export default function PositionSizeCalculatorPage() {
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
            Free Tool
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Position Size <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Calculator</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/50">
            How many shares should you buy? Enter your account size, risk percentage, entry, and stop —
            we&apos;ll tell you the exact share count that keeps your loss within your plan.
          </p>
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <Calculator />
      </section>

      {/* EDUCATION */}
      <section className="border-t border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-2xl font-bold">How position sizing works</h2>
          <p className="mt-4 text-white/60 leading-relaxed">
            The math is simple, the discipline is hard. Most retail traders blow up not because their
            entries are wrong but because they size positions on conviction, not on risk.
          </p>

          <div className="mt-10 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-emerald-400">The formula</h3>
              <pre className="mt-3 rounded-xl border border-white/10 bg-[#0c1118] p-5 text-sm text-white/70 overflow-x-auto">
{`Risk Dollars       =  Account Size × Risk %
Stop Distance      =  | Entry − Stop |
Shares             =  Risk Dollars ÷ Stop Distance
Position Size $    =  Shares × Entry`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-emerald-400">The 1%, 2%, 2.5% rule</h3>
              <p className="mt-3 text-white/60 leading-relaxed">
                Professional traders cap the risk on any single trade at a small fraction of their account.
                The most common values are <strong className="text-white">1%</strong> (conservative),
                {" "}<strong className="text-white">2%</strong> (the textbook standard), and
                {" "}<strong className="text-white">2.5%</strong> (aggressive but still survivable).
                At 2% per trade, even ten consecutive losing trades only draws down ~18% — survivable.
                At 5% per trade, ten losses takes you down ~40% — career-ending.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-emerald-400">Example</h3>
              <p className="mt-3 text-white/60 leading-relaxed">
                $25,000 account, 2% risk = <strong className="text-white">$500</strong> max loss per trade.
                You want to buy AAPL at $185 with a stop at $180 — that&apos;s a $5 stop distance.
                {" "}<strong className="text-white">$500 ÷ $5 = 100 shares</strong>. Position size: $18,500
                (74% of your account, which is fine because risk is still capped at $500). If AAPL hits
                your stop, you lose exactly $500 — no more.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-emerald-400">What this calculator doesn&apos;t cover</h3>
              <ul className="mt-3 space-y-2 text-white/60">
                <li className="flex gap-2"><span className="text-emerald-400">·</span> Slippage — your stop won&apos;t fill exactly at the published price during fast moves</li>
                <li className="flex gap-2"><span className="text-emerald-400">·</span> Commissions — most US brokers are now $0/trade, but options and international are not</li>
                <li className="flex gap-2"><span className="text-emerald-400">·</span> Overnight gap risk — earnings or news can blow through your stop</li>
                <li className="flex gap-2"><span className="text-emerald-400">·</span> Margin / leverage — if you&apos;re trading on margin, real risk is amplified</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Ready to trade with an edge?</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Halal-compliant signals.<br />Real-time research.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/50">
            Mezan Research delivers AI-powered analysis on US stocks filtered for halal compliance.
            Position sizing is just the discipline. We bring the signals.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <a
              href="/elite"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-4 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-emerald-300"
            >
              Explore Mezan Research →
            </a>
            <a
              href="https://apps.apple.com/us/app/mezan-investing/id6755348850"
              className="rounded-xl border border-white/10 px-8 py-4 text-sm font-semibold transition hover:border-white/20 hover:bg-white/5"
            >
              Get the iOS App
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-white/30">
          <p>
            <strong className="text-white/50">Disclaimer:</strong> This calculator is for educational purposes only and is
            not financial advice. Trading involves substantial risk of loss. Past results from this calculation
            do not guarantee future outcomes. Always consult a licensed financial advisor.
          </p>
          <p className="mt-3">
            © {new Date().getFullYear()} Mezan Research · <a href="/" className="hover:text-white transition">mezaninvesting.com</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
