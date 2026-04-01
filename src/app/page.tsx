export default function Home() {
  const appStoreUrl = "https://apple.co/YOUR_APP_LINK";
  const playStoreUrl =
    "https://play.google.com/store/apps/details?id=YOUR_PACKAGE";

  return (
    <main className="min-h-screen bg-black text-white">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="text-lg font-semibold tracking-tight">
            Mezan <span className="text-emerald-400">Investing</span>
          </div>
          <nav className="hidden gap-6 text-sm text-white/70 md:flex">
            <a href="/analysis" className="hover:text-white">
              Strategy Analysis
            </a>
            <a href="/waitlist" className="hover:text-white">
              Mezan Waitlist
            </a>
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#screens" className="hover:text-white">
              Screens
            </a>
            <a href="#halal" className="hover:text-white">
              Halal Method
            </a>
            <a href="#download" className="hover:text-white">
              Download
            </a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Halal Stock Investing, built for serious investors.
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Screen stocks, follow disciplined trade plans, and stay in sync with
            market conditions using AAOIFI-aligned analysis and AI-powered
            scanners.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={appStoreUrl}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
              Download on App Store
            </a>
            <a
              href={playStoreUrl}
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:border-white/40"
            >
              Get it on Google Play
            </a>
          </div>

          <p className="mt-4 text-sm text-white/50">
            Built for Muslim investors who value discipline, risk management,
            and clarity.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="grid grid-cols-2 gap-3">
            <img
              src="/screens/market.png"
              className="rounded-2xl"
              alt="Market stance"
            />
            <img
              src="/screens/scanners.png"
              className="rounded-2xl"
              alt="Daily scanners"
            />
            <img
              src="/screens/swing.png"
              className="rounded-2xl"
              alt="Swing ideas"
            />
            <img
              src="/screens/training.png"
              className="rounded-2xl"
              alt="Training modules"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold">Features</h2>
        <p className="mt-2 text-white/70">
          Designed to help you invest responsibly — with structure, filters, and
          clarity.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Halal Compliance Engine",
              desc: "Quickly see Halal / Not Halal using a structured screening framework inspired by widely accepted AAOIFI guidelines.",
            },
            {
              title: "Daily Scanners",
              desc: "Momentum, Cup & Handle, EPS/SIPS and more — updated regularly so you focus on higher-quality setups.",
            },
            {
              title: "Swing Ideas + Trade Plans",
              desc: "Entry, stop, target, and risk:reward — because capital protection comes first.",
            },
            {
              title: "Market Health Dashboard",
              desc: "A clean snapshot of market stance, breadth, volatility, and trend.",
            },
            {
              title: "Filters That Matter",
              desc: "Filter by market cap, dividend yield, price, sector, halal status, and sort how you want.",
            },
            {
              title: "Training Modules",
              desc: "Short lessons covering charts, moving averages, market trends, and trade planning.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-white/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HALAL */}
      <section id="halal" className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-bold">
            Our Approach to Halal Screening
          </h2>
          <p className="mt-3 text-white/70">
            Mezan Investing follows a structured screening methodology inspired
            by widely accepted AAOIFI guidelines. We combine sector filtering,
            financial ratio analysis, and ongoing data updates to help investors
            make more informed halal investing decisions.
          </p>
          <p className="mt-4 text-sm text-white/50">
            Mezan Investing is a technology platform and does not provide
            religious rulings. Please consult qualified scholars for final
            guidance.
          </p>
        </div>
      </section>

      {/* DOWNLOAD */}
      <section id="download" className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-10 text-center">
          <h2 className="text-3xl font-bold">
            Ready to invest with confidence?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/70">
            Join the growing community using Mezan Investing to navigate the
            markets the disciplined way.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={appStoreUrl}
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
              Download on App Store
            </a>
            <a
              href={playStoreUrl}
              className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-white/40"
            >
              Get it on Google Play
            </a>
          </div>
        </div>

        <footer className="mt-10 space-y-4 text-center text-xs text-white/50">
          <p>
            Disclaimer: Mezan Investing is for educational purposes only and
            does not provide financial advice. Investing involves risk. Past
            performance is not indicative of future results.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/privacy-policy" className="hover:text-white">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="/terms-conditions" className="hover:text-white">
              Terms & Conditions
            </a>
            <span>•</span>
            <a href="/delete-account" className="hover:text-white">
              Delete Account
            </a>
          </div>
        </footer>
      </section>
    </main>
  );
}
