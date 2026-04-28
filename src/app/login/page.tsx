"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) router.push("/research");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      router.push("/research");
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found") setError("No account found with this email.");
      else if (code === "auth/wrong-password") setError("Incorrect password.");
      else if (code === "auth/invalid-credential") setError("Invalid email or password.");
      else if (code === "auth/email-already-in-use") setError("Email already registered. Try logging in.");
      else if (code === "auth/weak-password") setError("Password must be at least 6 characters.");
      else setError(err?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="absolute top-0 left-1/2 h-60 w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <a href="/" className="text-xl font-semibold tracking-tight text-white">
            Mezan <span className="text-emerald-400">Research</span>
          </a>
          <p className="mt-2 text-sm text-white/40">
            {isSignup ? "Create your account" : "Sign in to access research"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                minLength={6}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 py-3.5 text-sm font-bold text-black transition hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-white/30">
          {isSignup ? (
            <>Already have an account? <button onClick={() => setIsSignup(false)} className="text-emerald-400 hover:underline">Sign in</button></>
          ) : (
            <>Don&apos;t have an account? <button onClick={() => setIsSignup(true)} className="text-emerald-400 hover:underline">Create one</button></>
          )}
        </p>

        <p className="mt-4 text-center text-xs text-white/20">
          <a href="/elite" className="hover:text-emerald-400">Learn about Mezan Research</a>
        </p>
      </div>
    </main>
  );
}
