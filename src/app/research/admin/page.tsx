"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Pick = {
  ticker: string;
  name: string;
  notes?: string;
  theme?: string;
  conviction?: string;
  sentiment?: string;
  addedAt?: string;
};

export default function AdminPicksPage() {
  const router = useRouter();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticker, setTicker] = useState("");
  const [notes, setNotes] = useState("");
  const [theme, setTheme] = useState("");
  const [conviction, setConviction] = useState("HIGH");
  const [sentiment, setSentiment] = useState("Bullish");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("mezan_user");
    if (!stored) router.push("/login");
    loadPicks();
  }, [router]);

  const loadPicks = async () => {
    try {
      const res = await fetch("/api/research/picks");
      const data = await res.json();
      setPicks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addPick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/research/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: ticker.trim(), notes, theme, conviction, sentiment }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        setMessage(`Added ${data.ticker} (${data.name})`);
        setTicker("");
        setNotes("");
        setTheme("");
        loadPicks();
      }
    } catch {
      setMessage("Failed to add");
    } finally {
      setSubmitting(false);
    }
  };

  const removePick = async (t: string) => {
    try {
      await fetch("/api/research/picks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: t }),
      });
      loadPicks();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="min-h-screen bg-[#060a10] text-white">
      <header className="border-b border-white/5 bg-[#060a10]/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold">
            Mezan <span className="text-emerald-400">Research</span> — Admin
          </span>
          <a href="/research" className="text-sm text-white/40 hover:text-white">
            Back to Dashboard
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Add Ticker Form */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Add Research Pick</h2>
          <form onSubmit={addPick} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/40">Ticker</label>
                <input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="NVDA"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-emerald-500/50"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">Theme</label>
                <input
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="AI & Semiconductors"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/40">Conviction</label>
                <select
                  value={conviction}
                  onChange={(e) => setConviction(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">Sentiment</label>
                <select
                  value={sentiment}
                  onChange={(e) => setSentiment(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
                >
                  <option value="Bullish">Bullish</option>
                  <option value="Bearish">Bearish</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/40">Notes / Analysis</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Strong momentum above all EMAs. MACD accelerating with volume..."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-emerald-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add to Research"}
            </button>

            {message && (
              <p className={`text-sm ${message.includes("error") || message.includes("NOT_HALAL") ? "text-red-400" : "text-emerald-400"}`}>
                {message}
              </p>
            )}
          </form>
        </div>

        {/* Current Picks */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Current Research Picks</h2>
            <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              {picks.length} tickers
            </span>
          </div>

          {loading ? (
            <p className="text-white/40">Loading...</p>
          ) : picks.length === 0 ? (
            <p className="text-white/40">No picks yet. Add your first ticker above.</p>
          ) : (
            <div className="space-y-2">
              {picks.map((pick) => (
                <div
                  key={pick.ticker}
                  className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <a
                      href={`/research/stock/${pick.ticker}`}
                      className="text-sm font-bold text-emerald-400 hover:underline"
                    >
                      {pick.ticker}
                    </a>
                    <span className="text-sm text-white/50">{pick.name}</span>
                    {pick.theme && (
                      <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">
                        {pick.theme}
                      </span>
                    )}
                    {pick.conviction && (
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        pick.conviction === "HIGH" ? "bg-emerald-500/10 text-emerald-400" :
                        pick.conviction === "MEDIUM" ? "bg-amber-500/10 text-amber-400" :
                        "bg-white/5 text-white/40"
                      }`}>
                        {pick.conviction}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removePick(pick.ticker)}
                    className="rounded-lg border border-red-500/20 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
