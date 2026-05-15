"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

type Field = { key: string; label: string; placeholder?: string; long?: boolean };
type Step = {
  id: string;
  num: string;
  title: string;
  description: string;
  fields?: Field[];
};
type Phase = {
  id: string;
  title: string;
  subtitle: string;
  accent: "emerald" | "amber";
  steps: Step[];
};

const PHASES: Phase[] = [
  {
    id: "phase-1",
    title: "Phase 1 · Foundation & Education",
    subtitle: "",
    accent: "emerald",
    steps: [
      {
        id: "01",
        num: "01",
        title: "Download the Mezan App",
        description:
          "Install the Mezan Investing app on your device. Explore the dashboard, watchlists, and strategy sections before doing anything else.",
      },
      {
        id: "02",
        num: "02",
        title: "Complete All Training Modules",
        description:
          "Work through every module in full. The goal is to train yourself to think like a trader — not a gambler. By the end, select your niche: Day Trader · Swing Trader · Investor (or Hybrid).",
        fields: [{ key: "style", label: "My trading style", placeholder: "e.g. Swing Trader" }],
      },
    ],
  },
  {
    id: "phase-2",
    title: "Phase 2 · Paper Trading — Round 1",
    subtitle: "37 Trades",
    accent: "emerald",
    steps: [
      {
        id: "03",
        num: "03",
        title: "Open a Paper Trading Account",
        description:
          "Choose a brokerage that offers a paper (simulated) trading account — TD Ameritrade thinkorswim, Webull, or Interactive Brokers are solid options. Set your starting balance to exactly $10,000.",
      },
      {
        id: "04",
        num: "04",
        title: "Execute 37 Paper Trades",
        description:
          "Apply whatever strategy you learned — momentum, breakout, swing. Take all 37 trades using real market conditions. Do not skip or shortcut this step. Quality > speed.",
        fields: [
          { key: "p2-trades", label: "Trades completed", placeholder: "0 / 37" },
          { key: "p2-winrate", label: "Win rate %", placeholder: "e.g. 52" },
          { key: "p2-rr", label: "Avg R:R", placeholder: "e.g. 1.8" },
        ],
      },
      {
        id: "05",
        num: "05",
        title: "Journal Every Single Trade",
        description:
          "For each of the 37 trades, record: Entry price · Exit price · Stop loss · Reason for entry · What happened · What you learned. No journal = no advancement to Phase 3.",
      },
    ],
  },
  {
    id: "phase-3",
    title: "Phase 3 · First Live Exposure",
    subtitle: "2 Real Trades",
    accent: "amber",
    steps: [
      {
        id: "06",
        num: "06",
        title: "Take 2 Real Trades — Minimum Size Only",
        description:
          "Use only 2–5 shares per trade. Example: buy 2 shares of NVDA and target a $2–$4 gain per share. The goal is to feel the emotional difference between paper and live — not to make money.",
        fields: [
          { key: "p3-t1", label: "Trade 1", placeholder: "Ticker" },
          { key: "p3-t1r", label: "Result", placeholder: "+$X / -$X" },
          { key: "p3-t2", label: "Trade 2", placeholder: "Ticker" },
          { key: "p3-t2r", label: "Result", placeholder: "+$X / -$X" },
        ],
      },
      {
        id: "07",
        num: "07",
        title: "Reflect on Emotional Response",
        description:
          "How did it feel different from paper trading? Did fear or greed affect your decisions? What will you do differently?",
        fields: [{ key: "p3-reflect", label: "Reflection", placeholder: "Write 3 sentences…", long: true }],
      },
    ],
  },
  {
    id: "phase-4",
    title: "Phase 4 · Paper Trading — Round 2",
    subtitle: "10 Trades",
    accent: "emerald",
    steps: [
      {
        id: "08",
        num: "08",
        title: "Return to Paper — 10 Trades",
        description:
          "Apply lessons from your live exposure. These 10 trades should be more refined than Round 1. Focus on discipline: no FOMO entries, no moving stop losses.",
        fields: [
          { key: "p4-trades", label: "Trades completed", placeholder: "0 / 10" },
          { key: "p4-winrate", label: "Win rate %", placeholder: "e.g. 60" },
          { key: "p4-rr", label: "Avg R:R", placeholder: "e.g. 2.0" },
        ],
      },
    ],
  },
  {
    id: "phase-5",
    title: "Phase 5 · Live Trading — Round 2",
    subtitle: "4 Trades",
    accent: "amber",
    steps: [
      {
        id: "09",
        num: "09",
        title: "Take 4 Real Trades",
        description:
          "You can slightly increase size if your paper R:R was above 1.5 and win rate above 50%. Otherwise keep 2–5 shares. Journal all 4 trades immediately after closing.",
        fields: [
          { key: "p5-t1", label: "Trade 1 (✓/✗)", placeholder: "Ticker · ✓" },
          { key: "p5-t2", label: "Trade 2 (✓/✗)", placeholder: "Ticker · ✓" },
          { key: "p5-t3", label: "Trade 3 (✓/✗)", placeholder: "Ticker · ✓" },
          { key: "p5-t4", label: "Trade 4 (✓/✗)", placeholder: "Ticker · ✓" },
        ],
      },
    ],
  },
  {
    id: "phase-6",
    title: "Phase 6 · Paper Trading — Round 3",
    subtitle: "5 Trades",
    accent: "emerald",
    steps: [
      {
        id: "10",
        num: "10",
        title: "Return to Paper — 5 Trades",
        description:
          "Fine-tune entries. By now you should have a clear setup you trade repeatedly — not random ideas. Each trade must match your defined setup criteria.",
        fields: [
          { key: "p6-trades", label: "Trades completed", placeholder: "0 / 5" },
          { key: "p6-winrate", label: "Win rate %", placeholder: "e.g. 65" },
          { key: "p6-rr", label: "Avg R:R", placeholder: "e.g. 2.2" },
        ],
      },
    ],
  },
  {
    id: "phase-7",
    title: "Phase 7 · Live Trading — Round 3",
    subtitle: "6 Trades → Ongoing",
    accent: "amber",
    steps: [
      {
        id: "11",
        num: "11",
        title: "Take 6 Real Trades",
        description:
          "You've now completed the full programme. These 6 trades mark your transition into consistent live trading. Continue journaling. Scale size gradually — only when your stats justify it.",
        fields: [
          { key: "p7-t1", label: "Trade 1 (✓/✗)", placeholder: "Ticker · ✓" },
          { key: "p7-t2", label: "Trade 2 (✓/✗)", placeholder: "Ticker · ✓" },
          { key: "p7-t3", label: "Trade 3 (✓/✗)", placeholder: "Ticker · ✓" },
          { key: "p7-t4", label: "Trade 4 (✓/✗)", placeholder: "Ticker · ✓" },
          { key: "p7-t5", label: "Trade 5 (✓/✗)", placeholder: "Ticker · ✓" },
          { key: "p7-t6", label: "Trade 6 (✓/✗)", placeholder: "Ticker · ✓" },
        ],
      },
      {
        id: "12",
        num: "12",
        title: "Review & Set Next Milestone",
        description:
          "After all 6 live trades, review your full journal from Phase 2 onwards. Identify your single biggest edge and your single biggest leak.",
        fields: [
          { key: "edge", label: "My edge", placeholder: "What I do well…", long: true },
          { key: "leak", label: "My leak", placeholder: "What costs me money…", long: true },
        ],
      },
    ],
  },
];

