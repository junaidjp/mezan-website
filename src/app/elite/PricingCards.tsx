"use client";

import WaitlistForm from "./WaitlistForm";

export default function PricingCards() {
  return (
    <div className="mx-auto mt-12 max-w-4xl">
      <div className="grid gap-6 md:grid-cols-2">
        {/* MONTHLY — WAITLIST */}
        <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.06] to-white/[0.02] p-7">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Monthly</h3>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Waitlist
            </span>
          </div>
          <div className="mt-5">
            <span className="text-4xl font-bold text-white/80">$15.99</span>
            <span className="ml-1 text-sm text-white/40">/ month</span>
          </div>
          <p className="mt-2 text-xs text-white/40">Currently paused for new sign-ups.</p>

          <ul className="mt-6 space-y-2 text-sm text-white/60">
            <li className="flex gap-2"><span className="text-amber-400">·</span> Full Mezan Research access</li>
            <li className="flex gap-2"><span className="text-amber-400">·</span> Mezan Investing app Elite tier</li>
            <li className="flex gap-2"><span className="text-amber-400">·</span> Real-time signals & screener</li>
            <li className="flex gap-2"><span className="text-amber-400">·</span> AI research, sentiment, insider data</li>
          </ul>

          <button
            disabled
            className="mt-7 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/50"
          >
            Currently on Waitlist
          </button>
          <WaitlistForm plan="monthly" accentColor="amber" />
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
          <WaitlistForm plan="annual" accentColor="emerald" />
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-white/40">
        Existing subscribers continue to have full access. We&apos;ll reopen sign-ups when capacity allows —
        join either waitlist to be notified.
      </p>
    </div>
  );
}
