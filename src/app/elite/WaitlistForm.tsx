"use client";

import { useState } from "react";

type Props = {
  plan: "monthly" | "annual";
  accentColor: "amber" | "emerald";
};

export default function WaitlistForm({ plan, accentColor }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim(), plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || data.error || "Could not join waitlist.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
      setStatus("error");
    }
  };

  const accent = accentColor === "amber" ? "amber" : "emerald";
  const linkClass =
    accent === "amber"
      ? "text-amber-300 hover:text-amber-200"
      : "text-emerald-400 hover:text-emerald-300";

  if (status === "success") {
    return (
      <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-center">
        <p className="text-xs font-semibold text-emerald-300">✓ You&apos;re on the list</p>
        <p className="mt-1 text-[11px] text-white/50">
          We&apos;ll email <span className="text-white/70">{email}</span> when {plan} reopens.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`mt-3 block w-full text-center text-xs ${linkClass} transition`}
      >
        Join the {plan} waitlist →
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/40 focus:outline-none"
      />
      <input
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/40 focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-lg bg-emerald-500/90 px-4 py-2 text-xs font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Joining…" : `Join ${plan} waitlist`}
      </button>
      {errorMsg && <p className="text-center text-[11px] text-red-400">{errorMsg}</p>}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="block w-full text-center text-[10px] text-white/30 hover:text-white/50"
      >
        Cancel
      </button>
    </form>
  );
}
