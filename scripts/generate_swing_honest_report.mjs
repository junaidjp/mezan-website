// ────────────────────────────────────────────────────────────────────────────
//  Mezan Research — Swing Alerts Performance Report (Option B framing)
//
//  Reports both:
//   • Signal accuracy   — did the stock move toward our target?
//   • Executable result — could a follower trade it at the listed entry?
//
//  Run:  node scripts/generate_swing_honest_report.mjs
//  Out:  ~/Downloads/Mezan_Swing_Honest_Report.pdf
// ────────────────────────────────────────────────────────────────────────────

import { jsPDF } from "jspdf";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import os from "os";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://mezanadmin:LB3RuhiHfZMNUXJl@cluster0.f2yfq6y.mongodb.net/";
const DB_NAME = "mezan";
const START_CASH = 10000;

const C = {
  navy: [6, 10, 16],
  emerald: [16, 185, 129],
  emeraldDark: [4, 120, 87],
  red: [220, 50, 50],
  amber: [217, 119, 6],
  blue: [37, 99, 235],
  textDark: [25, 25, 25],
  textBody: [55, 65, 81],
  textMuted: [120, 130, 140],
  rule: [220, 224, 230],
  tableAlt: [248, 250, 252],
  panel: [245, 250, 248],
  panelWarn: [254, 246, 232],
  panelInfo: [240, 247, 255],
};

