"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function PricingCards() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subscribeMonthly = async () => {
    setErrorMsg(null);
    if (!user || !user.email) {
      router.push("/login?redirect=/elite%23pricing");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, email: user.email, plan: "monthly" }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErrorMsg(data.message || data.error || "Could not start checkout. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (e: any) {
      setErrorMsg(e.message || "Could not start checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-4xl">
      <div className="grid gap-6 md:grid-cols-2">
        {/* MONTHLY — ACTIVE */}
        <div className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.06] to-white/[0.02] p-7">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Monthly</h3>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Available
            </span>
          </div>
          <div className="mt-5">
            <span className="text-4xl font-bold">$15.99</span>
            <span className="ml-1 text-sm text-white/40">/ month</span>
          </div>
          <p className="mt-2 text-xs text-white/40">Cancel anytime.</p>

          <ul className="mt-6 space-y-2 text-sm text-white/70">
            <li className="flex gap-2"><span className="text-emerald-400">✓</span> Full Mezan Research access</li>
            <li className="flex gap-2"><span className="text-emerald-400">✓</span> Mezan Investing app Elite tier</li>
            <li className="flex gap-2"><span className="text-emerald-400">✓</span> Real-time signals & screener</li>
            <li className="flex gap-2"><span className="text-emerald-400">✓</span> AI research, sentiment, insider data</li>
          </ul>

          <button
            onClick={subscribeMonthly}
            disabled={loading}
            className="mt-7 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 py-3 text-sm font-bold text-black transition hover:from-emerald-400 hover:to-emerald-300 shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Redirecting…" : "Subscribe Monthly"}
          </button>
          {errorMsg && (
            <p className="mt-3 text-xs text-red-400">{errorMsg}</p>
          )}
        </div>

        {/* ANNUAL — SOLD OUT */}
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-7 opacity-90">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white/80">Annual</h3>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Sold Out
            </span>
          </div>
          <div className="mt-5">
            <span className="text-4xl font-bold text-white/60 line-through decoration-white/20">$149.99</span>
            <span className="ml-1 text-sm text-white/30">/ year</span>
          </div>
          <p className="mt-2 text-xs text-white/40">Limited seats — currently full.</p>

          <ul className="mt-6 space-y-2 text-sm text-white/40">
            <li className="flex gap-2"><span>·</span> Same access as monthly</li>
            <li className="flex gap-2"><span>·</span> ~22% saved vs monthly</li>
            <li className="flex gap-2"><span>·</span> Locked-in price for 12 months</li>
          </ul>

          <button
            disabled
            className="mt-7 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/40"
          >
            Sold Out
          </button>
          <a
            href="mailto:support@mezaninvesting.com?subject=Mezan%20Research%20Annual%20-%20Waitlist"
            className="mt-3 block text-center text-xs text-emerald-400 hover:underline"
          >
            Join the annual waitlist →
          </a>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-white/40">
        Existing annual subscribers continue to have full access. Annual will reopen when capacity allows.
      </p>
    </div>
  );
}
