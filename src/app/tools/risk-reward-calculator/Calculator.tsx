"use client";

import { useEffect, useMemo, useState } from "react";

const fmtPct = (n: number) => (isFinite(n) ? `${n >= 0 ? "+" : ""}${n.toFixed(2)}%` : "—");
const fmtNum = (n: number, d = 2) => (isFinite(n) ? n.toFixed(d) : "—");

export default function Calculator() {
  const [entry, setEntry] = useState<string>("");
  const [stop, setStop] = useState<string>("");
  const [target, setTarget] = useState<string>("");

  // URL params for shareable links
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("entry")) setEntry(p.get("entry")!);
    if (p.get("stop")) setStop(p.get("stop")!);
    if (p.get("target")) setTarget(p.get("target")!);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (entry) params.set("entry", entry);
    if (stop) params.set("stop", stop);
    if (target) params.set("target", target);
    const qs = params.toString();
    window.history.replaceState({}, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [entry, stop, target]);

  const [copied, setCopied] = useState(false);
  const copyShareLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const calc = useMemo(() => {
    const e = parseFloat(entry);
    const s = parseFloat(stop);
    const t = parseFloat(target);
    if (!isFinite(e) || e <= 0) return null;
    if (!isFinite(s) || s <= 0) return null;
    if (!isFinite(t) || t <= 0) return null;
    if (e === s) return null;

    const direction: "long" | "short" = e > s ? "long" : "short";
    const risk = Math.abs(e - s);
    const reward =
      direction === "long" ? t - e : e - t;

    if (reward <= 0) {
      // Target is on the wrong side of entry
      return {
        direction,
        risk,
        reward: 0,
        rrRatio: 0,
        riskPct: (risk / e) * 100,
        rewardPct: 0,
        invalid: true as const,
      };
    }

    return {
      direction,
      risk,
      reward,
      rrRatio: reward / risk,
      riskPct: (risk / e) * 100,
      rewardPct: (reward / e) * 100,
      invalid: false as const,
    };
  }, [entry, stop, target]);

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0c1118] px-4 py-3.5 text-base font-medium text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none transition";

  const grade = (() => {
    if (!calc || calc.invalid) return null;
    const r = calc.rrRatio;
    if (r < 1) return { label: "SKIP", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", desc: "Risking more than you stand to make. Pass." };
    if (r < 2) return { label: "MARGINAL", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", desc: "Only worth it with a strong edge (60%+ win rate)." };
    if (r < 3) return { label: "STRONG", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", desc: "Textbook standard. Profitable even at 40% win rate." };
    return { label: "EXCEPTIONAL", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/40", desc: "These trades pay for the losers. Right 25% of the time still nets positive." };
  })();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* INPUTS */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Inputs</h2>

        <div className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">Entry Price</label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">$</span>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="50.00"
              className={inputClass + " pl-9"}
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">Stop Loss</label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">$</span>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={stop}
              onChange={(e) => setStop(e.target.value)}
              placeholder="47.00"
              className={inputClass + " pl-9"}
            />
          </div>
          {calc && (
            <p className="mt-1 text-[11px] text-white/30">
              Stop is {fmtPct(-calc.riskPct)} from entry · {calc.direction.toUpperCase()} setup
            </p>
          )}
        </div>

        <div className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">Target</label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">$</span>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="60.00"
              className={inputClass + " pl-9"}
            />
          </div>
          {calc && !calc.invalid && (
            <p className="mt-1 text-[11px] text-white/30">
              Target is {fmtPct(calc.rewardPct)} from entry
            </p>
          )}
          {calc?.invalid && (
            <p className="mt-1 text-[11px] text-red-400">
              ⚠ Target is on the wrong side of entry. For a {calc.direction.toUpperCase()} setup,
              target must be {calc.direction === "long" ? "above" : "below"} entry.
            </p>
          )}
        </div>

        <p className="mt-6 text-[11px] text-white/30">
          💡 Want to size the position too? Use the{" "}
          <a href="/tools/position-size-calculator" className="text-emerald-400 hover:underline">
            Position Size Calculator
          </a>
          .
        </p>
      </div>

      {/* RESULT */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] to-white/[0.01] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Result</h2>
          {calc && !calc.invalid && (
            <button
              onClick={copyShareLink}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/60 transition hover:border-white/20 hover:text-white"
            >
              {copied ? "✓ Link copied" : "🔗 Share this"}
            </button>
          )}
        </div>

        {!calc || calc.invalid ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
            <p className="text-4xl">⚖️</p>
            <p className="mt-4 text-sm text-white/40">
              {calc?.invalid
                ? "Target is on the wrong side. Adjust above."
                : "Enter entry, stop, and target above —\nwe'll grade the setup instantly."}
            </p>
          </div>
        ) : (
          <>
            {/* Big number — R:R ratio */}
            <div className={`mt-5 rounded-xl border ${grade?.border} ${grade?.bg} p-6 text-center`}>
              <p className="text-xs uppercase tracking-wider text-white/40">Reward to Risk Ratio</p>
              <p className={`mt-2 text-6xl font-bold tabular-nums ${grade?.color}`}>
                {calc.rrRatio.toFixed(2)}<span className="text-3xl">:1</span>
              </p>
              <p className={`mt-2 text-xs font-bold uppercase tracking-wider ${grade?.color}`}>
                {grade?.label}
              </p>
              <p className="mt-2 text-[11px] text-white/50">{grade?.desc}</p>
            </div>

            {/* Risk vs Reward sub-tiles */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-[10px] uppercase tracking-wider text-red-400">Risk per share</p>
                <p className="mt-1 text-lg font-bold tabular-nums">−${fmtNum(calc.risk)}</p>
                <p className="mt-1 text-[11px] text-white/40">
                  {fmtPct(-calc.riskPct)} from entry
                </p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-[10px] uppercase tracking-wider text-emerald-400">Reward per share</p>
                <p className="mt-1 text-lg font-bold tabular-nums">+${fmtNum(calc.reward)}</p>
                <p className="mt-1 text-[11px] text-white/40">
                  {fmtPct(calc.rewardPct)} from entry
                </p>
              </div>
            </div>

            {/* Visual bar — red risk vs emerald reward */}
            <div className="mt-4">
              <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-white/40">
                <span>Risk</span>
                <span>Reward</span>
              </div>
              <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="bg-red-500/80"
                  style={{
                    width: `${Math.max(8, (calc.risk / (calc.risk + calc.reward)) * 100)}%`,
                  }}
                />
                <div
                  className="bg-emerald-500/80"
                  style={{
                    width: `${Math.max(8, (calc.reward / (calc.risk + calc.reward)) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-center text-[11px] text-white/40">
                For every <strong className="text-red-400">$1 risked</strong>, you stand to make{" "}
                <strong className="text-emerald-400">${calc.rrRatio.toFixed(2)}</strong>
              </p>
            </div>

            {/* Break-even win rate explainer */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Break-even win rate</p>
              <p className="mt-1 text-lg font-bold tabular-nums">
                {(100 / (1 + calc.rrRatio)).toFixed(1)}%
              </p>
              <p className="mt-1 text-[11px] text-white/40">
                You only need to be right this often to break even on this trade.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