const STORAGE_KEY = "mezan_trader_readiness_v1";

type State = { checked: Record<string, boolean>; fields: Record<string, string> };

export default function Checklist() {
  const [state, setState] = useState<State>({ checked: {}, fields: {} });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, loaded]);

  const totalSteps = useMemo(() => PHASES.reduce((sum, p) => sum + p.steps.length, 0), []);
  const completedSteps = useMemo(
    () => Object.values(state.checked).filter(Boolean).length,
    [state.checked],
  );
  const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const toggle = (id: string) =>
    setState((s) => ({ ...s, checked: { ...s.checked, [id]: !s.checked[id] } }));

  const setField = (key: string, value: string) =>
    setState((s) => ({ ...s, fields: { ...s.fields, [key]: value } }));

  const reset = () => {
    if (confirm("Reset all checks and notes? This cannot be undone.")) {
      setState({ checked: {}, fields: {} });
    }
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentW = pageW - margin * 2;
    let y = 0;

    // Header bar (dark + emerald accent)
    doc.setFillColor(6, 10, 16);
    doc.rect(0, 0, pageW, 110, "F");
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 4, 110, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("MEZAN INVESTING", margin, 46);
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(13);
    doc.text("TRADER READINESS CHECKLIST", margin, 66);
    doc.setTextColor(180, 190, 200);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(
      "Complete every phase before risking real capital — think like a trader, not a gambler.",
      margin,
      84,
    );

    // Estimated pill
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(pageW - margin - 110, 20, 110, 64, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("ESTIMATED", pageW - margin - 55, 36, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("3-4 MOS", pageW - margin - 55, 58, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("full programme", pageW - margin - 55, 72, { align: "center" });

    y = 140;

    // Intro
    doc.setTextColor(60, 70, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const intro = doc.splitTextToSize(
      "Work through each phase in order. Do not advance to the next phase until the current one is fully complete. This programme is designed to build real edge — not just confidence.",
      contentW,
    );
    doc.text(intro, margin, y);
    y += intro.length * 12 + 14;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageH - 60) {
        doc.addPage();
        y = margin + 10;
      }
    };

    PHASES.forEach((phase) => {
      ensureSpace(60);

      // Phase header bar
      const isAmber = phase.accent === "amber";
      const accent = isAmber ? [251, 191, 36] : [16, 185, 129]; // amber-400 vs emerald-500
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y, contentW, 22, "F");
      doc.setFillColor(accent[0], accent[1], accent[2]);
      doc.rect(margin, y, 3, 22, "F");
      doc.setTextColor(30, 40, 55);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const phaseLabel = phase.subtitle
        ? `${phase.title.toUpperCase()}  (${phase.subtitle.toUpperCase()})`
        : phase.title.toUpperCase();
      doc.text(phaseLabel, margin + 10, y + 15);
      y += 32;

      phase.steps.forEach((step) => {
        const descLines = doc.splitTextToSize(step.description, contentW - 60);
        const fieldLines = (step.fields || []).map((f) => `${f.label}: ${"_".repeat(40)}`);
        const fieldText = fieldLines.length
          ? doc.splitTextToSize(fieldLines.join("    "), contentW - 60)
          : [];
        const blockH = 18 + descLines.length * 11 + fieldText.length * 12 + 18;
        ensureSpace(blockH);

        // Card background
        const cardBg = isAmber ? [254, 248, 235] : [236, 253, 244];
        doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
        doc.roundedRect(margin, y, contentW, blockH, 6, 6, "F");

        // Checkbox
        doc.setDrawColor(120, 130, 145);
        doc.setLineWidth(1.2);
        doc.rect(margin + 12, y + 10, 14, 14, "S");

        // Step number pill
        doc.setFillColor(accent[0], accent[1], accent[2]);
        doc.roundedRect(margin + 34, y + 10, 22, 14, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(step.num, margin + 45, y + 20, { align: "center" });

        // Title
        doc.setTextColor(30, 40, 55);
        doc.setFontSize(10.5);
        doc.text(step.title, margin + 64, y + 21);

        // Description
        doc.setTextColor(75, 85, 100);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(descLines, margin + 64, y + 34);

        // Field blanks
        if (fieldText.length) {
          doc.setTextColor(95, 105, 120);
          doc.setFontSize(8.5);
          doc.text(fieldText, margin + 64, y + 34 + descLines.length * 11 + 6);
        }

        y += blockH + 8;
      });

      y += 6;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1);
      doc.line(margin, pageH - 40, pageW - margin, pageH - 40);
      doc.setTextColor(120, 130, 145);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        "Mezan Investing  ·  Trader Readiness Programme  ·  mezaninvesting.com",
        pageW / 2,
        pageH - 26,
        { align: "center" },
      );
      doc.setFont("helvetica", "italic");
      doc.text(
        "The market rewards patience and punishes impatience.",
        pageW / 2,
        pageH - 14,
        { align: "center" },
      );
    }

    doc.save("Mezan_Trader_Readiness_Checklist.pdf");
  };

  return (
    <div>
      {/* Progress */}
      <div className="sticky top-[73px] z-30 -mx-6 mb-8 border-b border-white/5 bg-[#060a10]/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-white/60">
                {completedSteps} of {totalSteps} steps complete
              </span>
              <span className="font-semibold text-emerald-400">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={downloadPdf}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20"
              title="Download a printable PDF"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 2a.75.75 0 00-1.5 0v8.69L7.28 8.72a.75.75 0 00-1.06 1.06l3.25 3.25a.75.75 0 001.06 0l3.25-3.25a.75.75 0 10-1.06-1.06l-1.97 1.97V2z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={() => window.print()}
              className="hidden rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:border-white/20 hover:text-white/80 sm:inline-block"
              title="Print this page"
            >
              Print
            </button>
            <button
              onClick={reset}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:border-white/20 hover:text-white/80"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="mx-auto max-w-3xl space-y-10">
        {PHASES.map((phase) => {
          const accentBorder = phase.accent === "amber" ? "border-amber-500/30" : "border-emerald-500/30";
          const accentBg = phase.accent === "amber" ? "bg-amber-500/[0.04]" : "bg-emerald-500/[0.04]";
          const accentText = phase.accent === "amber" ? "text-amber-400" : "text-emerald-400";
          return (
            <section key={phase.id}>
              <div className={`mb-4 rounded-xl border ${accentBorder} ${accentBg} px-4 py-3`}>
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  <span className={accentText}>■ </span>
                  {phase.title}
                  {phase.subtitle && <span className="ml-2 text-white/40">({phase.subtitle})</span>}
                </h2>
              </div>
              <div className="space-y-4">
                {phase.steps.map((step) => {
                  const done = !!state.checked[step.id];
                  return (
                    <div
                      key={step.id}
                      className={`rounded-2xl border bg-white/[0.02] p-5 transition ${
                        done ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggle(step.id)}
                          aria-label={done ? "Uncheck step" : "Check step"}
                          className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${
                            done
                              ? "border-emerald-500 bg-emerald-500 text-black"
                              : "border-white/20 hover:border-white/40"
                          }`}
                        >
                          {done && (
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                                phase.accent === "amber"
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "bg-emerald-500/15 text-emerald-400"
                              }`}
                            >
                              {step.num}
                            </span>
                            <h3 className={`text-base font-semibold ${done ? "text-white/60 line-through" : ""}`}>
                              {step.title}
                            </h3>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-white/55">{step.description}</p>
                          {step.fields && step.fields.length > 0 && (
                            <div
                              className={`mt-4 grid gap-3 ${
                                step.fields.length > 1 && step.fields.every((f) => !f.long)
                                  ? "sm:grid-cols-2"
                                  : ""
                              }`}
                            >
                              {step.fields.map((f) => (
                                <label key={f.key} className="block">
                                  <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/40">
                                    {f.label}
                                  </span>
                                  {f.long ? (
                                    <textarea
                                      value={state.fields[f.key] ?? ""}
                                      onChange={(e) => setField(f.key, e.target.value)}
                                      placeholder={f.placeholder}
                                      rows={3}
                                      className="w-full resize-none rounded-lg border border-white/10 bg-[#0c1118] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={state.fields[f.key] ?? ""}
                                      onChange={(e) => setField(f.key, e.target.value)}
                                      placeholder={f.placeholder}
                                      className="w-full rounded-lg border border-white/10 bg-[#0c1118] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                                    />
                                  )}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-white/30">
        Progress saves automatically in your browser. The market rewards patience and punishes impatience —
        every professional trader you admire went through a version of this process.
      </p>
    </div>
  );
}
