export default function WaitlistPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="/" className="text-lg font-semibold tracking-tight">
            Mezan <span className="text-emerald-400">Investing</span>
          </a>
          <nav className="hidden gap-6 text-sm text-white/70 md:flex">
            <a href="/" className="hover:text-white">
              Home
            </a>
            <a href="/analysis" className="hover:text-white">
              Strategy Analysis
            </a>
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Mezan <span className="text-emerald-400">Waitlist</span>
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Get elite access to exclusive trading insights, curated watchlists, and market analysis. Join our community of serious investors.
          </p>
        </div>

        {/* FORM */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSfP23ZhRfgYKtQTvUL9-yDs90uFU_safTKqRMfbkN6CVgCn0w/viewform?embedded=true"
            width="100%"
            height="826"
            style={{ border: 'none' }}
            className="w-full"
          >
            Loading…
          </iframe>
        </div>

        {/* FOOTER INFO */}
        <div className="mt-12 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-6">
          <p className="text-sm text-white/80">
            <span className="font-semibold text-emerald-400">✓ No spam.</span> We only send curated watchlist updates and market insights. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </main>
  );
}
