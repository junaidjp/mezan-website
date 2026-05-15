"use client";

import { useEffect, useMemo, useState } from "react";

const RISK_PRESETS = [1, 2, 2.5, 5];

const fmtMoney = (n: number) =>
  isFinite(n)
    ? `$${n.toLocaleString("en-US", { minimumFractionDigits: n >= 100 ? 0 : 2, maximumFractionDigits: 2 })}`
    : "—";

const fmtPct = (n: number) =>
  isFinite(n) ? `${n.toFixed(1)}%` : "—";

export default function Calculator() {
  const [accountSize, setAccountSize] = useState<string>("10000");
  const [riskPct, setRiskPct] = useState<string>("2");
  const [entry, setEntry] = useState<string>("");
  const [stop, setStop] = useState<string>("");
  const [target, setTarget] = useState<string>("");

  // On mount: prefer URL query params (shareable links), fall back to localStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    let urlHadValues = false;
    const get = (k: string) => params.get(k);
    if (get("account")) { setAccountSize(get("account")!); urlHadValues = true; }
    if (get("risk")) { setRiskPct(get("risk")!); urlHadValues = true; }
    if (get("entry")) { setEntry(get("entry")!); urlHadValues = true; }
    if (get("stop")) { setStop(get("stop")!); urlHadValues = true; }
    if (get("target")) { setTarget(get("target")!); urlHadValues = true; }
    if (urlHadValues) return;
    const saved = window.localStorage.getItem("mezan_pos_calc");
    if (saved) {
      try {
        const v = JSON.parse(saved);
        if (v.accountSize) setAccountSize(v.accountSize);
        if (v.riskPct) setRiskPct(v.riskPct);
      } catch {}
    }
  }, []);

  // Persist + sync URL query string for sharing.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "mezan_pos_calc",
      JSON.stringify({ accountSize, riskPct }),
    );
    const params = new URLSearchParams();
    if (accountSize) params.set("account", accountSize);
    if (riskPct) params.set("risk", riskPct);
    if (entry) params.set("entry", entry);
    if (stop) params.set("stop", stop);
    if (target) params.set("target", target);
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }, [accountSize, riskPct, entry, stop, target]);

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
    const acc = parseFloat(accountSize);
    const risk = parseFloat(riskPct);
    const e = parseFloat(entry);
    const s = parseFloat(stop);
    const t = parseFloat(target);

    if (!isFinite(acc) || acc <= 0) return null;
    if (!isFinite(risk) || risk <= 0) return null;
    if (!isFinite(e) || e <= 0) return null;
    if (!isFinite(s) || s <= 0) return null;
    if (e === s) return null;

    const direction: "long" | "short" = e > s ? "long" : "short";
    const stopDistance = Math.abs(e - s);
    const stopPct = (stopDistance / e) * 100;
    const riskDollars = acc * (risk / 100);
    const sharesRaw = riskDollars / stopDistance;
    const shares = Math.max(0, Math.floor(sharesRaw));
    const positionSize = shares * e;
    const positionPct = (positionSize / acc) * 100;
    const actualLoss = shares * stopDistance;

    let rrRatio: number | null = null;
    let maxProfit: number | null = null;
    let targetPct: number | null = null;
    if (isFinite(t) && t > 0) {
      const profitDistance = direction === "long" ? t - e : e - t;
      if (profitDistance > 0) {
        rrRatio = profitDistance / stopDistance;
        maxProfit = shares * profitDistance;
        targetPct = (profitDistance / e) * 100;
      }
    }

    return {
      direction,
      stopDistance,
      stopPct,
      riskDollars,
      shares,
      positionSize,
      positionPct,
      actualLoss,
      rrRatio,
      maxProfit,
      targetPct,
      tooBigPosition: positionPct > 100, // can't afford it without margin
      heavyConcentration: positionPct > 25 && positionPct <= 100,
      highRisk: parseFloat(riskPct) > 3,
    };
  }, [accountSize, riskPct, entry, stop, target]);

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0c1118] px-4 py-3.5 text-base font-medium text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none transition";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* INPUT FORM */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Inputs</h2>

        {/* Account size */}
        <div className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">Account Size</label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">$</span>
            <input
              type="number"
              inputMode="decimal"
              value={accountSize}
              onChange={(e) => setAccountSize(e.target.value)}
              placeholder="10000"
              className={inputClass + " pl-9"}
            />
          </div>
          <p className="mt-1 text-[11px] text-white/30">Total capital you&apos;re trading with.</p>
        </div>

        {/* Risk % */}
        <div className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">
            Risk Per Trade
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {RISK_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setRiskPct(String(p))}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  parseFloat(riskPct) === p
                    ? "bg-emerald-500 text-black"
                    : "border border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
          <div className="relative mt-2">
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
              placeholder="2"
              className={inputClass + " pr-9"}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">%</span>
          </div>
          {calc?.highRisk && (
            <p className="mt-1.5 text-[11px] text-amber-400">
              ⚠ Above 3% per trade is aggressive. 4 losses in a row will drawdown {(parseFloat(riskPct) * 4).toFixed(0)}%+ of your account.
            </p>
          )}
        </div>

        {/* Entry */}
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

        {/* Stop */}
        <div className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">Stop Loss Price</label>
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
              Stop is <span className="text-white/60">{fmtPct(calc.stopPct)}</span> {calc.direction === "long" ? "below" : "above"} entry · {calc.direction.toUpperCase()} setup
            </p>
          )}
        </div>

        {/* Target (optional) */}
        <div className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">
            Target Price <span className="font-normal text-white/30">(optional)</span>
          </label>
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
          <p className="mt-1 text-[11px] text-white/30">
            Add a target to see your reward-to-risk ratio.
          </p>
        </div>
      </div>

      {/* RESULT */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] to-white/[0.01] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Result</h2>
          {calc && (
            <button
              onClick={copyShareLink}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/60 transition hover:border-white/20 hover:text-white"
              title="Copy a shareable link to this calculation"
            >
              {copied ? "✓ Link copied" : "🔗 Share this"}
            </button>
          )}
        </div>

        {!calc ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
            <p className="text-4xl">📊</p>
            <p className="mt-4 text-sm text-white/40">
              Enter your account size, risk %, entry, and stop above —<br />
              the result appears instantly.
            </p>
          </div>
        ) : (
          <>
            {/* Big number — share count */}
            <div className="mt-5 rounded-xl bg-white/[0.02] p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-white/40">Buy this many shares</p>
              <p className="mt-2 text-6xl font-bold text-emerald-400 tabular-nums">
                {calc.shares.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-white/50">
                of {entry ? `$${parseFloat(entry).toFixed(2)}` : "—"} ·
                {" "}{fmtMoney(calc.positionSize)} position
              </p>
            </div>

            {/* Risk tile (most important) */}
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">If stopped out</span>
                <span className="text-[11px] text-white/40">{fmtPct(parseFloat(riskPct))} of account</span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">−{fmtMoney(calc.actualLoss)}</p>
              <p className="mt-1 text-[11px] text-white/40">
                Max loss if your stop is hit. Comfortable with this number? If not, lower the risk %.
              </p>
            </div>

            {/* Sub-tiles */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/40">Position Size</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{fmtMoney(calc.positionSize)}</p>
                <p className={`mt-1 text-[11px] tabular-nums ${
                  calc.tooBigPosition ? "text-red-400" :
                  calc.heavyConcentration ? "text-amber-400" :
                  "text-white/40"
                }`}>
                  {fmtPct(calc.positionPct)} of account
                  {calc.tooBigPosition && " · needs margin!"}
                  {calc.heavyConcentration && " · heavy concentration"}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/40">Stop Distance</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{fmtMoney(calc.stopDistance)}</p>
                <p className="mt-1 text-[11px] text-white/40 tabular-nums">{fmtPct(calc.stopPct)} from entry</p>
              </div>
            </div>

            {/* R:R if target provided */}
            {calc.rrRatio !== null && calc.maxProfit !== null && (
              <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">If target hit</span>
                  <span className={`text-[11px] font-bold ${
                    calc.rrRatio >= 2 ? "text-emerald-400" :
                    calc.rrRatio >= 1 ? "text-amber-400" :
                    "text-red-400"
                  }`}>
                    R:R {calc.rrRatio.toFixed(2)} : 1
                    {calc.rrRatio < 1 && " · skip this trade"}
                    {calc.rrRatio >= 1 && calc.rrRatio < 2 && " · marginal"}
                    {calc.rrRatio >= 2 && " · strong setup"}
                  </span>
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">+{fmtMoney(calc.maxProfit)}</p>
                <p className="mt-1 text-[11px] text-white/40">
                  Maximum profit if price reaches your target ({fmtPct(calc.targetPct ?? 0)} from entry).
                </p>
              </div>
            )}

            {/* Quick warning if no target was given */}
            {calc.rrRatio === null && (
              <p className="mt-4 text-center text-[11px] text-white/30">
                💡 Tip: add a target above to see your reward-to-risk ratio.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
