"use client";

import { useEffect, useState } from "react";

type DatasetTable = {
  table: string;
  type: string;
};

type DatasetConfig = {
  dataset: string;
  tables: DatasetTable[];
};

type SyncResult = {
  dataset: string;
  copied: string[];
  skipped: Array<{ table: string; reason: string }>;
  failed: Array<{ table: string; error: string }>;
};

type InspectResponse = {
  ok: boolean;
  prodProject: string;
  sandboxProject: string;
  datasets: DatasetConfig[];
  note: string;
};

type SyncResponse = {
  ok: boolean;
  dryRun: boolean;
  prodProject: string;
  sandboxProject: string;
  elapsedMs: number;
  copiedTables: number;
  failedTables: number;
  skippedTables: number;
  results: SyncResult[];
  note: string;
  computeLevelsNote: string;
};

export default function BigQuerySyncAdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<InspectResponse | null>(null);
  const [result, setResult] = useState<SyncResponse | null>(null);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("mezan_admin_key")
        : null;
    if (stored) {
      setAdminKey(stored);
      setAuthed(true);
    }
  }, []);

  const loadConfig = async () => {
    if (!adminKey) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/bigquery/sync-prod-to-sandbox", {
        headers: { "X-Admin-Key": adminKey },
        cache: "no-store",
      });
      if (response.status === 401) {
        window.localStorage.removeItem("mezan_admin_key");
        setAuthed(false);
        setMessage("Unauthorized. Admin key was rejected.");
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Failed to load sync configuration.");
        return;
      }
      setConfig(data);
      window.localStorage.setItem("mezan_admin_key", adminKey);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load sync configuration.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) {
      void loadConfig();
    }
  }, [authed]);

  const handleAuth = (event: React.FormEvent) => {
    event.preventDefault();
    if (adminKey) {
      setAuthed(true);
    }
  };

  const runSync = async (dryRun: boolean) => {
    if (!adminKey) return;
    setRunning(true);
    setMessage(null);
    setResult(null);
    try {
      const response = await fetch("/api/admin/bigquery/sync-prod-to-sandbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey,
        },
        body: JSON.stringify({ dryRun }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "BigQuery sync failed.");
        return;
      }
      setResult(data);
      setMessage(data.note);
      await loadConfig();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "BigQuery sync failed.",
      );
    } finally {
      setRunning(false);
    }
  };

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060a10] px-4">
        <form
          onSubmit={handleAuth}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-6"
        >
          <h1 className="text-lg font-bold text-white">BigQuery Sync Admin</h1>
          <p className="mt-1 text-xs text-white/40">
            Enter the admin API key to continue.
          </p>
          <input
            type="password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="Admin API key"
            className="mt-4 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            className="mt-3 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-emerald-400"
          >
            Sign in
          </button>
          {message && <p className="mt-3 text-xs text-red-400">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#060a10] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-400">
              Admin Ops
            </p>
            <h1 className="mt-1 text-2xl font-bold">
              BigQuery Prod to Sandbox Sync
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Copies configured production BigQuery tables into sandbox on
              demand. This only syncs BigQuery tables. compute_levels still
              writes to MongoDB and must be run separately.
            </p>
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

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wider text-white/40">
              Source Project
            </p>
            <p className="mt-2 text-lg font-semibold text-emerald-300">
              {config?.prodProject || "Loading..."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wider text-white/40">
              Target Project
            </p>
            <p className="mt-2 text-lg font-semibold text-sky-300">
              {config?.sandboxProject || "Loading..."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wider text-white/40">
              Configured Datasets
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {config?.datasets.length || 0}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-semibold">Warning</p>
          <p className="mt-1 text-amber-100/80">
            Real sync overwrites sandbox destination tables with current
            production data. Run dry run first if you want to inspect scope.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <button
            onClick={() => runSync(true)}
            disabled={running || loading}
            className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            {running ? "Working..." : "Dry Run"}
          </button>
          <button
            onClick={() => runSync(false)}
            disabled={running || loading}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {running ? "Syncing..." : "Copy Prod to Sandbox"}
          </button>
          <button
            onClick={() => void loadConfig()}
            disabled={running || loading}
            className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/80">
            {message}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Copy Scope</h2>
            {loading && (
              <span className="text-xs text-white/40">Loading...</span>
            )}
          </div>

          <div className="mt-4 space-y-4">
            {config?.datasets.map((dataset) => (
              <div
                key={dataset.dataset}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">
                    {dataset.dataset}
                  </h3>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] uppercase tracking-wider text-white/40">
                    {dataset.tables.length} tables
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {dataset.tables.map((table) => (
                    <span
                      key={`${dataset.dataset}-${table.table}`}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70"
                    >
                      {table.table}
                      <span className="ml-2 text-white/30">{table.type}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {config?.note && (
            <p className="mt-4 text-xs text-white/40">{config.note}</p>
          )}
        </div>

        {result && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">Last Run</h2>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                {result.dryRun ? "Dry Run" : "Applied"}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {[
                {
                  label: "Copied",
                  value: result.copiedTables,
                  tone: "text-emerald-300",
                },
                {
                  label: "Skipped",
                  value: result.skippedTables,
                  tone: "text-amber-300",
                },
                {
                  label: "Failed",
                  value: result.failedTables,
                  tone: "text-red-300",
                },
                {
                  label: "Elapsed",
                  value: `${(result.elapsedMs / 1000).toFixed(1)}s`,
                  tone: "text-white",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-[11px] uppercase tracking-wider text-white/40">
                    {item.label}
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${item.tone}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {result.results.map((datasetResult) => (
                <div
                  key={datasetResult.dataset}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <h3 className="text-sm font-semibold text-white">
                    {datasetResult.dataset}
                  </h3>
                  <p className="mt-2 text-xs text-white/50">
                    Copied: {datasetResult.copied.join(", ") || "None"}
                  </p>
                  {datasetResult.skipped.length > 0 && (
                    <div className="mt-3 text-xs text-amber-200">
                      {datasetResult.skipped
                        .map((item) => `${item.table}: ${item.reason}`)
                        .join(" | ")}
                    </div>
                  )}
                  {datasetResult.failed.length > 0 && (
                    <div className="mt-3 text-xs text-red-300">
                      {datasetResult.failed
                        .map((item) => `${item.table}: ${item.error}`)
                        .join(" | ")}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-white/40">
              {result.computeLevelsNote}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
