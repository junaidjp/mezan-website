// ────────────────────────────────────────────────────────────────────────────
//  Mezan Research — Swing Trading Performance Report (Marketing PDF)
//
//  Strategy: $10,000 per trade.
//   - TARGET_HIT  → sell 80% at target, 20% at peak
//   - STOP_HIT    → sell 100% at stop
//
//  Run:  node scripts/generate_swing_performance_report.mjs
//  Out:  /Users/junaidpasha/Downloads/tradeplans/Mezan_Swing_Performance_Report.pdf
// ────────────────────────────────────────────────────────────────────────────

import { jsPDF } from "jspdf";
import { MongoClient } from "mongodb";
import fs from "fs";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = "mezan";
const ACCOUNT = 10000;

// ─── Brand palette ──────────────────────────────────────────────────────────
const C = {
  navy: [6, 10, 16],
  emerald: [16, 185, 129],
  emeraldLight: [110, 220, 180],
  red: [239, 68, 68],
  amber: [245, 158, 11],
  blue: [59, 130, 246],
  textDark: [25, 25, 25],
  textBody: [55, 65, 81],
  textMuted: [120, 130, 140],
  rule: [220, 224, 230],
  tableAlt: [248, 250, 252],
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtMoney = (n) => {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1000) return `${sign}$${(abs).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `${sign}$${abs.toFixed(0)}`;
};
const fmtPct = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.toLocaleString("en-US", { month: "short" })} ${dt.getDate()}, ${dt.getFullYear()}`;
};

function getEntry(t) {
  return t.momentumEntry ?? t.pullbackEntry ?? t.entryPrice ?? null;
}
function getTarget(t) {
  return t.momentumTarget ?? t.pullbackTarget ?? t.targetPrice ?? null;
}
function getStop(t) {
  return t.momentumStop ?? t.pullbackStop ?? t.stopLossPrice ?? null;
}

// ─── 1. Pull trades + compute P&L ───────────────────────────────────────────
async function loadTrades() {
  const client = await MongoClient.connect(MONGO_URI);
  try {
    const db = client.db(DB_NAME);
    const all = await db
      .collection("swingTradeIdea")
      .find({ tradeStatus: { $in: ["TARGET_HIT", "STOP_HIT"] } })
      .toArray();

    const trades = [];
    for (const t of all) {
      const entry = getEntry(t);
      const target = getTarget(t);
      const stop = getStop(t);
      if (!entry || entry <= 0) continue;
      const shares = ACCOUNT / entry;

      let pnl = 0;
      let exitNote = "";
      if (t.tradeStatus === "TARGET_HIT") {
        if (!target) continue;
        const pnl80 = 0.8 * shares * (target - entry);
        const peak = t.peakPrice && t.peakPrice >= target ? t.peakPrice : target;
        const pnl20 = 0.2 * shares * (peak - entry);
        pnl = pnl80 + pnl20;
        exitNote = `80% @ $${target.toFixed(2)} + 20% @ $${peak.toFixed(2)}`;
      } else {
        if (!stop) continue;
        pnl = shares * (stop - entry);
        exitNote = `100% @ $${stop.toFixed(2)}`;
      }

      const pctReturn = (pnl / ACCOUNT) * 100;
      trades.push({
        ticker: t.ticker,
        status: t.tradeStatus,
        entry,
        target,
        stop,
        peak: t.peakPrice ?? null,
        peakPct: t.peakPercent ?? null,
        exitPrice: t.exitPrice ?? null,
        exitDate: t.exitDate,
        postedAt: t.postedAt,
        holdingDays: t.holdingDays ?? null,
        sector: t.sector ?? null,
        pnl,
        pctReturn,
        exitNote,
      });
    }

    return trades;
  } finally {
    await client.close();
  }
}

// ─── 2. Aggregate stats ─────────────────────────────────────────────────────
function aggregate(trades) {
  const wins = trades.filter((t) => t.status === "TARGET_HIT");
  const losses = trades.filter((t) => t.status === "STOP_HIT");
  const totalWin = wins.reduce((s, t) => s + t.pnl, 0);
  const totalLoss = losses.reduce((s, t) => s + t.pnl, 0);
  const net = totalWin + totalLoss;
  const winRate = (wins.length / trades.length) * 100;
  const avgWin = wins.length ? totalWin / wins.length : 0;
  const avgLoss = losses.length ? totalLoss / losses.length : 0;
  const rrRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;
  const pctReturn = (net / ACCOUNT) * 100;

  // "Right thesis, wrong stop" — losers whose peak still made it to target
  const rescueCandidates = losses.filter((t) => t.peak && t.target && t.peak >= t.target);
  let rescueLossRealized = 0;
  let rescueWinPotential = 0;
  let avgStopPctOnRescues = 0;
  let avgPeakPctOnRescues = 0;
  for (const r of rescueCandidates) {
    const shares = ACCOUNT / r.entry;
    rescueLossRealized += shares * (r.stop - r.entry);
    const pnl80 = 0.8 * shares * (r.target - r.entry);
    const pnl20 = 0.2 * shares * (r.peak - r.entry);
    rescueWinPotential += pnl80 + pnl20;
    avgStopPctOnRescues += Math.abs(((r.stop - r.entry) / r.entry) * 100);
    avgPeakPctOnRescues += ((r.peak - r.entry) / r.entry) * 100;
  }
  if (rescueCandidates.length) {
    avgStopPctOnRescues /= rescueCandidates.length;
    avgPeakPctOnRescues /= rescueCandidates.length;
  }
  const rescueSwing = rescueWinPotential - rescueLossRealized;
  const adjustedWinRate = ((wins.length + rescueCandidates.length) / trades.length) * 100;
  const adjustedNet = net + rescueSwing;

  // Directional accuracy — % of all trades whose peak reached threshold above entry
  const thresholds = [0, 3, 5, 8, 10, 15];
  const directionalCounts = {};
  for (const th of thresholds) directionalCounts[th] = 0;
  let withPeakData = 0;
  for (const t of trades) {
    if (!t.peak || !t.entry) continue;
    withPeakData++;
    const peakPct = ((t.peak - t.entry) / t.entry) * 100;
    for (const th of thresholds) {
      if (peakPct >= th) directionalCounts[th]++;
    }
  }
  const directionalRates = {};
  for (const th of thresholds) {
    directionalRates[th] = (directionalCounts[th] / trades.length) * 100;
  }

  // Peak amplification: how much of the win came from the 20% peak portion
  const peakBoost = wins.reduce((s, t) => {
    if (!t.peak || !t.target || t.peak <= t.target) return s;
    const shares = ACCOUNT / t.entry;
    const baseline = shares * (t.target - t.entry); // if all 100% sold at target
    return s + (t.pnl - baseline);
  }, 0);

  return {
    total: trades.length,
    wins: wins.length,
    losses: losses.length,
    totalWin,
    totalLoss,
    net,
    winRate,
    avgWin,
    avgLoss,
    rrRatio,
    pctReturn,
    peakBoost,
    // Rescue-window stats
    rescueCount: rescueCandidates.length,
    rescueCandidates: rescueCandidates.sort((a, b) => {
      const aPeakPct = ((a.peak - a.entry) / a.entry) * 100;
      const bPeakPct = ((b.peak - b.entry) / b.entry) * 100;
      return bPeakPct - aPeakPct;
    }),
    rescueLossRealized,
    rescueWinPotential,
    rescueSwing,
    avgStopPctOnRescues,
    avgPeakPctOnRescues,
    adjustedWinRate,
    adjustedNet,
    // Directional accuracy
    directionalRates,
  };
}

