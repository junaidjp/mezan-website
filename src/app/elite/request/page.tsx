"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://compliance-check-api-223407081609.us-central1.run.app";

export default function EliteRequestPage() {
  const router = useRouter();
  const { user, loading, isElite } = useAuth();

  const [experience, setExperience] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  /* ---------- Loading / auth gate ---------- */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-white/40">
        Loading...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h1 className="mb-3 text-xl font-semibold text-white">Sign in required</h1>
          <p className="mb-6 text-sm text-white/50">
            Please sign in with your Mezan app account to request Elite access.
          </p>
          <button
            onClick={() => router.push("/login?next=/elite/request")}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 py-3 text-sm font-bold text-black hover:from-emerald-400 hover:to-emerald-300"
          >
            Sign in
          </button>
        </div>
      </main>
    );
  }

  if (isElite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
        <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-8 text-center">
          <h1 className="mb-3 text-xl font-semibold text-emerald-300">You already have Elite access ✨</h1>
          <p className="text-sm text-white/60">
            Open the Mezan app to use advanced scans, momentum alerts, and AI trade ideas.
          </p>
        </div>
      </main>
    );
  }

  /* ---------- Success state ---------- */
  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
        <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-8 text-center">
          <h1 className="mb-3 text-xl font-semibold text-emerald-300">Request submitted 🎉</h1>
          <p className="text-sm text-white/60">
            We&apos;ll review your application and email you within a few days. You can keep using the
            7-day Pro trial in the app in the meantime.
          </p>
          <button
            onClick={() => router.push("/elite")}
            className="mt-6 rounded-xl border border-white/20 px-5 py-2.5 text-sm text-white/80 hover:bg-white/10"
          >
            Back to Elite
          </button>
        </div>
      </main>
    );
  }

  /* ---------- Submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (experience.trim().length < 10) {
      setError("Please describe your trading experience (at least 10 characters).");
      return;
    }
    if (!agreed) {
      setError("You must agree to the trading-responsibility terms.");
      return;
    }

    setSubmitting(true);
    try {
      const idToken = await user.getIdToken(true);
      const res = await fetch(`${BACKEND_URL}/api/v1/elite-requests`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tradingExperience: experience.trim(),
          agreedToTerms: true,
        }),
      });

      if (!res.ok) {
        let msg = `Request failed (HTTP ${res.status}).`;
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Form ---------- */
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-16">
      <div className="absolute top-0 left-1/2 h-60 w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />

      <div className="relative w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Request <span className="text-emerald-400">Elite</span> Access
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Elite is for active traders. Tell us a bit about you and we&apos;ll review it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="space-y-6">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                Signed in as
              </label>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/70">
                {user.email}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                Your trading experience
              </label>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={5}
                required
                placeholder="How long have you been trading? What instruments / strategies do you focus on? Account size and approach are useful too."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
              <p className="mt-1 text-xs text-white/30">{experience.length} characters</p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald-500"
              />
              <span className="text-xs leading-relaxed text-white/60">
                I agree to trade responsibly with capital I can afford to lose. I understand that
                Mezan signals are research and education, not financial advice, and that I am
                solely responsible for my trading decisions. I have read the{" "}
                <a href="/terms-conditions" className="text-emerald-400 hover:underline">
                  Terms &amp; Conditions
                </a>{" "}
                and{" "}
                <a href="/privacy-policy" className="text-emerald-400 hover:underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 py-3.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-white/30">
          Need help?{" "}
          <a href="mailto:support@mezaninvesting.com" className="text-emerald-400 hover:underline">
            support@mezaninvesting.com
          </a>
        </p>
      </div>
    </main>
  );
}
