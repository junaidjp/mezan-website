"use client";

import { useEffect, useState } from "react";

type Entry = {
  _id: string;
  email: string;
  plan: "monthly" | "annual";
  name: string | null;
  status: "pending" | "notified";
  addedAt: string;
  notifiedAt?: string;
  source?: string;
};

type Summary = Record<string, Record<string, number>>;

export default function WaitlistAdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary>({});
  const [planFilter, setPlanFilter] = useState<"" | "monthly" | "annual">("");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "notified">("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmingNotify, setConfirmingNotify] = useState<"monthly" | "annual" | "all" | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("mezan_admin_key") : null;
    if (stored) {
      setAdminKey(stored);
      setAuthed(true);
    }
  }, []);

  const load = async () => {
    if (!adminKey) return;
    setLoading(true);
    setMsg(null);
    try {
      const params = new URLSearchParams();
      if (planFilter) params.set("plan", planFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/waitlist?${params.toString()}`, {
        headers: { "X-Admin-Key": adminKey },
        cache: "no-store",
      });
      if (res.status === 401) {
        setMsg("Unauthorized — admin key rejected.");
        setAuthed(false);
        window.localStorage.removeItem("mezan_admin_key");
        return;
      }
      const data = await res.json();
      setEntries(data.entries || []);
      setSummary(data.summary || {});
      setAuthed(true);
      window.localStorage.setItem("mezan_admin_key", adminKey);
    } catch (e: any) {
      setMsg(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, planFilter, statusFilter]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey) {
      setAuthed(true);
    }
  };

  const notify = async (plan: "monthly" | "annual" | "all", dryRun: boolean) => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/waitlist/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify({ plan, dryRun }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(`Error: ${data.error || res.status}`);
      } else {
        setMsg(
          dryRun
            ? `Dry run: would have sent to ${data.sent} recipients (no emails actually sent).`
            : `Sent ${data.sent} of ${data.total} (${data.failed} failed).`,
        );
        await load();
      }
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
      setConfirmingNotify(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this entry permanently?")) return;
    try {
      const res = await fetch(`/api/admin/waitlist?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      });
      if (res.ok) await load();
    } catch {}
  };

  const exportCsv = () => {
    const rows = [
      ["email", "name", "plan", "status", "addedAt", "notifiedAt", "source"].join(","),
      ...entries.map((e) =>
        [e.email, e.name || "", e.plan, e.status, e.addedAt, e.notifiedAt || "", e.source || ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060a10] px-4">
        <form onSubmit={handleAuth} className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h1 className="text-lg font-bold text-white">Waitlist Admin</h1>
          <p className="mt-1 text-xs text-white/40">Enter the admin API key to continue.</p>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Admin API key"
            className="mt-4 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            className="mt-3 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-emerald-400"
          >
            Sign in
          </button>
          {msg && <p className="mt-3 text-xs text-red-400">{msg}</p>}
        </form>
      </main>
    );
  }

  const monthlyPending = summary.monthly?.pending || 0;
  const monthlyNotified = summary.monthly?.notified || 0;
  const annualPending = summary.annual?.pending || 0;
  const annualNotified = summary.annual?.notified || 0;

  return (
    <main className="min-h-screen bg-[#060a10] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-400">Mezan Research</p>
            <h1 className="mt-1 text-2xl font-bold">Waitlist Queue</h1>
          </div>
          <button
            onClick={() => {
              window.localStorage.removeItem("mezan_admin_key");
              setAuthed(false);
              setAdminKey("");
            }}
            className="text-xs text-white/40 hover:text-white"
          >
            Sign out
          </button>
        </div>

        {/* Summary tiles */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Monthly · pending", value: monthlyPending, color: "text-amber-400" },
            { label: "Monthly · notified", value: monthlyNotified, color: "text-white/60" },
            { label: "Annual · pending", value: annualPending, color: "text-amber-400" },
            { label: "Annual · notified", value: annualNotified, color: "text-white/60" },
          ].map((t) => (
            <div key={t.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/40">{t.label}</p>
              <p className={`mt-1 text-2xl font-bold ${t.color}`}>{t.value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <span className="text-xs text-white/40 uppercase tracking-wider">Notify:</span>
          {(["monthly", "annual", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setConfirmingNotify(p)}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
            >
              Notify {p} pending
            </button>
          ))}
          <span className="text-xs text-white/40 uppercase tracking-wider ml-4">Filter:</span>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as any)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs"
          >
            <option value="">All plans</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs"
          >
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="notified">Notified</option>
          </select>
          <button
            onClick={exportCsv}
            className="ml-auto rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs hover:bg-white/[0.08]"
          >
            Export CSV
          </button>
        </div>

        {confirmingNotify && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-200">
              About to send notification emails to all <strong>{confirmingNotify}</strong> pending entries.
              This is irreversible (recipients will be marked &quot;notified&quot;).
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => notify(confirmingNotify, true)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs"
              >
                Dry run (no emails)
              </button>
              <button
                onClick={() => notify(confirmingNotify, false)}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-black"
              >
                Send for real
              </button>
              <button
                onClick={() => setConfirmingNotify(null)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {msg && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {msg}
          </div>
        )}

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-white/40">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3">Notified</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-white/40">Loading…</td></tr>
              )}
              {!loading && entries.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-white/40">No entries.</td></tr>
              )}
              {entries.map((e) => (
                <tr key={e._id} className="border-b border-white/[0.03] text-sm">
                  <td className="px-4 py-3 font-medium">{e.email}</td>
                  <td className="px-4 py-3 text-white/60">{e.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${e.plan === "monthly" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}`}>
                      {e.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${e.status === "pending" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">
                    {new Date(e.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">
                    {e.notifiedAt ? new Date(e.notifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(e._id)}
                      className="text-xs text-white/30 hover:text-red-400"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