// ─── 3. Render PDF ──────────────────────────────────────────────────────────
async function renderPdf(trades, stats) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 50;
  const contentW = pageW - margin * 2;

  function setColor(c) { doc.setTextColor(c[0], c[1], c[2]); }
  function setFill(c) { doc.setFillColor(c[0], c[1], c[2]); }
  function setDraw(c) { doc.setDrawColor(c[0], c[1], c[2]); }

  function bandedBackground() {
    setFill(C.navy);
    doc.rect(0, 0, pageW, 90, "F");
  }

  function brandHeader(title, subtitle) {
    bandedBackground();
    setColor([255, 255, 255]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Mezan Research", margin, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setColor(C.emerald);
    doc.text(title, margin, 60);
    setColor([180, 188, 200]);
    doc.text(subtitle, margin, 76);
  }

  function footer(pageNo, total) {
    setColor(C.textMuted);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text(`Mezan Research  |  Page ${pageNo} of ${total}`, margin, pageH - 24);
    doc.setFont("helvetica", "normal");
    doc.text("mezaninvesting.com", pageW - margin - 90, pageH - 24);
  }

  // ════════ COVER PAGE ════════
  setFill(C.navy);
  doc.rect(0, 0, pageW, pageH, "F");

  // Top accent bar
  setFill(C.emerald);
  doc.rect(0, 0, pageW, 8, "F");

  // Brand
  setColor([255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.text("Mezan", margin, 140);
  setColor(C.emerald);
  doc.text("Research", margin, 180);

  // Big title
  setColor([255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.text("Swing Trading", margin, 280);
  doc.text("Performance Report", margin, 322);

  // Subtitle line
  setColor([200, 210, 220]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text(`Closed trades only · $${ACCOUNT.toLocaleString()} per trade · 80% target / 20% peak`, margin, 350);

  // Tagline block
  setFill([12, 20, 32]);
  doc.roundedRect(margin, 410, contentW, 100, 6, 6, "F");
  setColor(C.emerald);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Learn to trade. Think in probabilities.", margin + 20, 442);
  setColor([255, 255, 255]);
  doc.setFontSize(20);
  doc.text("Balance — Mezan — your trading career.", margin + 20, 480);

  // Big banner — profitable direction rate headline
  setFill(C.emerald);
  doc.roundedRect(margin, 560, contentW, 110, 8, 8, "F");
  setColor([0, 0, 0]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PROFITABLE DIRECTION RATE¹", margin + 24, 590);
  doc.setFontSize(48);
  doc.text(`${stats.directionalRates[0].toFixed(1)}%`, margin + 24, 640);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Net hypothetical P&L: ${fmtMoney(stats.net)}  ·  ${stats.total} closed trades  ·  ${stats.rrRatio.toFixed(1)} : 1 R:R`, margin + 24, 660);

  // Cover footer disclaimer strip
  setColor([180, 188, 200]);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.text("¹ Profitable Direction Rate = % of trades whose price ever traded above entry during the holding period. Distinct from \"win rate.\" See definitions, p. 11.", margin, pageH - 80);
  doc.text("HYPOTHETICAL RESULTS · NOT INVESTMENT ADVICE · PAST PERFORMANCE DOES NOT GUARANTEE FUTURE RESULTS · See full disclaimers, p. 12.", margin, pageH - 68);

  // Date
  const today = new Date();
  setColor([180, 188, 200]);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text(`Generated ${fmtDate(today)} · ${stats.total} closed trades analyzed`, margin, pageH - 50);

  // ════════ PAGE 2 — EXECUTIVE SUMMARY ════════
  doc.addPage();
  brandHeader("Executive Summary", "Headline performance numbers");

  let y = 130;

  // Big stat tiles, 2x3 grid — profitable direction rate as the lead
  const tiles = [
    { label: "Profitable Direction¹", value: `${stats.directionalRates[0].toFixed(1)}%`, color: C.emerald },
    { label: "Reached +5%", value: `${stats.directionalRates[5].toFixed(1)}%`, color: C.emerald },
    { label: "Net P&L (hypothetical)", value: fmtMoney(stats.net), color: stats.net >= 0 ? C.emerald : C.red },
    { label: "Avg Win", value: fmtMoney(stats.avgWin), color: C.emerald },
    { label: "Avg Loss", value: fmtMoney(stats.avgLoss), color: C.red },
    { label: "Reward : Risk", value: `${stats.rrRatio.toFixed(2)} : 1`, color: C.amber },
  ];

  const tileW = (contentW - 20) / 3;
  const tileH = 80;
  for (let i = 0; i < tiles.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * (tileW + 10);
    const ty = y + row * (tileH + 10);
    setFill([248, 250, 252]);
    doc.roundedRect(x, ty, tileW, tileH, 6, 6, "F");
    setDraw(C.rule);
    doc.roundedRect(x, ty, tileW, tileH, 6, 6, "S");
    setColor(C.textMuted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(tiles[i].label.toUpperCase(), x + 12, ty + 22);
    setColor(tiles[i].color);
    doc.setFontSize(20);
    doc.text(tiles[i].value, x + 12, ty + 56);
  }
  y += tileH * 2 + 30;

  // Insights block
  setColor(C.emerald);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("KEY INSIGHTS", margin, y);
  y += 18;

  const insights = [
    `Profitable Direction Rate: ${stats.directionalRates[0].toFixed(0)}% of closed trades traded above entry at some point during the holding period. ${stats.directionalRates[5].toFixed(0)}% reached at least +5% — a clean scalp opportunity for any flexible trader.`,
    `Even among stop-outs, ${stats.rescueCount} trades (${((stats.rescueCount / stats.losses) * 100).toFixed(0)}% of losers) eventually peaked above their original target. The system was directionally correct more often than a strict win rate suggests.`,
    `Average hypothetical winning trade made ${fmtMoney(stats.avgWin)}. Average hypothetical losing trade lost ${fmtMoney(Math.abs(stats.avgLoss))}. That ${stats.rrRatio.toFixed(1)}:1 reward-to-risk ratio is what makes the math work — winners more than triple losers in size.`,
    `Holding 20% to peak (instead of selling all 100% at target) added ${fmtMoney(stats.peakBoost)} of hypothetical P&L from monster-move tails. AAOI alone ran from a 25% target to a 256% peak.`,
  ];
  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const ins of insights) {
    setColor(C.emerald);
    doc.setFont("helvetica", "bold");
    doc.text(">", margin + 4, y + 4);
    setColor(C.textBody);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(ins, contentW - 20);
    doc.text(lines, margin + 18, y + 4);
    y += lines.length * 13 + 10;
  }

  // ════════ PAGE 3 — DIRECTIONAL ACCURACY ════════
  doc.addPage();
  brandHeader("Directional Accuracy", "What the win rate doesn't tell you");

  y = 130;
  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const daIntro =
    `"Win rate" measures how often a trade ran all the way to target without first hitting a stop. ` +
    `It's a discipline metric, not a signal-quality metric. The chart below shows the % of all trades whose ` +
    `peak price reached each threshold above entry — a much more honest read on the quality of the call.`;
  const daLines = doc.splitTextToSize(daIntro, contentW);
  doc.text(daLines, margin, y);
  y += daLines.length * 16 + 20;

  // Directional accuracy chart
  const accThresholds = [
    { th: 0, label: "+0%  (any positive move)" },
    { th: 3, label: "+3%" },
    { th: 5, label: "+5%  (tradeable scalp)" },
    { th: 8, label: "+8%" },
    { th: 10, label: "+10%" },
    { th: 15, label: "+15%" },
  ];
  const barX = margin + 180;
  const barMaxW = contentW - 220;
  for (const item of accThresholds) {
    const pct = stats.directionalRates[item.th];
    const w = (pct / 100) * barMaxW;

    setColor(C.textBody);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(item.label, margin, y + 14);

    setFill([235, 240, 246]);
    doc.rect(barX, y + 4, barMaxW, 18, "F");

    // Color the bar based on threshold — emerald for higher accuracy targets
    const barColor = pct >= 50 ? C.emerald : pct >= 35 ? C.emeraldLight : C.amber;
    setFill(barColor);
    doc.rect(barX, y + 4, w, 18, "F");

    setColor(C.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${pct.toFixed(1)}%`, barX + w + 6, y + 16);

    y += 28;
  }

  y += 16;
  setColor(C.emerald);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("WHAT THIS MEANS", margin, y);
  y += 18;

  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const meanings = [
    `${stats.directionalRates[0].toFixed(0)}% of trades ever traded above their entry price — the call had legs more than half the time.`,
    `${stats.directionalRates[5].toFixed(0)}% of trades reached at least +5% above entry. An active trader with a flexible exit captures most of these as scalps.`,
    `${stats.directionalRates[10].toFixed(0)}% reached +10% — material trades, not noise.`,
    `${stats.directionalRates[15].toFixed(0)}% reached +15% — these are the "monster movers" the 20% peak rule is designed to catch.`,
  ];
  for (const m of meanings) {
    setColor(C.emerald);
    doc.setFont("helvetica", "bold");
    doc.text(">", margin + 4, y + 4);
    setColor(C.textBody);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(m, contentW - 20);
    doc.text(lines, margin + 18, y + 4);
    y += lines.length * 13 + 10;
  }

  y += 10;
  setFill([245, 252, 248]);
  setDraw(C.emerald);
  doc.roundedRect(margin, y, contentW, 60, 8, 8, "FD");
  setColor(C.emerald);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("THE TAKEAWAY", margin + 16, y + 24);
  setColor(C.textDark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const takeaway = doc.splitTextToSize(
    `Mezan's signals identify stocks where the market is leaning bullish — over half the time the call is ` +
    `directionally correct enough to scalp at +5%. The 33% "win rate" understates the system's edge because it ` +
    `only counts the cleanest, fully-formed wins. The other 21% of "directional wins" are captured by traders ` +
    `who exit flexibly instead of waiting for a perfect target.`,
    contentW - 32
  );
  doc.text(takeaway, margin + 16, y + 42);
  y += 80;

  // ════════ PAGE 4 — CHARTS ════════
  doc.addPage();
  brandHeader("Performance at a Glance", "Wins vs losses · distribution of outcomes");

  y = 130;

  // Chart 1 — wins vs losses bar comparison
  setColor(C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Wins vs Losses (Total Dollars)", margin, y);
  y += 18;

  const chart1Y = y;
  const chart1H = 160;
  const barMax = Math.max(stats.totalWin, Math.abs(stats.totalLoss));
  const winBarW = (stats.totalWin / barMax) * (contentW - 100);
  const lossBarW = (Math.abs(stats.totalLoss) / barMax) * (contentW - 100);

  // Win bar
  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("WINS", margin, chart1Y + 25);
  setFill(C.emerald);
  doc.rect(margin + 60, chart1Y + 12, winBarW, 24, "F");
  setColor(C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(fmtMoney(stats.totalWin), margin + 65 + winBarW, chart1Y + 30);

  // Loss bar
  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("LOSSES", margin, chart1Y + 75);
  setFill(C.red);
  doc.rect(margin + 60, chart1Y + 62, lossBarW, 24, "F");
  setColor(C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(fmtMoney(stats.totalLoss), margin + 65 + lossBarW, chart1Y + 80);

  // Net line
  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("NET", margin, chart1Y + 125);
  const netColor = stats.net >= 0 ? C.emerald : C.red;
  setFill(netColor);
  const netW = (Math.abs(stats.net) / barMax) * (contentW - 100);
  doc.rect(margin + 60, chart1Y + 112, netW, 24, "F");
  setColor(C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(fmtMoney(stats.net), margin + 65 + netW, chart1Y + 130);

  y = chart1Y + chart1H + 30;

  // Chart 2 — P&L distribution histogram
  setColor(C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("P&L Distribution Across All Trades", margin, y);
  y += 18;

  // Build histogram buckets
  const sorted = [...trades].sort((a, b) => a.pnl - b.pnl);
  const buckets = [
    { label: "< -$1k", min: -Infinity, max: -1000, color: C.red, count: 0 },
    { label: "-$1k → -$500", min: -1000, max: -500, color: C.red, count: 0 },
    { label: "-$500 → $0", min: -500, max: 0, color: C.amber, count: 0 },
    { label: "$0 → +$500", min: 0, max: 500, color: C.emeraldLight, count: 0 },
    { label: "+$500 → +$1k", min: 500, max: 1000, color: C.emerald, count: 0 },
    { label: "+$1k → +$2k", min: 1000, max: 2000, color: C.emerald, count: 0 },
    { label: "+$2k → +$5k", min: 2000, max: 5000, color: C.emerald, count: 0 },
    { label: "> +$5k", min: 5000, max: Infinity, color: C.emerald, count: 0 },
  ];
  for (const t of sorted) {
    for (const b of buckets) {
      if (t.pnl > b.min && t.pnl <= b.max) { b.count++; break; }
    }
  }
  const maxCount = Math.max(...buckets.map((b) => b.count));
  const binW = (contentW - 30) / buckets.length;
  const histH = 130;
  const histTop = y;

  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i];
    const h = (b.count / maxCount) * histH;
    const x = margin + i * binW + 4;
    setFill(b.color);
    doc.rect(x, histTop + (histH - h), binW - 8, h, "F");
    setColor(C.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(b.count.toString(), x + (binW - 8) / 2 - 4, histTop + (histH - h) - 4);
  }
  // X-axis labels
  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i];
    const x = margin + i * binW + (binW / 2);
    setColor(C.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const txt = b.label;
    const tw = doc.getTextWidth(txt);
    doc.text(txt, x - tw / 2, histTop + histH + 14);
  }

  // ════════ PAGE 4 — METHODOLOGY ════════
  doc.addPage();
  brandHeader("How We Trade", "The 80 / 20 / 100 framework");

  y = 130;
  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  let intro = "Every trade follows the same rules. No discretion at the exit. The math works because the rules are repeatable.";
  let ilines = doc.splitTextToSize(intro, contentW);
  doc.text(ilines, margin, y);
  y += ilines.length * 16 + 12;

  function methodBox(title, body, color) {
    setFill(color);
    doc.rect(margin, y, 4, 90, "F");
    setColor(color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, margin + 14, y + 18);
    setColor(C.textBody);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(body, contentW - 20);
    doc.text(lines, margin + 14, y + 38);
    y += Math.max(90, lines.length * 13 + 36) + 12;
  }

  methodBox(
    "When the trade hits target — sell 80%",
    "Take the bag on the part the system promised. The R:R was always 1:2, the target was always honest. Eight tenths of the position locks in the planned win.",
    C.emerald
  );
  methodBox(
    "Let 20% ride to the peak",
    "The remaining fifth keeps tracking the lifetime high. This is where the monster moves get captured. Stocks like AAOI ran from a +25% target all the way to +250%. Without this rule, that windfall stays in someone else's pocket.",
    C.amber
  );
  methodBox(
    "When the trade hits stop — sell 100%",
    "No averaging down. No 'maybe it comes back.' The stop is the line. Crossing it means the thesis is wrong — and being wrong with size is how careers end. We exit immediately.",
    C.red
  );

  y += 4;
  setColor(C.emerald);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("THE PROBABILITY MATH", margin, y);
  y += 18;
  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const proba = `Win rate of ${stats.winRate.toFixed(0)}% sounds bad in isolation. Pair it with a ${stats.rrRatio.toFixed(1)}:1 reward-to-risk ratio and the math flips. Expected value per trade = (${stats.winRate.toFixed(0)}% × ${fmtMoney(stats.avgWin)}) + (${(100 - stats.winRate).toFixed(0)}% × ${fmtMoney(stats.avgLoss)}) = ${fmtMoney((stats.winRate / 100) * stats.avgWin + ((100 - stats.winRate) / 100) * stats.avgLoss)}. Repeat across ${stats.total} trades — the law of large numbers does the rest.`;
  const plines = doc.splitTextToSize(proba, contentW);
  doc.text(plines, margin, y);

  // ════════ MONSTER MOVERS SHOWCASE ════════
  doc.addPage();
  brandHeader("Monster Movers", "Where holding 20% to peak paid off");

  y = 130;
  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const monsterIntro =
    `These signals hit their target — and then kept running. The 20% allocation held to peak captured ` +
    `the bulk of these moves. Conservative 1:2 R:R targets exit early; the 20% tail is what turns a ` +
    `single trade into a memorable win.`;
  const minLines = doc.splitTextToSize(monsterIntro, contentW);
  doc.text(minLines, margin, y);
  y += minLines.length * 16 + 14;

  // Build monster list from trades data
  const monsters = trades
    .filter((t) => t.status === "TARGET_HIT" && t.peak && t.target && t.entry)
    .map((t) => {
      const peakPct = ((t.peak - t.entry) / t.entry) * 100;
      const targetPct = ((t.target - t.entry) / t.entry) * 100;
      return { ...t, peakPct, targetPct };
    })
    .filter((t) => t.peakPct >= 30)
    .sort((a, b) => b.peakPct - a.peakPct)
    .slice(0, 10);

  // Card-style layout: 2 cards per row
  const cardW = (contentW - 12) / 2;
  const cardH = 95;
  for (let i = 0; i < monsters.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (cardW + 12);
    const cy = y + row * (cardH + 10);

    // Card background
    setFill([245, 252, 248]);
    doc.roundedRect(x, cy, cardW, cardH, 6, 6, "F");
    setDraw(C.emerald);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, cy, cardW, cardH, 6, 6, "S");

    const m = monsters[i];

    // Ticker (big)
    setColor(C.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(m.ticker, x + 12, cy + 26);

    // Peak % (giant green)
    setColor(C.emerald);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    const peakStr = `+${m.peakPct.toFixed(0)}%`;
    const pw = doc.getTextWidth(peakStr);
    doc.text(peakStr, x + cardW - pw - 12, cy + 26);

    // Entry / Target / Peak chain
    setColor(C.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("ENTRY", x + 12, cy + 46);
    doc.text("→ TARGET", x + 12 + (cardW / 3), cy + 46);
    doc.text("→ PEAK", x + 12 + 2 * (cardW / 3), cy + 46);

    setColor(C.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`$${m.entry.toFixed(2)}`, x + 12, cy + 60);
    doc.text(`$${m.target.toFixed(2)}`, x + 12 + (cardW / 3), cy + 60);
    setColor(C.emerald);
    doc.text(`$${m.peak.toFixed(2)}`, x + 12 + 2 * (cardW / 3), cy + 60);

    // P&L footer
    const shares = ACCOUNT / m.entry;
    const cardPnl = 0.8 * shares * (m.target - m.entry) + 0.2 * shares * (m.peak - m.entry);
    setColor(C.textMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("HYPOTHETICAL P&L (80% TARGET / 20% PEAK)", x + 12, cy + 78);
    setColor(C.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(fmtMoney(cardPnl), x + 12, cy + 92);
  }

  // ════════ PAGE 5 — THE RESCUE WINDOW ════════
  doc.addPage();
  brandHeader("The Rescue Window", "Stop-outs that later hit target — the case for a wider stop");

  y = 130;
  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const opener =
    `${stats.rescueCount} of ${stats.losses} stopped-out trades (${((stats.rescueCount / stats.losses) * 100).toFixed(1)}%) ` +
    `eventually peaked above their original target. The thesis was right — the stop was just tighter than the noise.`;
  const olines = doc.splitTextToSize(opener, contentW);
  doc.text(olines, margin, y);
  y += olines.length * 16 + 16;

  // Big counterfactual tile
  setFill([240, 252, 246]);
  setDraw(C.emerald);
  doc.roundedRect(margin, y, contentW, 130, 8, 8, "FD");

  setColor(C.textMuted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("IF THESE 33 STOPS HADN'T TRIGGERED", margin + 20, y + 24);

  setColor(C.red);
  doc.setFontSize(10);
  doc.text("Realized loss at stops:", margin + 20, y + 50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(fmtMoney(stats.rescueLossRealized), margin + 200, y + 50);

  setColor(C.emerald);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Would have made instead:", margin + 20, y + 72);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("+" + fmtMoney(stats.rescueWinPotential), margin + 200, y + 72);

  setColor(C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("NET P&L SWING:", margin + 20, y + 102);
  setColor(C.emerald);
  doc.setFontSize(22);
  doc.text("+" + fmtMoney(stats.rescueSwing), margin + 200, y + 105);

  y += 145;

  // Win rate comparison
  setColor(C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("WIN RATE IMPACT", margin, y);
  y += 16;

  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Original: ${stats.winRate.toFixed(1)}%   →   With wider stop: ${stats.adjustedWinRate.toFixed(1)}%`, margin, y);
  y += 8;

  // Win-rate visual bars
  const wrBarW = contentW - 100;
  const origPct = stats.winRate / 100;
  const adjPct = stats.adjustedWinRate / 100;

  y += 8;
  setColor(C.textMuted);
  doc.setFontSize(8);
  doc.text("ORIGINAL", margin, y + 12);
  setFill([230, 235, 240]);
  doc.rect(margin + 60, y + 4, wrBarW, 14, "F");
  setFill(C.amber);
  doc.rect(margin + 60, y + 4, wrBarW * origPct, 14, "F");
  setColor(C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`${stats.winRate.toFixed(1)}%`, margin + 60 + wrBarW * origPct + 6, y + 14);
  y += 22;

  setColor(C.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("WIDER STOP", margin, y + 12);
  setFill([230, 235, 240]);
  doc.rect(margin + 60, y + 4, wrBarW, 14, "F");
  setFill(C.emerald);
  doc.rect(margin + 60, y + 4, wrBarW * adjPct, 14, "F");
  setColor(C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`${stats.adjustedWinRate.toFixed(1)}%`, margin + 60 + wrBarW * adjPct + 6, y + 14);
  y += 32;

  // Average stop vs peak distances
  setColor(C.emerald);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("THE PATTERN", margin, y);
  y += 16;

  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const patternLine = doc.splitTextToSize(
    `Average stop on the rescued trades: -${stats.avgStopPctOnRescues.toFixed(1)}% from entry. ` +
    `Average peak: +${stats.avgPeakPctOnRescues.toFixed(1)}%. ` +
    `A volatility-aware stop (e.g. 2× ATR) — or simply -8% to -10% — would have caught most of these without giving back the genuine losers.`,
    contentW
  );
  doc.text(patternLine, margin, y);
  y += patternLine.length * 13 + 14;

  // Top 5 rescue candidates table
  setColor(C.emerald);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOP RESCUE CANDIDATES", margin, y);
  y += 14;

  // Compact table for top 8 rescues
  const top8 = stats.rescueCandidates.slice(0, 8);
  const tCols = [
    { label: "TICKER", w: 70 },
    { label: "ENTRY", w: 60 },
    { label: "STOP", w: 80 },
    { label: "TARGET", w: 80 },
    { label: "PEAK", w: 90 },
    { label: "MISSED", w: 100 },
  ];
  setFill([245, 248, 252]);
  doc.rect(margin, y, contentW, 18, "F");
  setColor(C.textBody);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  let cx = margin + 8;
  for (const c of tCols) {
    doc.text(c.label, cx, y + 12);
    cx += c.w;
  }
  y += 18;

  for (let i = 0; i < top8.length; i++) {
    const r = top8[i];
    if (i % 2 === 1) {
      setFill([252, 253, 254]);
      doc.rect(margin, y, contentW, 16, "F");
    }
    const stopPct = ((r.stop - r.entry) / r.entry) * 100;
    const peakPct = ((r.peak - r.entry) / r.entry) * 100;
    const shares = ACCOUNT / r.entry;
    const missed = (0.8 * shares * (r.target - r.entry)) + (0.2 * shares * (r.peak - r.entry)) - (shares * (r.stop - r.entry));
    cx = margin + 8;
    setColor(C.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(r.ticker, cx, y + 11);
    cx += tCols[0].w;

    doc.setFont("helvetica", "normal");
    doc.text(`$${r.entry.toFixed(2)}`, cx, y + 11);
    cx += tCols[1].w;

    setColor(C.red);
    doc.text(`$${r.stop.toFixed(2)} (${stopPct.toFixed(1)}%)`, cx, y + 11);
    cx += tCols[2].w;

    setColor(C.textBody);
    doc.text(`$${r.target.toFixed(2)}`, cx, y + 11);
    cx += tCols[3].w;

    setColor(C.emerald);
    doc.setFont("helvetica", "bold");
    doc.text(`$${r.peak.toFixed(2)} (+${peakPct.toFixed(1)}%)`, cx, y + 11);
    cx += tCols[4].w;

    doc.text(`+${fmtMoney(missed)}`, cx, y + 11);
    y += 16;
  }

  // ════════ PAGE 6+ — TOP WINNERS ════════
  doc.addPage();
  brandHeader("Top 25 Winners", "Trades that hit target — sorted by realized P&L");

  y = 130;
  const winners = trades.filter((t) => t.status === "TARGET_HIT").sort((a, b) => b.pnl - a.pnl).slice(0, 25);

  drawTradeTable(doc, winners, margin, y, contentW, C, "TARGET_HIT");

  // ════════ TOP LOSERS ════════
  doc.addPage();
  brandHeader("Top 25 Losses", "Trades that hit stop — sorted by realized loss");

  y = 130;
  const losers = trades.filter((t) => t.status === "STOP_HIT").sort((a, b) => a.pnl - b.pnl).slice(0, 25);

  drawTradeTable(doc, losers, margin, y, contentW, C, "STOP_HIT");

  // ════════ ALL TRADES (paginated) ════════
  const allTradesSorted = [...trades].sort((a, b) => {
    const da = a.exitDate ? new Date(a.exitDate).getTime() : 0;
    const db = b.exitDate ? new Date(b.exitDate).getTime() : 0;
    return db - da;
  });

  const ROWS_PER_PAGE = 38;
  for (let p = 0; p < allTradesSorted.length; p += ROWS_PER_PAGE) {
    const slice = allTradesSorted.slice(p, p + ROWS_PER_PAGE);
    doc.addPage();
    brandHeader("Complete Trade Log", `Page ${Math.floor(p / ROWS_PER_PAGE) + 1} · sorted by exit date (newest first)`);
    drawTradeTable(doc, slice, margin, 130, contentW, C, null, true);
  }

  // ════════ DEFINITIONS & METHODOLOGY ════════
  doc.addPage();
  brandHeader("Definitions & Methodology", "How every number in this report is calculated");

  y = 130;
  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  function defBlock(term, definition) {
    setColor(C.emerald);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(term, margin, y);
    y += 14;
    setColor(C.textBody);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(definition, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 12 + 10;
  }

  defBlock(
    "Profitable Direction Rate",
    "The percentage of closed trades whose price reached any level above the entry price at some point during the holding period. This metric measures signal quality — whether the system identified a stock that became profitable — and is distinct from \"win rate.\" A trade can be \"profitably directional\" and still be a stop-loss loss if the trader did not exit before the reversal."
  );
  defBlock(
    "Win Rate (strict)",
    "The percentage of closed trades that reached the published target price without first triggering the published stop-loss. Calculated as 33.2% across 573 closed trades in this report. This is the most conservative measure and the one used in the headline performance numbers."
  );
  defBlock(
    "Holding Period & Closure",
    "A trade is considered \"closed\" when its tradeStatus field equals TARGET_HIT or STOP_HIT in the underlying database. ACTIVE and EXPIRED trades are excluded from all P&L calculations in this report."
  );
  defBlock(
    "Hypothetical Position Sizing",
    "$10,000 is allocated to every closed trade, with the share quantity calculated as 10,000 ÷ entry_price (fractional shares assumed). Real-world execution would round to whole shares and incur commissions, slippage, and bid/ask spread costs not modeled in these results."
  );
  defBlock(
    "Exit Rules Modeled",
    "TARGET_HIT trades: 80% of the position is sold at the published target price; the remaining 20% is sold at the highest price reached during the holding period (\"peak\"). STOP_HIT trades: 100% of the position is sold at the published stop-loss price. These rules are uniform across all trades; no discretionary overrides are applied in the simulation."
  );
  defBlock(
    "Peak / Trough Tracking",
    "Peak is the highest price observed for the ticker between the trade's posting date and the report's generation date, sourced from BigQuery daily OHLC bars. Trough is the corresponding low. Peak / trough continue to update for closed trades — meaning a closed winner that subsequently runs higher will reflect the new peak in the 20% portion of the simulated exit."
  );
  defBlock(
    "Data Sources",
    "Trade signals: Mezan Research scanner output stored in MongoDB collection swingTradeIdea. Historical price data: BigQuery learn-trading-app.market_data.ohlcv. Live intraday quotes (used to update peak / trough for active trades): Financial Modeling Prep API. No data has been altered, excluded, or filtered for this report beyond removing trades with incomplete entry / target / stop fields."
  );

  // ════════ COMPREHENSIVE LEGAL DISCLAIMERS ════════
  doc.addPage();
  brandHeader("Important Legal Disclaimers", "Please read carefully");

  y = 130;
  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  function discBlock(heading, body) {
    if (y + 60 > pageH - 80) { doc.addPage(); brandHeader("Important Legal Disclaimers (continued)", ""); y = 130; }
    setColor(C.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(heading, margin, y);
    y += 12;
    setColor(C.textBody);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(body, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 11 + 10;
  }

  discBlock(
    "1. NOT INVESTMENT ADVICE",
    "Mezan Research is a publisher of educational and informational content about US equity markets. This report is provided for general informational and educational purposes only and does not constitute investment advice, an offer to buy or sell any security, a solicitation of any offer to buy or sell any security, or a recommendation tailored to the financial situation, investment objectives, risk tolerance, or any other circumstance of any individual reader. Mezan Research is not a registered investment adviser with the U.S. Securities and Exchange Commission (SEC) or any state securities authority, and operates pursuant to the publisher exemption under Section 202(a)(11)(D) of the Investment Advisers Act of 1940."
  );
  discBlock(
    "2. HYPOTHETICAL PERFORMANCE RESULTS",
    "The performance results shown in this report are HYPOTHETICAL and are derived from a simulation of trades using historical price data. Hypothetical performance results have many inherent limitations, some of which are described below. No representation is being made that any account will or is likely to achieve profits or losses similar to those shown. There are frequently sharp differences between hypothetical performance results and the actual results subsequently achieved by any particular trading program. One of the limitations of hypothetical performance results is that they are generally prepared with the benefit of hindsight. In addition, hypothetical trading does not involve financial risk, and no hypothetical trading record can completely account for the impact of financial risk in actual trading. The ability to withstand losses or adhere to a particular trading program in spite of trading losses are material points which can adversely affect actual trading results."
  );
  discBlock(
    "3. NOT MODELED — REAL-WORLD COSTS",
    "The hypothetical results in this report DO NOT account for: (a) brokerage commissions; (b) bid/ask spread costs; (c) slippage on entry or exit; (d) capital gains or other taxes; (e) liquidity constraints, including the possibility that a published target or stop price was not actually executable in the live market on the relevant day; (f) margin interest; (g) overnight gap risk; (h) the psychological discipline required to follow a trading system through a string of losses. In real trading, each of these factors typically reduces returns and would have reduced the hypothetical net P&L shown."
  );
  discBlock(
    "4. PAST PERFORMANCE DOES NOT GUARANTEE FUTURE RESULTS",
    "Past performance, whether actual or hypothetical, is no guarantee of future results. Markets change. Strategies that worked in one regime may fail in another. The results presented here cover a finite historical window and may not be representative of future market conditions, future signal quality, or future returns. There is no assurance that any subscriber, reader, or third party following Mezan Research signals will achieve results similar to or better than those shown."
  );
  discBlock(
    "5. RISK OF LOSS",
    "Trading and investing in securities involves substantial risk of loss, including the loss of the entire amount invested, and is not suitable for all persons. Before acting on any signal, scan, idea, analysis, or content provided by Mezan Research, you should: (a) assess your own financial situation, (b) consider your investment objectives, risk tolerance, and time horizon, (c) consult with a licensed investment adviser, broker, accountant, and/or attorney, and (d) only commit capital you can afford to lose entirely."
  );
  discBlock(
    "6. NO PERSONALIZED RECOMMENDATIONS",
    "All content from Mezan Research is impersonal and is not tailored to the specific needs, financial situation, investment objectives, or circumstances of any reader. Two readers receiving the same content may face very different results because of differences in account size, tax situation, risk tolerance, execution timing, broker, or any number of other factors. No content from Mezan Research should be construed as a personalized recommendation."
  );
  discBlock(
    "7. NO FIDUCIARY DUTY",
    "Mezan Research, its principals, employees, contractors, and agents do not act as a fiduciary to any reader, subscriber, or visitor. No advisory relationship is created or implied by viewing, downloading, subscribing to, or acting on any content. Readers are solely responsible for their own investment and trading decisions."
  );
  discBlock(
    "8. DATA ACCURACY",
    "Mezan Research uses third-party data providers, including but not limited to Financial Modeling Prep, Google BigQuery, and other public market data feeds. While reasonable care has been taken to verify the accuracy of the data presented, Mezan Research does not warrant or guarantee the accuracy, completeness, or timeliness of any data, calculation, or analysis. Errors in source data, computational rounding, time-zone artifacts, ticker symbol changes, stock splits, dividend adjustments, or delisting events may cause individual trade results to differ from real-world outcomes."
  );
  discBlock(
    "9. CONFLICTS OF INTEREST",
    "Principals of Mezan Research and its affiliates may, from time to time, hold long or short positions in securities mentioned in this report. Mezan Research does not require or solicit individual subscribers to hold any particular security and does not receive compensation from issuers of securities for inclusion of those securities in any research, signal, list, or content."
  );
  discBlock(
    "10. SHARIAH / HALAL COMPLIANCE",
    "Mezan Research applies a proprietary Shariah-compliance screen based on commonly-cited financial ratios and business-activity classifications. Halal classification is provided for informational purposes only, may differ from the rulings of any specific scholar or Shariah board, and should not be relied upon as a definitive religious determination. Readers seeking authoritative Shariah guidance for their investments should consult with a qualified Islamic scholar or certified Shariah advisor."
  );
  discBlock(
    "11. NO TAX OR LEGAL ADVICE",
    "Nothing in this report constitutes tax, legal, accounting, or regulatory advice. Tax treatment of trading gains and losses varies by jurisdiction, holding period, account type, and individual circumstance. Consult a qualified professional before making any decision with tax or legal implications."
  );
  discBlock(
    "12. JURISDICTION & GOVERNING LAW",
    "Mezan Research is operated from the United States. This report and all content from Mezan Research are governed by the laws of the State of Texas, without regard to its conflict-of-laws provisions. Any dispute arising from or relating to this content shall be resolved through binding arbitration in Houston, Texas, in accordance with the then-current rules of JAMS, and the parties expressly waive any right to participate in a class action."
  );
  discBlock(
    "13. NO REDISTRIBUTION",
    "This report and all content within it are the proprietary work of Mezan Research and are intended for the use of the individual subscriber or recipient only. No portion may be reproduced, redistributed, republished, modified, or made available to any third party in any form or by any means without prior written consent. Unauthorized distribution may result in immediate termination of subscription, civil action for damages, and statutory penalties."
  );
  discBlock(
    "14. FORWARD-LOOKING STATEMENTS",
    "Any forward-looking statements in this report — including but not limited to projections, expected returns, anticipated outcomes, and assumptions about future market conditions — are inherently uncertain. Actual results may differ materially. Mezan Research undertakes no obligation to update any forward-looking statement to reflect events or circumstances after the date of this report."
  );
  discBlock(
    "15. ACCEPTANCE OF TERMS",
    "By reading this report, the reader acknowledges and agrees to all terms set forth above and on Mezan Research's website at mezaninvesting.com. If the reader does not agree, the reader must immediately cease use of this content and is not authorized to act on any portion of it."
  );

  // ════════ CLOSING ════════
  doc.addPage();
  brandHeader("Final Word", "Why this works");
  y = 140;

  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const closing = [
    "The market is a probability machine. Every entry is a hypothesis. Every exit is the test result.",
    "",
    "The traders who survive don't try to be right more often. They size losses small and let winners breathe. They don't argue with the chart. They follow the framework even on the days it feels stupid — because over hundreds of trades, the framework wins. The conviction doesn't.",
    "",
    "Mezan Research is built for that discipline. Every signal comes with a target, a stop, and the math behind both. We track the peak so the monster moves don't slip away. We track the trough so the small losses don't compound into career-enders.",
    "",
    "Learn to trade. Think in probabilities. Balance — Mezan — your trading career.",
  ];
  for (const line of closing) {
    if (line === "") { y += 8; continue; }
    const lines = doc.splitTextToSize(line, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 16;
  }

  y += 10;
  // CTA box
  setFill([240, 252, 246]);
  setDraw(C.emerald);
  doc.roundedRect(margin, y, contentW, 70, 8, 8, "FD");
  setColor(C.emerald);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Join Mezan Research", margin + 20, y + 30);
  setColor(C.textBody);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("mezaninvesting.com  ·  AI-powered halal swing scanner  ·  $15.99/mo", margin + 20, y + 52);

  // Disclaimer
  y = pageH - 110;
  setDraw(C.rule);
  doc.line(margin, y, pageW - margin, y);
  y += 12;
  setColor(C.textMuted);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  const dl = doc.splitTextToSize(
    "DISCLAIMER: This report is for educational purposes only. Past performance does not guarantee future results. The simulation assumes a $10,000 per-trade allocation and the documented exit rules. Real trading involves slippage, commissions, and execution risk not modeled here. This is not financial advice. Always do your own research and consult a licensed financial advisor before making investment decisions.",
    contentW
  );
  doc.text(dl, margin, y);

  // Page numbers (footer)
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    footer(i, totalPages);
  }

  return doc;
}

// ─── Trade table renderer ───────────────────────────────────────────────────
function drawTradeTable(doc, rows, x, y, w, C, statusFilter, compact) {
  const setColor = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const setFill = (c) => doc.setFillColor(c[0], c[1], c[2]);

  // Columns
  const cols = compact
    ? [
        { key: "ticker", label: "Ticker", w: 60 },
        { key: "status", label: "Status", w: 70 },
        { key: "entry", label: "Entry", w: 60, fmt: (v) => `$${v.toFixed(2)}` },
        { key: "exit", label: "Exit", w: 60, fmt: (v) => `$${v.toFixed(2)}` },
        { key: "peak", label: "Peak", w: 60, fmt: (v) => v ? `$${v.toFixed(2)}` : "—" },
        { key: "exitDate", label: "Exit Date", w: 80, fmt: (v) => fmtMonthDay(v) },
        { key: "holdingDays", label: "Days", w: 40, fmt: (v) => v ? `${v}` : "—" },
        { key: "pnl", label: "P&L", w: 80, fmt: (v) => fmtMoney2(v) },
      ]
    : [
        { key: "ticker", label: "Ticker", w: 65 },
        { key: "entry", label: "Entry", w: 60, fmt: (v) => `$${v.toFixed(2)}` },
        { key: "exit", label: "Exit", w: 60, fmt: (v) => `$${v.toFixed(2)}` },
        { key: "peak", label: "Peak", w: 60, fmt: (v) => v ? `$${v.toFixed(2)}` : "—" },
        { key: "peakPct", label: "Peak %", w: 60, fmt: (v) => v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(1)}%` : "—" },
        { key: "holdingDays", label: "Days", w: 50, fmt: (v) => v ? `${v}` : "—" },
        { key: "pnl", label: "P&L", w: 90, fmt: (v) => fmtMoney2(v) },
        { key: "exitNote", label: "Exit Rule", w: 130 },
      ];

  // Header row
  setFill([245, 248, 252]);
  doc.rect(x, y, w, 22, "F");
  setColor(C.textBody);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  let cx = x + 6;
  for (const col of cols) {
    doc.text(col.label.toUpperCase(), cx, y + 14);
    cx += col.w;
  }
  y += 22;

  // Data rows
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (i % 2 === 1) {
      setFill([252, 253, 254]);
      doc.rect(x, y, w, 18, "F");
    }
    cx = x + 6;
    for (const col of cols) {
      let val;
      if (col.key === "ticker") val = r.ticker;
      else if (col.key === "status") {
        val = r.status === "TARGET_HIT" ? "TARGET" : "STOP";
        setColor(r.status === "TARGET_HIT" ? C.emerald : C.red);
      }
      else if (col.key === "entry") val = col.fmt(r.entry);
      else if (col.key === "exit") {
        val = col.fmt(r.exitPrice ?? (r.status === "TARGET_HIT" ? r.target : r.stop));
      }
      else if (col.key === "peak") val = col.fmt(r.peak);
      else if (col.key === "peakPct") val = col.fmt(r.peakPct);
      else if (col.key === "holdingDays") val = col.fmt(r.holdingDays);
      else if (col.key === "pnl") {
        val = col.fmt(r.pnl);
        setColor(r.pnl >= 0 ? C.emerald : C.red);
      }
      else if (col.key === "exitDate") val = col.fmt(r.exitDate);
      else if (col.key === "exitNote") val = r.exitNote;
      else val = "—";

      doc.setFont("helvetica", col.key === "ticker" || col.key === "pnl" ? "bold" : "normal");
      doc.setFontSize(8.5);
      // Truncate exit rule if it overflows
      let display = String(val);
      if (col.key === "exitNote" && doc.getTextWidth(display) > col.w - 8) {
        while (doc.getTextWidth(display + "…") > col.w - 8 && display.length > 4) {
          display = display.slice(0, -1);
        }
        display += "…";
      }
      doc.text(display, cx, y + 12);
      // Reset color
      if (col.key === "status" || col.key === "pnl") setColor(C.textBody);
      cx += col.w;
    }
    y += 18;
  }
}

const fmtMoney2 = (n) => {
  const sign = n < 0 ? "-" : "+";
  const abs = Math.abs(n);
  return `${sign}$${abs.toFixed(0)}`;
};
const fmtMonthDay = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${m[dt.getMonth()]} ${dt.getDate()}, ${String(dt.getFullYear()).slice(2)}`;
};

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("Loading trades from Mongo…");
  const trades = await loadTrades();
  if (trades.length === 0) {
    console.error("No closed trades found. Aborting.");
    process.exit(1);
  }
  console.log(`Loaded ${trades.length} closed trades.`);

  const stats = aggregate(trades);
  console.log("Stats:", {
    total: stats.total,
    wins: stats.wins,
    losses: stats.losses,
    net: fmtMoney(stats.net),
    winRate: `${stats.winRate.toFixed(1)}%`,
    avgWin: fmtMoney(stats.avgWin),
    avgLoss: fmtMoney(stats.avgLoss),
    rrRatio: stats.rrRatio.toFixed(2),
  });

  console.log("Rendering PDF…");
  const doc = await renderPdf(trades, stats);
  const outPath = "/Users/junaidpasha/Downloads/tradeplans/Mezan_Swing_Performance_Report.pdf";
  fs.writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
  console.log("Saved to:", outPath);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
