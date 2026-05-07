import { jsPDF } from "jspdf";
import fs from "fs";

const doc = new jsPDF({ unit: "pt", format: "letter" });
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 50;
const contentWidth = pageWidth - margin * 2;
let y = margin;

// ----- Helpers -----
const addText = (text, opts = {}) => {
  const { size = 11, bold = false, color = [40, 40, 40], spacing = 4, indent = 0 } = opts;
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, contentWidth - indent);
  if (y + lines.length * (size + spacing) > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }
  doc.text(lines, margin + indent, y);
  y += lines.length * (size + spacing);
};

const addSpace = (h = 10) => { y += h; };

const addLine = () => {
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;
};

const addBox = (title, content, color = [16, 185, 129]) => {
  if (y + 80 > pageHeight - margin) { doc.addPage(); y = margin; }
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(margin, y, 4, 80, "F");
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, margin + 12, y + 14);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(content, contentWidth - 16);
  doc.text(lines, margin + 12, y + 32);
  y += Math.max(80, lines.length * 13 + 30) + 10;
};

const embedImage = (path, caption, aspectRatio = 0.55) => {
  if (!fs.existsSync(path)) {
    console.warn(`Chart not found: ${path}`);
    return;
  }
  try {
    const buf = fs.readFileSync(path);
    const isPng = buf[0] === 0x89 && buf[1] === 0x50;
    const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
    const fmt = isPng ? "PNG" : isJpg ? "JPEG" : null;
    if (!fmt) {
      console.warn(`Unsupported image format at ${path}`);
      return;
    }
    const mime = isPng ? "image/png" : "image/jpeg";
    const imgData = buf.toString("base64");
    const imgWidth = contentWidth;
    const imgHeight = imgWidth * aspectRatio;
    if (y + imgHeight + 30 > pageHeight - margin) { doc.addPage(); y = margin; }
    doc.addImage(`data:${mime};base64,${imgData}`, fmt, margin, y, imgWidth, imgHeight);
    y += imgHeight + 8;
    doc.setTextColor(140, 140, 140);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(caption, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 10 + 12;
    console.log(`Embedded chart from ${path} (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.warn(`Could not embed chart at ${path}: ${e.message}`);
  }
};

// ===== HEADER =====
doc.setFillColor(6, 10, 16);
doc.rect(0, 0, pageWidth, 80, "F");
doc.setTextColor(255, 255, 255);
doc.setFont("helvetica", "bold");
doc.setFontSize(22);
doc.text("Mezan Research", margin, 40);
doc.setFontSize(10);
doc.setTextColor(16, 185, 129);
doc.text("Trade Plan Analysis", margin, 58);
doc.setTextColor(160, 160, 160);
doc.text("May 6, 2026", pageWidth - margin - 60, 58);

y = 110;

// ===== TITLE =====
addText("SMCI (Super Micro Computer Inc.)", { size: 18, bold: true, color: [20, 20, 20] });
addText("Post-Earnings VWAP Reclaim — 5-Minute Day Trade", { size: 12, color: [100, 100, 100] });
addSpace(15);
addLine();
addSpace(5);

// ===== CHART 1 — 4 HOUR STRUCTURE =====
addText("STRUCTURE PREP — 4 HOUR / DAILY", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);
embedImage(
  "/Users/junaidpasha/Desktop/proceduralMemory/smci-4hour.jpg",
  "SMCI — 4-Hour structure with daily $49.96 ceiling. Multiple 4-hour rejection wicks circled at $35.93 / $34.46 zone. Market remembers — these levels matter.",
  0.45
);

// ===== SETUP CONTEXT =====
addText("SETUP CONTEXT", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(5);
addText(
  "SMCI reported strong earnings and gapped up, trending in pre-market. The decision was between AMD and SMCI — both strong, but SMCI gave the cleaner setup. After the open, sellers leaned in and the stock pulled back, finding 5-minute support. Before the day, I had already mapped the 4-hour rejection zones and the daily $49.96 ceiling — market has a memory, and these are the prints I want to trade against. Plan was simple: wait for consolidation, do not chase a breakdown, take the entry only on a clean VWAP reclaim.",
  { size: 10, color: [70, 70, 70] }
);
addSpace(15);

// ===== CHART 2 — 5 MIN EXECUTION =====
addText("EXECUTION — 15 MIN & 5 MIN", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);
embedImage(
  "/Users/junaidpasha/Desktop/proceduralMemory/smci-vwap.jpg",
  "Left: 15-minute — (1) Pre-Market High, (2) 15-min ORB high. Right: 5-minute — (3) consolidation, (4) entry on VWAP reclaim, (5) sell into resistance, (6) stop just below VWAP.",
  0.45
);

// ===== KEY LEVELS IDENTIFIED =====
addText("KEY LEVELS IDENTIFIED (chart annotations)", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const levels = [
  ["1", "Pre-Market High (PMH) — 15 min", "First overhead reference. Acts as resistance until reclaimed; flips to support if price holds above."],
  ["2", "15-Minute ORB High", "Opening Range high after the first 15 minutes — the first clean intraday breakout level."],
  ["3", "5-Minute Consolidation", "Tight base building above VWAP. Sellers exhausted, buyers absorbing supply. Pre-trigger setup."],
  ["4", "Entry — VWAP Reclaim", "Long entry as the 5-minute candle closed back above VWAP with volume confirming. SPY and QQQ both ripping — context aligned."],
  ["5", "Exit — Resistance Hit", "Sold into the prior 4-hour rejection zone. Booked the move; did not overstay into a known supply level."],
  ["6", "Stop — Just Below VWAP", "$1 below VWAP. If price loses VWAP, the thesis is invalidated and I am out, no questions asked."],
];

levels.forEach(([num, label, desc]) => {
  if (y + 50 > pageHeight - margin) { doc.addPage(); y = margin; }
  doc.setFillColor(16, 185, 129);
  doc.circle(margin + 10, y + 4, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(num, margin + 7, y + 7);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(label, margin + 28, y + 7);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(desc, contentWidth - 28);
  doc.text(lines, margin + 28, y + 22);
  y += Math.max(38, lines.length * 11 + 18);
});

addSpace(10);

// ===== AMATEUR VS PROFESSIONAL =====
addBox(
  "AMATEUR MISTAKE: Chasing the open or shorting the breakdown",
  "Inexperienced traders either FOMO-buy the gap-up open (right into the morning sellers) or short the early pullback into VWAP and get stopped on the reclaim. Both sides get chopped because the real signal has not printed yet.",
  [239, 68, 68]
);

addBox(
  "PROFESSIONAL APPROACH: Map structure, then wait for the trigger",
  "Pre-mark 4-hour rejection zones the night before. Let the morning sellers do their work. Watch for tight 5-minute consolidation above VWAP. Only enter on a clean VWAP reclaim with market context (SPY, QQQ) confirming. Patience is the edge.",
  [16, 185, 129]
);

// ===== ENTRY CRITERIA =====
addText("ENTRY CRITERIA — Multi-Confluence Checklist", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const criteria = [
  "Strong fundamental catalyst (earnings beat) confirmed pre-market",
  "Pre-marked 4-hour rejection zones — know where the market remembers",
  "Stock consolidating tightly on the 5-minute, NOT breaking down",
  "Price reclaims VWAP on the 5-minute with the candle closing above",
  "SPY and QQQ both ripping — broader tape supports long bias",
  "VIX cooperating (not elevated), no Fed speakers on the docket",
];

criteria.forEach((c) => {
  if (y + 18 > pageHeight - margin) { doc.addPage(); y = margin; }
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(10);
  doc.text("v", margin + 4, y + 6);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(c, contentWidth - 20);
  doc.text(lines, margin + 18, y + 6);
  y += lines.length * 13 + 6;
});

addSpace(10);

// ===== RISK MANAGEMENT =====
if (y + 120 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("RISK MANAGEMENT", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

addBox(
  "Position Sizing",
  "100 shares. SMCI is not a high-ADR name, so I am comfortable taking a small loss if wrong. Size always sits inside the loss I am willing to wear, never the other way around.",
  [59, 130, 246]
);

addBox(
  "Stop Loss",
  "Just below VWAP — approximately $1 of risk per share. 100 shares x $1 = $100 max loss. If 5-minute price closes below VWAP, the thesis is invalidated and I exit. No 'give it room.' SMCI has too much news/SEC history to hold against the level.",
  [239, 68, 68]
);

addBox(
  "Profit Targets / Reward",
  "First target: pre-marked 4-hour rejection zone. Risk $100 to make $300+ — clean 1:3 R:R. If price stalls into the level, take the bag and move on. Do not turn a winner into a loser by letting a short-window day trade marinate.",
  [16, 185, 129]
);

// ===== MARKET CONTEXT =====
if (y + 120 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("MARKET CONTEXT (Day Of)", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const context = [
  ["SPY", "Ripping"],
  ["QQQ", "Ripping"],
  ["VIX", "Sliding — risk-on tape"],
  ["Fed Speakers", "None on the docket"],
  ["Sector Tone", "Tech / AI strength — supports SMCI longs"],
  ["Net Bias", "Long-only on confirmation"],
];

context.forEach(([label, value]) => {
  if (y + 22 > pageHeight - margin) { doc.addPage(); y = margin; }
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, contentWidth, 22, "F");
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(label, margin + 12, y + 14);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.text(value, margin + 200, y + 14);
  y += 24;
});

addSpace(15);

// ===== DECISION FRAMEWORK =====
if (y + 100 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("DECISION FRAMEWORK — From Scan to Trade", { size: 13, bold: true, color: [16, 185, 129] });
addSpace(8);
addText(
  "When a stock shows up in scan, here is the exact sequence I run before I commit capital. The scan finds the opportunity. The trader still has to make the decisions.",
  { size: 10, color: [70, 70, 70] }
);
addSpace(12);

const framework = [
  {
    q: "1. Where am I wrong if I enter this trade?",
    a: "Below VWAP. That defines my stop. For low-ADR names like SMCI, I cut tight (3-4.5%). High-ADR names get more room because they naturally swing more. Common stops I use: previous day low, key EMA loss, structure breakdown, failed breakout.",
  },
  {
    q: "2. How much money can I lose if I am wrong?",
    a: "100 shares with a $1 stop below VWAP = $100 max loss. Risk management before profit. Always.",
  },
  {
    q: "3. Is there an immediate target nearby?",
    a: "Yes — Pre-Market High and the pre-marked 4-hour rejection zones. Other targets I look for: previous day high, 50 EMA, gap fill, major resistance, prior rejection zones.",
  },
  {
    q: "4. What is the risk-to-reward?",
    a: "Risk $100 to make $300+ — clean 1:3. If reward is too small versus the risk, I skip. Capital protection first.",
  },
  {
    q: "5. What is the market doing?",
    a: "SPY ripping. QQQ ripping. VIX sliding. No Fed speakers. Tape is strong. Even good stocks fail in bad markets — but here, context is supportive.",
  },
  {
    q: "6. What kind of trade is this — quick day trade or swing?",
    a: "Day trade only. SMCI has a history of news, SEC troubles, and accounting concerns. Not comfortable holding overnight. Some stocks are 'hello and goodbye' — this is one of them.",
  },
  {
    q: "7. Is this stock worth pursuing further?",
    a: "Not as a swing or investment. As a one-day vehicle with a defined risk and a 1:3 reward, yes. After the bag is booked, I am out and onto the next.",
  },
];

framework.forEach(({ q, a }) => {
  if (y + 60 > pageHeight - margin) { doc.addPage(); y = margin; }
  doc.setTextColor(16, 185, 129);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const qLines = doc.splitTextToSize(q, contentWidth);
  doc.text(qLines, margin, y);
  y += qLines.length * 13 + 2;
  doc.setTextColor(70, 70, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const aLines = doc.splitTextToSize(a, contentWidth - 12);
  if (y + aLines.length * 13 > pageHeight - margin) { doc.addPage(); y = margin; }
  doc.text(aLines, margin + 12, y);
  y += aLines.length * 13 + 12;
});

// ===== TRADE PLAN SUMMARY =====
if (y + 160 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("TRADE PLAN SUMMARY", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const summary = [
  ["Setup", "Post-Earnings VWAP Reclaim (Day Trade)"],
  ["Direction", "Long"],
  ["Timeframe", "5-minute execution / 4-hour structure"],
  ["Entry Trigger", "5-min candle closes back above VWAP after consolidation"],
  ["Stop Loss", "$1 below VWAP — thesis broken"],
  ["First Target", "Pre-marked 4-hour rejection zone"],
  ["Risk:Reward", "1:3 (risk $100 to make $300)"],
  ["Position Size", "100 shares — small risk, low-ADR name"],
  ["Hold Overnight?", "No — SMCI has news/SEC history"],
  ["Type", "Quick day trade — hello and goodbye"],
];

summary.forEach(([label, value]) => {
  if (y + 22 > pageHeight - margin) { doc.addPage(); y = margin; }
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, contentWidth, 22, "F");
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(label, margin + 12, y + 14);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.text(value, margin + 200, y + 14);
  y += 24;
});

addSpace(15);

// ===== KEY TAKEAWAYS =====
if (y + 120 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("KEY TAKEAWAYS", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const takeaways = [
  "Pre-mark structure the night before — 4-hour rejections are where the market remembers.",
  "Don't chase the open. Don't short the breakdown. Wait for the consolidation, then wait for the trigger.",
  "VWAP reclaim on the 5-minute is the cleanest day-trade entry on a gap-up.",
  "Risk before reward: define the stop first, then count your shares.",
  "Match position size to ADR. Low-ADR names get tighter stops, not bigger sizes.",
  "Some stocks are day-trade only. SMCI's history makes it a 'hello and goodbye' trade — never overnight.",
  "The scan finds opportunities. The trader still has to decide. Discipline is the edge.",
];

takeaways.forEach((t) => {
  if (y + 18 > pageHeight - margin) { doc.addPage(); y = margin; }
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(10);
  doc.text(">", margin + 4, y + 6);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(t, contentWidth - 20);
  doc.text(lines, margin + 18, y + 6);
  y += lines.length * 13 + 6;
});

// ===== DISCLAIMER =====
if (y + 80 > pageHeight - margin) { doc.addPage(); y = margin; }
addSpace(20);
addLine();
doc.setTextColor(150, 150, 150);
doc.setFont("helvetica", "italic");
doc.setFontSize(8);
const disclaimer = "DISCLAIMER: Mezan Research is for educational purposes only. This is not financial advice. Trading involves substantial risk of loss. Past performance does not guarantee future results. Always do your own research and consult a licensed financial advisor before making investment decisions.";
const dlines = doc.splitTextToSize(disclaimer, contentWidth);
doc.text(dlines, margin, y);

// ===== FOOTER on each page =====
const totalPages = doc.internal.getNumberOfPages();
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Mezan Research  |  Page ${i} of ${totalPages}`, margin, pageHeight - 20);
  doc.text("mezaninvesting.com", pageWidth - margin - 80, pageHeight - 20);
}

// ===== Save =====
const outPath = "/Users/junaidpasha/Downloads/tradeplans/SMCI_Trade_Plan_Mezan.pdf";
fs.writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
console.log("PDF saved to:", outPath);