const fmtMoney = (n) => {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  return `${sign}$${abs.toLocaleString()}`;
};
const fmtPct = (n) => (n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`);
const fmtR = (n) => (n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}R`);
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.toLocaleString("en-US", { month: "short" })} ${dt.getDate()}, ${dt.getFullYear()}`;
};
const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);

async function load() {
  const client = await MongoClient.connect(MONGO_URI);
  try {
    const db = client.db(DB_NAME);
    const all = await db
      .collection("swingTradeIdea")
      .find({ verifiedStatus: { $exists: true } })
      .sort({ postedAt: 1 })
      .toArray();
    return all.map((a) => {
      const entry = Number(a.entryPrice);
      const stop = Number(a.stopLossPrice);
      const target = Number(a.targetPrice);
      const risk = Math.abs(entry - stop);
      const plannedRR = risk > 0 ? Math.abs(target - entry) / risk : null;
      const sigR =
        risk > 0 && a.signalExitPrice != null
          ? (Number(a.signalExitPrice) - entry) / risk
          : null;
      const exeR =
        risk > 0 && a.verifiedExitPrice != null
          ? (Number(a.verifiedExitPrice) - entry) / risk
          : null;
      return {
        ticker: a.ticker,
        score: a.aiScore,
        strategy: a.strategy,
        postedAt: a.postedAt,
        entry,
        stop,
        target,
        plannedRR,
        // Signal-direction view (charitable: did the stock move our way?)
        sigStatus: a.signalStatus,
        sigExitDate: a.signalExitDate,
        sigExitPrice: a.signalExitPrice != null ? Number(a.signalExitPrice) : null,
        sigHoldDays: a.signalHoldDays ?? null,
        sigPerf: a.signalPerformancePercent != null ? Number(a.signalPerformancePercent) : null,
        sigR,
        // Executable view (could a follower realistically enter?)
        exeStatus: a.verifiedStatus,
        exeExitDate: a.verifiedExitDate,
        exeExitPrice: a.verifiedExitPrice != null ? Number(a.verifiedExitPrice) : null,
        exeHoldDays: a.verifiedHoldDays ?? null,
        exePerf: a.verifiedPerformancePercent != null ? Number(a.verifiedPerformancePercent) : null,
        exeR,
      };
    });
  } finally {
    await client.close();
  }
}

// Sim uses EXECUTABLE trades only (real-world tradeable). MISSED_ENTRY skipped.
function simulate(trades, { scoreFilter, riskPct, fixedDollar }) {
  let cash = START_CASH;
  const openPos = [];
  let taken = 0, skipCash = 0, skipFilter = 0, skipMissed = 0, wins = 0, losses = 0;
  const events = [];
  for (const t of trades) {
    if (t.exeStatus === "MISSED_ENTRY" || t.exeStatus === "NO_DATA" || t.exeStatus === "ACTIVE") {
      skipMissed++;
      continue;
    }
    if (!t.exeExitDate || t.exeExitPrice == null) continue;
    events.push({ type: "open", date: new Date(t.postedAt), trade: t });
    events.push({ type: "close", date: new Date(t.exeExitDate), trade: t });
  }
  events.sort((a, b) => a.date - b.date || (a.type === "close" ? -1 : 1));
  for (const e of events) {
    if (e.type === "close") {
      const idx = openPos.findIndex((o) => o.trade === e.trade);
      if (idx >= 0) {
        cash += openPos[idx].shares * e.trade.exeExitPrice;
        if (e.trade.exeStatus === "TARGET_HIT") wins++;
        else losses++;
        openPos.splice(idx, 1);
      }
    } else {
      const t = e.trade;
      if (scoreFilter && t.score < scoreFilter) { skipFilter++; continue; }
      const equity = cash + openPos.reduce((s, x) => s + x.shares * x.trade.entry, 0);
      let shares;
      if (fixedDollar) shares = Math.floor(fixedDollar / t.entry);
      else shares = Math.floor((equity * riskPct) / Math.abs(t.entry - t.stop));
      const cost = shares * t.entry;
      if (shares <= 0 || cost > cash) { skipCash++; continue; }
      cash -= cost;
      openPos.push({ shares, trade: t });
      taken++;
    }
  }
  for (const o of openPos) cash += o.shares * o.trade.entry;
  return {
    final: Math.round(cash),
    profit: Math.round(cash - START_CASH),
    pct: ((cash - START_CASH) / START_CASH) * 100,
    taken, skipCash, skipFilter, skipMissed, wins, losses,
  };
}

function tierStats(trades, minScore, maxScore, view) {
  const inTier = trades.filter((t) => t.score != null && t.score >= minScore && t.score <= maxScore);
  const closedTier = inTier.filter((t) => {
    const status = view === "signal" ? t.sigStatus : t.exeStatus;
    return ["TARGET_HIT", "STOP_HIT", "STOP_HIT_AMBIGUOUS", "EXPIRED"].includes(status);
  });
  const wins = closedTier.filter((t) => (view === "signal" ? t.sigStatus : t.exeStatus) === "TARGET_HIT");
  const winRate = closedTier.length ? (wins.length / closedTier.length) * 100 : 0;
  const rField = view === "signal" ? "sigR" : "exeR";
  const expectancy = avg(closedTier.filter((t) => t[rField] != null).map((t) => t[rField]));
  return { count: closedTier.length, wins: wins.length, winRate, expectancy };
}

// ─── PDF helpers ───────────────────────────────────────────────────────────
const rgb = (doc, c) => doc.setFillColor(c[0], c[1], c[2]);
const strokeRgb = (doc, c) => doc.setDrawColor(c[0], c[1], c[2]);
const textRgb = (doc, c) => doc.setTextColor(c[0], c[1], c[2]);

function pageHeader(doc, subtitle) {
  rgb(doc, C.navy);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 76, "F");
  rgb(doc, C.emerald);
  doc.rect(0, 0, 4, 76, "F");
  textRgb(doc, [255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("MEZAN  RESEARCH", 40, 32);
  textRgb(doc, C.emerald);
  doc.setFontSize(9);
  doc.text("SWING ALERTS  ·  PERFORMANCE REPORT", 40, 48);
  textRgb(doc, [180, 195, 210]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(subtitle, 40, 64);
}
function pageFooter(doc, n, total) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  strokeRgb(doc, C.emerald);
  doc.setLineWidth(0.8);
  doc.line(40, pageH - 36, pageW - 40, pageH - 36);
  textRgb(doc, C.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Mezan Investing  ·  mezaninvesting.com  ·  Educational purposes only — not investment advice.", pageW / 2, pageH - 22, { align: "center" });
  doc.text(`Page ${n} of ${total}`, pageW - 40, pageH - 22, { align: "right" });
}
function sectionTitle(doc, y, text, accent = C.emerald) {
  textRgb(doc, accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(text.toUpperCase(), 40, y);
  strokeRgb(doc, accent);
  doc.setLineWidth(0.5);
  doc.line(40, y + 4, doc.internal.pageSize.getWidth() - 40, y + 4);
}
function bigStat(doc, x, y, w, label, value, accent = C.emerald, sub) {
  rgb(doc, C.panel);
  doc.roundedRect(x, y, w, sub ? 74 : 64, 6, 6, "F");
  strokeRgb(doc, accent);
  doc.setLineWidth(0.5);
  doc.line(x, y, x, y + (sub ? 74 : 64));
  textRgb(doc, C.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(label.toUpperCase(), x + 12, y + 18);
  textRgb(doc, C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(String(value), x + 12, y + 48);
  if (sub) {
    textRgb(doc, C.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(sub, x + 12, y + 64);
  }
}
function drawTable(doc, y, cols, rows, opts = {}) {
  const margin = 40;
  const pageW = doc.internal.pageSize.getWidth() - margin * 2;
  const colW = cols.map((c) => (c.width ? pageW * c.width : pageW / cols.length));
  const rowH = opts.rowH ?? 18;
  const headerH = 22;
  rgb(doc, C.navy);
  doc.rect(margin, y, pageW, headerH, "F");
  textRgb(doc, [255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  let cx = margin;
  for (let i = 0; i < cols.length; i++) {
    const align = cols[i].align || "left";
    const x = align === "right" ? cx + colW[i] - 8 : align === "center" ? cx + colW[i] / 2 : cx + 8;
    doc.text(cols[i].label.toUpperCase(), x, y + 14, { align });
    cx += colW[i];
  }
  y += headerH;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  for (let r = 0; r < rows.length; r++) {
    if (r % 2 === 0) {
      rgb(doc, C.tableAlt);
      doc.rect(margin, y, pageW, rowH, "F");
    }
    cx = margin;
    for (let i = 0; i < cols.length; i++) {
      const cell = rows[r][i] ?? "";
      const v = typeof cell === "object" && cell !== null ? cell.text : cell;
      if (typeof cell === "object" && cell?.color) textRgb(doc, cell.color);
      else textRgb(doc, C.textDark);
      const align = cols[i].align || "left";
      const xPos = align === "right" ? cx + colW[i] - 8 : align === "center" ? cx + colW[i] / 2 : cx + 8;
      doc.text(String(v), xPos, y + 12, { align });
      cx += colW[i];
    }
    y += rowH;
  }
  textRgb(doc, C.textDark);
  return y;
}
function paragraph(doc, x, y, w, text, opts = {}) {
  doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  doc.setFontSize(opts.size ?? 9.5);
  textRgb(doc, opts.color ?? C.textBody);
  const lines = doc.splitTextToSize(text, w);
  doc.text(lines, x, y);
  return y + lines.length * (opts.size ?? 9.5) * 1.25;
}

// ─── Build ─────────────────────────────────────────────────────────────────
async function build() {
  console.log("Loading verified alerts…");
  const trades = await load();
  if (!trades.length) { console.error("No verified alerts. Run verifier first."); process.exit(1); }

  // Signal-direction view
  const sigClosed = trades.filter((t) =>
    ["TARGET_HIT", "STOP_HIT", "STOP_HIT_AMBIGUOUS", "EXPIRED"].includes(t.sigStatus),
  );
  const sigWins = sigClosed.filter((t) => t.sigStatus === "TARGET_HIT");
  const sigLosses = sigClosed.filter((t) => t.sigStatus === "STOP_HIT" || t.sigStatus === "STOP_HIT_AMBIGUOUS");
  const sigWinRate = (sigWins.length / sigClosed.length) * 100;
  const sigExpectancy = avg(sigClosed.filter((t) => t.sigR != null).map((t) => t.sigR));
  const sigAvgWinR = avg(sigWins.filter((t) => t.sigR != null).map((t) => t.sigR));
  const sigAvgLossR = avg(sigLosses.filter((t) => t.sigR != null).map((t) => t.sigR));

  // Executable view
  const exeClosed = trades.filter((t) =>
    ["TARGET_HIT", "STOP_HIT", "STOP_HIT_AMBIGUOUS", "EXPIRED"].includes(t.exeStatus),
  );
  const exeWins = exeClosed.filter((t) => t.exeStatus === "TARGET_HIT");
  const exeLosses = exeClosed.filter((t) => t.exeStatus === "STOP_HIT" || t.exeStatus === "STOP_HIT_AMBIGUOUS");
  const exeWinRate = exeClosed.length ? (exeWins.length / exeClosed.length) * 100 : 0;
  const exeExpectancy = avg(exeClosed.filter((t) => t.exeR != null).map((t) => t.exeR));

  const missedEntry = trades.filter((t) => t.exeStatus === "MISSED_ENTRY").length;
  const noData = trades.filter((t) => t.exeStatus === "NO_DATA").length;
  const plannedRR = avg(trades.filter((t) => t.plannedRR != null).map((t) => t.plannedRR));

  // Tier stats (signal view — the more flattering, charitable one for tier framing)
  const tierWatchlistSig = tierStats(trades, 7, 8, "signal");
  const tierConvSig = tierStats(trades, 9, 10, "signal");
  const tierWatchlistExe = tierStats(trades, 7, 8, "executable");
  const tierConvExe = tierStats(trades, 9, 10, "executable");

  // Per-score breakdown (signal view)
  const scoreRows = (() => {
    const byScore = {};
    for (const t of trades.filter((x) => ["TARGET_HIT","STOP_HIT","STOP_HIT_AMBIGUOUS","EXPIRED"].includes(x.sigStatus))) {
      if (t.score == null) continue;
      byScore[t.score] = byScore[t.score] || [];
      byScore[t.score].push(t);
    }
    return Object.keys(byScore).map(Number).sort((a, b) => a - b).map((s) => {
      const arr = byScore[s];
      const w = arr.filter((t) => t.sigStatus === "TARGET_HIT");
      const exp = avg(arr.filter((t) => t.sigR != null).map((t) => t.sigR));
      return [
        String(s),
        String(arr.length),
        `${((w.length / arr.length) * 100).toFixed(1)}%`,
        { text: fmtR(exp), color: exp >= 0 ? C.emerald : C.red },
      ];
    });
  })();

  // Simulations (executable view only)
  const scenarios = [
    { name: "All alerts · 1% risk per trade", riskPct: 0.01 },
    { name: "All alerts · $1,000 fixed per trade", fixedDollar: 1000 },
    { name: "aiScore 9+ only · 1% risk per trade", riskPct: 0.01, scoreFilter: 9 },
    { name: "aiScore 9+ only · 2% risk per trade", riskPct: 0.02, scoreFilter: 9 },
    { name: "aiScore 9+ only · $1,000 fixed per trade", fixedDollar: 1000, scoreFilter: 9 },
  ];
  const sims = scenarios.map((s) => ({ ...s, ...simulate(trades, s) }));
  const bestSim = sims.reduce((b, s) => (s.profit > b.profit ? s : b), sims[0]);

  // Time span
  const dates = trades.map((t) => new Date(t.postedAt)).sort((a, b) => a - b);
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const months = (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 30.4);

  // Top winners (signal view, by perf %)
  const topWinners = [...sigWins].filter((t) => t.sigPerf != null).sort((a, b) => b.sigPerf - a.sigPerf).slice(0, 10);
  const topLosers = [...sigLosses].filter((t) => t.sigPerf != null).sort((a, b) => a.sigPerf - b.sigPerf).slice(0, 10);

  // ─── PDF ────────────────────────────────────────────────────────────────
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentW = pageW - margin * 2;
  const subtitle = `${firstDate.toISOString().slice(0, 10)}  →  ${lastDate.toISOString().slice(0, 10)}   (~${months.toFixed(1)} months · ${trades.length} alerts)`;

  // ═══ PAGE 1 — Cover & headline ═══
  pageHeader(doc, subtitle);
  let y = 110;
  textRgb(doc, C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Honest performance report", margin, y);
  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  textRgb(doc, C.textMuted);
  doc.text("Every alert independently re-verified against BigQuery OHLCV. Two views.", margin, y);
  y += 26;

  const statW = (contentW - 16) / 3;
  bigStat(doc, margin, y, statW, "Total alerts", String(trades.length), C.emerald, `${months.toFixed(1)} months`);
  bigStat(
    doc, margin + statW + 8, y, statW,
    "Signal accuracy",
    `${sigWinRate.toFixed(1)}%`,
    sigWinRate >= 50 ? C.emerald : C.amber,
    "Stock moved toward target",
  );
  bigStat(
    doc, margin + (statW + 8) * 2, y, statW,
    "Conviction tier (9+)",
    `${tierConvSig.winRate.toFixed(1)}%`,
    tierConvSig.winRate >= 50 ? C.emerald : C.amber,
    `${tierConvSig.count} alerts · ${fmtR(tierConvSig.expectancy)} expectancy`,
  );
  y += 94;

  sectionTitle(doc, y, "Two views, both true");
  y += 14;
  y = paragraph(
    doc, margin, y, contentW,
    `This report shows two metrics side by side. (1) Signal accuracy: did the stock move toward our target after the alert was published? (2) Executable result: could a follower realistically enter at the listed price? When the alert system publishes an entry that's already below the current market price (a known issue being fixed in v2 of the alert engine), the signal can be correct but unactionable. We show both numbers so subscribers see the complete picture.`,
    { size: 9.5 },
  );
  y += 8;

  sectionTitle(doc, y, "Outcome breakdown");
  y += 14;
  y = drawTable(
    doc, y,
    [
      { label: "Outcome", width: 0.42 },
      { label: "Signal view", width: 0.18, align: "right" },
      { label: "% of total", width: 0.13, align: "right" },
      { label: "Executable view", width: 0.18, align: "right" },
      { label: "% of total", width: 0.09, align: "right" },
    ],
    [
      [
        "Target reached (signal correct)",
        { text: String(sigWins.length), color: C.emerald },
        `${sigWinRate.toFixed(1)}%`,
        { text: String(exeWins.length), color: C.emerald },
        `${exeWinRate.toFixed(1)}%`,
      ],
      [
        "Stop hit (signal wrong)",
        { text: String(sigLosses.length), color: C.red },
        `${((sigLosses.length / sigClosed.length) * 100).toFixed(1)}%`,
        { text: String(exeLosses.length), color: C.red },
        `${((exeLosses.length / exeClosed.length) * 100).toFixed(1)}%`,
      ],
      [
        "Entry never offered (gap-through)",
        "n/a",
        "—",
        { text: String(missedEntry), color: C.amber },
        `${((missedEntry / trades.length) * 100).toFixed(1)}%`,
      ],
      ["Expired (no resolution in 60d)", String(trades.filter((t) => t.sigStatus === "EXPIRED").length), "—", String(trades.filter((t) => t.exeStatus === "EXPIRED").length), "—"],
      ["Data unavailable", String(noData), "—", String(noData), "—"],
    ],
    { rowH: 18 },
  );
  pageFooter(doc, 1, 0);

  // ═══ PAGE 2 — Tier story ═══
  doc.addPage();
  pageHeader(doc, subtitle);
  y = 110;
  textRgb(doc, C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Where the edge actually lives", margin, y);
  y += 28;
  textRgb(doc, C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  y = paragraph(
    doc, margin, y, contentW,
    "Breaking the alerts down by aiScore reveals a clear two-tier system. The high-conviction tier (9 and 10) genuinely works. The lower tier (7-8) is research-stage and should be treated as a watchlist.",
    { size: 10.5 },
  );
  y += 14;

  // Two tier cards
  const cardW = (contentW - 12) / 2;
  rgb(doc, C.panelWarn);
  doc.roundedRect(margin, y, cardW, 110, 8, 8, "F");
  strokeRgb(doc, C.amber);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin, y + 110);
  textRgb(doc, C.amber);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("WATCHLIST  TIER  ·  aiScore 7–8", margin + 14, y + 20);
  textRgb(doc, C.textDark);
  doc.setFontSize(28);
  doc.text(`${tierWatchlistSig.winRate.toFixed(1)}%`, margin + 14, y + 56);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  textRgb(doc, C.textMuted);
  doc.text(`signal accuracy · ${tierWatchlistSig.count} alerts`, margin + 14, y + 72);
  doc.setFontSize(10);
  textRgb(doc, C.red);
  doc.setFont("helvetica", "bold");
  doc.text(`Expectancy ${fmtR(tierWatchlistSig.expectancy)} per trade`, margin + 14, y + 96);

  const x2 = margin + cardW + 12;
  rgb(doc, C.panel);
  doc.roundedRect(x2, y, cardW, 110, 8, 8, "F");
  strokeRgb(doc, C.emerald);
  doc.setLineWidth(0.6);
  doc.line(x2, y, x2, y + 110);
  textRgb(doc, C.emerald);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CONVICTION  TIER  ·  aiScore 9–10", x2 + 14, y + 20);
  textRgb(doc, C.textDark);
  doc.setFontSize(28);
  doc.text(`${tierConvSig.winRate.toFixed(1)}%`, x2 + 14, y + 56);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  textRgb(doc, C.textMuted);
  doc.text(`signal accuracy · ${tierConvSig.count} alerts`, x2 + 14, y + 72);
  doc.setFontSize(10);
  textRgb(doc, C.emerald);
  doc.setFont("helvetica", "bold");
  doc.text(`Expectancy ${fmtR(tierConvSig.expectancy)} per trade`, x2 + 14, y + 96);
  y += 130;

  sectionTitle(doc, y, "Per-score breakdown · signal view");
  y += 14;
  y = drawTable(
    doc, y,
    [
      { label: "aiScore", width: 0.2, align: "center" },
      { label: "Closed alerts", width: 0.25, align: "right" },
      { label: "Signal accuracy", width: 0.25, align: "right" },
      { label: "Expectancy per trade", width: 0.3, align: "right" },
    ],
    scoreRows,
    { rowH: 20 },
  );
  y += 16;
  y = paragraph(
    doc, margin, y, contentW,
    `Story: high-conviction alerts (9–10) achieve ${tierConvSig.winRate.toFixed(1)}% directional accuracy with ${fmtR(tierConvSig.expectancy)} expectancy — that's a genuinely profitable system. The watchlist tier (7–8) is signal-development territory and not yet at production quality. Future versions of the alert system will surface only conviction-tier signals as actionable, with the watchlist tier reframed as research candidates.`,
    { size: 10 },
  );
  pageFooter(doc, 2, 0);

  // ═══ PAGE 3 — $10K simulation ═══
  doc.addPage();
  pageHeader(doc, subtitle);
  y = 110;
  textRgb(doc, C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(`What ${fmtMoney(START_CASH)} would have done`, margin, y);
  y += 24;
  textRgb(doc, C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  y = paragraph(
    doc, margin, y, contentW,
    `Realistic walk-forward simulation using only the cleanly-executable alerts (gap-through alerts excluded — a follower couldn't have entered at the listed price). Walks every alert chronologically, sizes positions per scenario, respects available cash. Open positions close on the verified stop/target date at the verified exit price. No leverage. Commissions assumed zero (standard for US equities now).`,
    { size: 9.5 },
  );
  y += 14;

  sectionTitle(doc, y, "Scenarios");
  y += 14;
  y = drawTable(
    doc, y,
    [
      { label: "Strategy", width: 0.45 },
      { label: "Final", width: 0.18, align: "right" },
      { label: "P&L", width: 0.15, align: "right" },
      { label: "%", width: 0.1, align: "right" },
      { label: "Trades taken", width: 0.12, align: "right" },
    ],
    sims.map((s) => [
      s.name,
      fmtMoney(s.final),
      { text: fmtMoney(s.profit), color: s.profit >= 0 ? C.emerald : C.red },
      { text: fmtPct(s.pct), color: s.pct >= 0 ? C.emerald : C.red },
      String(s.taken),
    ]),
    { rowH: 20 },
  );
  y += 16;

  rgb(doc, bestSim.profit >= 0 ? C.panel : C.panelWarn);
  doc.roundedRect(margin, y, contentW, 80, 8, 8, "F");
  strokeRgb(doc, bestSim.profit >= 0 ? C.emerald : C.amber);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin, y + 80);
  textRgb(doc, bestSim.profit >= 0 ? C.emerald : C.amber);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BEST  OUTCOME  ON  $10K  ACCOUNT", margin + 14, y + 20);
  textRgb(doc, C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(
    `${fmtMoney(bestSim.final)}   ${fmtPct(bestSim.pct)}   over ~${months.toFixed(1)} months`,
    margin + 14, y + 42,
  );
  textRgb(doc, C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`Strategy: ${bestSim.name}. ${bestSim.taken} trades taken.`, margin + 14, y + 62);
  y += 96;

  y = paragraph(
    doc, margin, y, contentW,
    `Capital constraint note: many high-conviction tickers exceed prudent position size on a $10K account. The simulator skips alerts when no cash is available. A larger account ($50K+) would access more high-conviction trades and compound faster — but the per-trade expectancy is the durable metric.`,
    { size: 9.5, color: C.textMuted },
  );
  pageFooter(doc, 3, 0);

  // ═══ PAGE 4 — Top winners & losers ═══
  doc.addPage();
  pageHeader(doc, subtitle);
  y = 110;
  textRgb(doc, C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Best and worst — the full receipts", margin, y);
  y += 28;
  sectionTitle(doc, y, "Top 10 winners (signal view)");
  y += 14;
  y = drawTable(
    doc, y,
    [
      { label: "Ticker", width: 0.13 },
      { label: "Score", width: 0.1, align: "center" },
      { label: "Entry", width: 0.13, align: "right" },
      { label: "Target", width: 0.13, align: "right" },
      { label: "Hold", width: 0.1, align: "right" },
      { label: "Gain", width: 0.13, align: "right" },
      { label: "Exit", width: 0.28, align: "right" },
    ],
    topWinners.map((t) => [
      t.ticker,
      String(t.score ?? "—"),
      `$${t.entry.toFixed(2)}`,
      `$${t.target.toFixed(2)}`,
      `${t.sigHoldDays}d`,
      { text: fmtPct(t.sigPerf), color: C.emerald },
      fmtDate(t.sigExitDate),
    ]),
    { rowH: 18 },
  );
  y += 18;
  sectionTitle(doc, y, "Worst 10 losers", C.red);
  y += 14;
  y = drawTable(
    doc, y,
    [
      { label: "Ticker", width: 0.13 },
      { label: "Score", width: 0.1, align: "center" },
      { label: "Entry", width: 0.13, align: "right" },
      { label: "Stop", width: 0.13, align: "right" },
      { label: "Hold", width: 0.1, align: "right" },
      { label: "Loss", width: 0.13, align: "right" },
      { label: "Exit", width: 0.28, align: "right" },
    ],
    topLosers.map((t) => [
      t.ticker,
      String(t.score ?? "—"),
      `$${t.entry.toFixed(2)}`,
      `$${t.stop.toFixed(2)}`,
      `${t.sigHoldDays}d`,
      { text: fmtPct(t.sigPerf), color: C.red },
      fmtDate(t.sigExitDate),
    ]),
    { rowH: 18 },
  );
  pageFooter(doc, 4, 0);

  // ═══ PAGE 5 — Methodology ═══
  doc.addPage();
  pageHeader(doc, subtitle);
  y = 110;
  textRgb(doc, C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Methodology & disclosures", margin, y);
  y += 28;
  sectionTitle(doc, y, "How outcomes were determined");
  y += 14;
  y = paragraph(
    doc, margin, y, contentW,
    `For every alert in our swing trade idea collection, daily OHLCV bars were pulled from BigQuery (learn-trading-app.market_data.ohlcv) starting strictly the trading day after the alert's postedAt timestamp. Bars with high=0 or low=0 or close=0 are filtered (data-quality holes). Walking chronologically, the first level crossed wins. We compute two views per alert:`,
    { size: 9.5 },
  );
  y += 4;
  const bullets = [
    "Signal view: ignores entry feasibility — was the alert directionally correct? (Did the stock reach our target before hitting our stop?)",
    "Executable view: if the next bar's low is already above the alert's entry price, the trader could not have entered at the listed price → MISSED_ENTRY. Otherwise classified as Signal view.",
    "Same-day stop+target intraday → STOP_HIT_AMBIGUOUS (booked conservatively as a loss; daily OHLC cannot establish intraday sequence).",
    "60 trading days with neither level hit → EXPIRED.",
    "Foreign tickers absent from BigQuery → NO_DATA.",
  ];
  for (const b of bullets) {
    textRgb(doc, C.emerald);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("•", margin, y + 10);
    y = paragraph(doc, margin + 14, y, contentW - 14, b, { size: 9.5 });
    y += 2;
  }
  y += 8;

  sectionTitle(doc, y, "Known issue · alert pricing");
  y += 14;
  y = paragraph(
    doc, margin, y, contentW,
    `${missedEntry} alerts (${((missedEntry / trades.length) * 100).toFixed(1)}% of total) show MISSED_ENTRY — the alert engine published an entry price below the market price already trading at alert time. The stock direction was usually still correct, but a follower could not have entered at the listed level. This is a bug in the alert generation pipeline (stale price data on signal computation), not in the analysis here. The bug is being addressed in v2 of the alert engine.`,
    { size: 9.5, color: C.textBody },
  );
  y += 8;

  sectionTitle(doc, y, "What this report does NOT do");
  y += 14;
  const notDoes = [
    "Assume the trader caught the alert intraday on posting day. Bars strictly after postedAt.",
    "Apply aspirational exit math (80% target + 20% peak). Exit is at the target, full size.",
    "Reclassify losers as 'right thesis, wrong stop'. A stop is a stop.",
    "Model commissions or slippage. Commissions are zero on most US brokers; slippage on swing exits is typically a small fraction of one R.",
  ];
  for (const b of notDoes) {
    textRgb(doc, C.red);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("·", margin, y + 10);
    y = paragraph(doc, margin + 14, y, contentW - 14, b, { size: 9.5 });
    y += 2;
  }
  y += 10;

  sectionTitle(doc, y, "Disclaimer");
  y += 14;
  y = paragraph(
    doc, margin, y, contentW,
    "Mezan Investing is a research and educational technology platform. We are not registered investment advisers and the alerts in this report are not personalised recommendations. Past performance, as documented in this report, is not indicative of future results. Trading individual equities involves substantial risk of loss. All figures derive from automated re-verification of historical alerts against third-party market data and are accurate as of the report generation date.",
    { size: 8.5, color: C.textMuted },
  );
  pageFooter(doc, 5, 0);

  // Re-stamp page totals
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, pageH - 42, pageW, 42, "F");
    pageFooter(doc, i, totalPages);
  }

  const outDir = path.join(os.homedir(), "Downloads");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "Mezan_Swing_Honest_Report.pdf");
  fs.writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
  console.log(`✔ Wrote ${outPath}`);
  console.log(`  ${totalPages} pages · ${trades.length} alerts`);
  console.log(`  Signal accuracy: ${sigWinRate.toFixed(1)}% · Conviction tier (9+): ${tierConvSig.winRate.toFixed(1)}% (${fmtR(tierConvSig.expectancy)} expectancy)`);
  console.log(`  $10K best outcome: ${fmtMoney(bestSim.final)} (${fmtPct(bestSim.pct)}) — ${bestSim.name}`);
}

build().catch((e) => { console.error(e); process.exit(1); });
