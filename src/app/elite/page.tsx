export default function ElitePage() {
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
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#preview" className="hover:text-white transition">Preview</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
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
        {/* Glow effects */}
        <div className="absolute -top-40 left-1/2 h-80 w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -top-20 left-1/4 h-60 w-[400px] rounded-full bg-emerald-600/5 blur-[100px]" />

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Mezan Research
          </div>

          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
            Your unfair
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              halal edge.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/40">
            AI-powered stock analysis, real-time signals, social sentiment, insider trades,
            and institutional-grade research — all Shariah-compliant. Built for Muslim investors
            who refuse to compromise.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="#pricing"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-4 text-sm font-bold text-black transition hover:from-emerald-400 hover:to-emerald-300 shadow-lg shadow-emerald-500/20"
            >
              See what&apos;s coming
            </a>
            <a
              href="#preview"
              className="rounded-xl border border-white/10 px-8 py-4 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
            >
              See what&apos;s inside
            </a>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Everything. In one place.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/40">
            No more juggling 5 different apps. Elite brings research, signals, AI, and
            social data together — filtered for halal compliance.
          </p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition hover:border-emerald-500/20 hover:bg-white/[0.04] ${
                i === 0 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl transition group-hover:bg-emerald-500/10" />
              <div className="relative">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/5 text-lg">
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-semibold">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/40">{f.desc}</p>
                {f.tag && (
                  <span className="mt-3 inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    {f.tag}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PREVIEW / HOW IT WORKS */}
      <section id="preview" className="border-y border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">How Elite works</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/40">
              You pick the tickers. We do the rest.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-xl font-bold text-emerald-400">
                  {i + 1}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-white/40">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Mock Cards Preview */}
          <div className="mt-20">
            <h3 className="mb-8 text-center text-lg font-semibold text-white/70">What a stock card looks like</h3>
            <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0c1118] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-lg font-bold text-emerald-400">N</div>
                  <div>
                    <p className="text-lg font-bold">NVDA</p>
                    <p className="text-sm text-white/40">NVIDIA Corporation</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">$218.43</p>
                  <p className="text-sm text-emerald-400">+3.24%</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-3">
                <InfoChip label="Halal Status" value="HALAL" color="emerald" />
                <InfoChip label="Support" value="$210.50" color="white" />
                <InfoChip label="Resistance" value="$225.80" color="white" />
                <InfoChip label="RSI" value="62.4" color="white" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <InfoChip label="AI Confidence" value="HIGH" color="emerald" />
                <InfoChip label="Social Sentiment" value="Bullish" color="emerald" />
                <InfoChip label="Insider Activity" value="3 Buys" color="yellow" />
              </div>

              <div className="mt-4 rounded-xl bg-white/[0.03] p-4">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">AI Analysis</p>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  Strong upward momentum with price above all major EMAs. MACD is accelerating with increasing volume.
                  RSI at 62 suggests room to run. Support at $210 from previous consolidation. Next resistance at $225.
                  Insider buying activity in the last 30 days adds conviction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Mezan Research</h2>
          <p className="mt-4 text-white/40">Full research platform + free Mezan Investing app Elite access.</p>
        </div>

        {/* CLOSED MESSAGE */}
        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Subscriptions Closed
          </span>
          <h3 className="mt-5 text-2xl font-bold text-white">We&apos;re paused for new sign-ups</h3>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Mezan Research is temporarily closed to new subscribers while we put final touches on the platform. <strong className="text-white/90">Existing subscribers continue to have full access</strong> — nothing changes for you.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            We&apos;ll reopen soon. In the meantime, to be notified or request early access:
          </p>
          <div className="mt-6 flex flex-col items-center gap-2 text-sm">
            <a
              href="mailto:support@mezaninvesting.com?subject=Mezan%20Research%20-%20Notify%20when%20open"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 py-3 text-sm font-bold text-black transition hover:from-emerald-400 hover:to-emerald-300 shadow-lg shadow-emerald-500/20"
            >
              Email support@mezaninvesting.com
            </a>
            <p className="mt-2 text-xs text-white/50">Or DM Junaid in his WhatsApp group.</p>
          </div>
        </div>

        {/* What you get when we reopen */}
        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">What you&apos;ll get when we reopen</p>
          <ul className="mt-4 space-y-2.5">
            {eliteFeatures.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-white/70">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-white/5">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="p-10 text-center">
              <p className="text-3xl font-bold text-emerald-400">{stat.value}</p>
              <p className="mt-1 text-xs text-white/30">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="text-center text-2xl font-bold">Questions</h2>
        <div className="mt-12 space-y-8">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-b border-white/5 pb-8">
              <h3 className="font-semibold text-white/90">{faq.q}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/40">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-[#0c1118] to-[#060a10] p-12 text-center">
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-[80px]" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-emerald-600/5 blur-[80px]" />
          <div className="relative">
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to invest with an edge?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/40">
              Join Muslim investors who use Mezan Elite to make informed, disciplined, halal investment decisions.
            </p>
            <a
              href="/research"
              className="mt-8 inline-block rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-10 py-4 text-sm font-bold text-black transition hover:from-emerald-400 hover:to-emerald-300 shadow-lg shadow-emerald-500/20"
            >
              Start Mezan Research Today
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <p className="text-sm text-white/20">
              Mezan Investing is for educational purposes only. Not financial advice. Investing involves risk.
            </p>
            <div className="flex gap-6 text-xs text-white/30">
              <a href="/privacy-policy" className="hover:text-white transition">Privacy</a>
              <a href="/terms-conditions" className="hover:text-white transition">Terms</a>
              <a href="/delete-account" className="hover:text-white transition">Delete Account</a>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-white/30">
            © {new Date().getFullYear()} Nafitech LLC. All rights reserved. Mezan Investing is a product of Nafitech LLC.
          </p>
        </div>
      </footer>
    </main>
  );
}

function InfoChip({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClass = color === "emerald" ? "text-emerald-400" : color === "yellow" ? "text-amber-400" : "text-white/80";
  return (
    <div className="rounded-lg bg-white/[0.04] px-3 py-2">
      <p className="text-[10px] text-white/30">{label}</p>
      <p className={`text-sm font-semibold ${colorClass}`}>{value}</p>
    </div>
  );
}

const features = [
  {
    icon: "📊",
    title: "All Research Lists & On Demand",
    desc: "Every scanner and watchlist — Momentum, Cup & Handle, EPS/SIPS, QP-Variant, VCP, Flag Breakout. Plus on-demand research for any halal ticker.",
    tag: "Full Access",
  },
  {
    icon: "🔥",
    title: "Hot Lists & Themes",
    desc: "Curated lists grouped by sector themes, earnings catalysts, and market trends. Updated daily with conviction ratings.",
    tag: null,
  },
  {
    icon: "🤖",
    title: "Mezan AI",
    desc: "AI analyzes every setup — scores conviction, explains reasoning, and flags risks. Like having a research analyst on demand.",
    tag: "AI Powered",
  },
  {
    icon: "📈",
    title: "Support & Resistance Levels",
    desc: "Auto-calculated key levels, ATR-based entries and stops, and full technical profiles for every halal stock.",
    tag: null,
  },
  {
    icon: "📉",
    title: "TradingView Charts",
    desc: "Interactive charts with EMA 10/21/50/200, VWAP, RSI, and MACD overlays. Professional-grade analysis in your browser.",
    tag: null,
  },
  {
    icon: "⚡",
    title: "Breaking News",
    desc: "Real-time filtered news — earnings, FDA, contracts, catalysts. Only what matters for your halal watchlist.",
    tag: "Real-time",
  },
  {
    icon: "💬",
    title: "Social Sentiment",
    desc: "Aggregate social buzz scores. See what retail and institutions are saying before it moves the price.",
    tag: null,
  },
  {
    icon: "🔄",
    title: "Rotation Tracker",
    desc: "Follow institutional money flows across sectors. Spot rotation early and position ahead of major shifts.",
    tag: null,
  },
  {
    icon: "🏛️",
    title: "Congress & Insider Trades",
    desc: "Track what Congress members and corporate insiders are buying and selling. Follow the smart money.",
    tag: "Exclusive",
  },
  {
    icon: "📣",
    title: "Social Buzz",
    desc: "Trending tickers across platforms. Volume and mention tracking to spot momentum before it goes mainstream.",
    tag: null,
  },
  {
    icon: "✨",
    title: "Extra AI Credits & Custom Analysis",
    desc: "More AI runs, custom deep dives, and personalized portfolio reviews. Your own research department.",
    tag: "Premium",
  },
  {
    icon: "🎓",
    title: "Swing Investment Webinars",
    desc: "Live sessions covering strategies, chart reading, risk management, and market psychology. Recordings available.",
    tag: null,
  },
];

const steps = [
  {
    title: "We curate the universe",
    desc: "Our team identifies high-conviction halal tickers using scanners, technical analysis, and institutional flow data.",
  },
  {
    title: "AI enriches every stock",
    desc: "Each ticker gets auto-populated with support/resistance, AI analysis, social sentiment, insider data, and news.",
  },
  {
    title: "You make the call",
    desc: "Review the research cards, check the charts, and execute with confidence. Every decision backed by data.",
  },
];

const proFeatures = [
  "Basic daily scanners",
  "Swing trade ideas",
  "Halal screener",
  "Training modules",
  "Market health dashboard",
];

const eliteFeatures = [
  "Everything in Pro",
  "All Research Lists & On Demand analysis",
  "Hot Lists & Sector Themes",
  "Mezan AI — AI-powered stock analysis",
  "Auto Support & Resistance levels",
  "Breaking News (filtered)",
  "Social Sentiment tracking",
  "Sector Rotation Tracker",
  "Congress & Insider Trades",
  "Social Buzz & trending tickers",
  "Extra AI Credits & custom analysis",
  "Live Swing Webinars + recordings",
];

const stats = [
  { value: "150+", label: "Active Investors" },
  { value: "8,000+", label: "Halal Stocks Screened" },
  { value: "12", label: "Daily Scanners" },
  { value: "31", label: "Training Modules" },
];

const faqs = [
  {
    q: "What makes Elite different from Pro?",
    a: "Pro gives you scanners and trade ideas. Elite unlocks the full research suite — AI analysis, social sentiment, insider trades, live webinars, and custom on-demand research. It's the difference between getting a list and getting the full picture.",
  },
  {
    q: "Is every stock Halal compliant?",
    a: "We show every US-listed stock — over 8,000 of them — and calculate a Halal / Not Halal status for each using our AAOIFI-inspired compliance framework (business activity, financial ratios, and revenue analysis). The choice of whether to invest is always yours. We give you the data and the rationale; you make the call.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. No contracts, no commitments. Cancel through your App Store or Google Play subscription settings. Your access continues until the end of your billing period.",
  },
  {
    q: "Is this financial advice?",
    a: "No. Mezan is an educational and research platform. All content is for informational purposes. We provide data and analysis — you make the decisions. Always do your own research.",
  },
  {
    q: "How often is data updated?",
    a: "Scanners update daily. News and social sentiment refresh throughout the day. AI analysis runs on the latest available market data. Charts are real-time via TradingView.",
  },
  {
    q: "What's the annual plan?",
    a: "Annual pricing is custom. Email support@mezaninvesting.com or DM Junaid in his WhatsApp group for details — we'll match the right plan to your needs.",
  },
];
