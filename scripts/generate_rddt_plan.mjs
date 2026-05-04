import { jsPDF } from "jspdf";
import fs from "fs";

const doc = new jsPDF({ unit: "pt", format: "letter" });
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 50;
const contentWidth = pageWidth - margin * 2;
let y = margin;

// Helpers
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

const embedImage = (paths, captionText, heightRatio = 0.5) => {
  const path = paths.find((p) => fs.existsSync(p));
  if (!path) {
    console.warn(`No image found at any of: ${paths.join(", ")}`);
    return false;
  }
  try {
    const buf = fs.readFileSync(path);
    const isPng = buf[0] === 0x89 && buf[1] === 0x50;
    const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
    const fmt = isPng ? "PNG" : isJpg ? "JPEG" : null;
    if (!fmt) {
      console.warn(`Unsupported image format at ${path}; skipping`);
      return false;
    }
    const mime = isPng ? "image/png" : "image/jpeg";
    const imgData = buf.toString("base64");
    const imgWidth = contentWidth;
    const imgHeight = imgWidth * heightRatio;
    if (y + imgHeight + 18 > pageHeight - margin) { doc.addPage(); y = margin; }
    doc.addImage(`data:${mime};base64,${imgData}`, fmt, margin, y, imgWidth, imgHeight);
    y += imgHeight + 8;
    if (captionText) {
      doc.setTextColor(140, 140, 140);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(captionText, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 11 + 8;
    }
    console.log(`Embedded image (${fmt}) from ${path} — ${(buf.length / 1024).toFixed(0)} KB`);
    return true;
  } catch (e) {
    console.warn(`Could not embed image ${path}: ${e.message}`);
    return false;
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
doc.text("May 1, 2026", pageWidth - margin - 60, 58);

y = 110;

// ===== TITLE =====
addText("RDDT (Reddit, Inc.)", { size: 18, bold: true, color: [20, 20, 20] });
addText("VWAP Reclaim → Flag Break Add → Profit at PMH (Winning Trade)", { size: 12, color: [100, 100, 100] });
addSpace(15);
addLine();
addSpace(5);

// ===== MAIN CHART =====
embedImage(
  [
    "/Users/junaidpasha/Desktop/proceduralMemory/rddt-pm.jpg",
    "/Users/junaidpasha/Desktop/proceduralMemory/rddt_chart.jpg",
    "/Users/junaidpasha/Downloads/rddt_chart.png",
    "/Users/junaidpasha/Downloads/rddt_chart.jpg",
  ],
  "RDDT — 15m chart (left) and 5m chart (right). Numbered annotations: 1) PMH, 2) 15-min ORB, 3) Initial entry on VWAP reclaim, 4) Stop level, 5) Add on flag break, 6) Sold at PMH touch (target), 7) Hard stop reference."
);

addSpace(8);

// ===== SETUP CONTEXT =====
addText("SETUP CONTEXT", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(5);
addText("RDDT was strong this morning — flagged in the pre-market analysis. Preparation paid off: I knew the levels going in. The plan was a classic intraday continuation — let the 15-min ORB form, watch how price interacts with VWAP, and only enter on a reclaim with a tight, well-defined stop. The trade unfolded cleanly: VWAP reclaim, ORB defense, flag break for the add, PMH for the exit. Multiple confluences, multiple decision points, and disciplined execution at every step.", { size: 10, color: [70, 70, 70] });
addSpace(15);

// ===== KEY LEVELS / ANNOTATIONS =====
addText("CHART ANNOTATIONS — Walk Through The Trade", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const levels = [
  ["1", "Pre-Market High (PMH) — $172.87", "The high made during pre-market trading. The most-watched level on a strong-stock day. Acts as both target and resistance until reclaimed and held."],
  ["2", "15-Min Opening Range Breakout (ORB)", "First 15 minutes of regular hours marked. The ORB high and low define the playing field. Reclaim of ORB high after a pullback is a continuation signal."],
  ["3", "Initial Entry — VWAP Reclaim (Small Position)", "Price pulled back, found buyers, and reclaimed VWAP. Entered with a small position. Stop set at the Low of the Day (which lined up nearly with the 15-min ORB low — clean structural stop)."],
  ["4", "Hard Stop — Below LOD / 15-min ORB", "If price had failed VWAP and broken back below the morning low, the setup would be invalid. Exit immediately, no questions asked."],
  ["5", "Add — Buyers Defending ORB, Flag Break", "Price formed a tight bull flag above ORB. Buyers held the level on every retest. Flag break = clean continuation signal — added more size with confidence."],
  ["6", "Target Hit — Sold All on PMH Touch", "Price ran up to PMH and rejected. Pre-defined exit fired — full sale into the move, locking in the win. Don't fight a pre-defined target."],
  ["7", "Reference Stop / Defensive Floor", "The hard structural stop below intraday support. Useful even after exit — confirms the trade thesis was valid throughout the move."],
];

levels.forEach(([num, label, desc]) => {
  if (y + 50 > pageHeight - margin) { doc.addPage(); y = margin; }
  doc.setFillColor(16, 185, 129);
  doc.circle(margin + 10, y + 4, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(num, num.length > 1 ? margin + 5 : margin + 7, y + 7);
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
  "AMATEUR MISTAKE: Buying the morning gap, panic-selling the dip",
  "An amateur sees RDDT gapping up, chases at the open, gets shaken out on the inevitable pullback to VWAP, and then watches the rest of the move from the sidelines. They size too big on first entry, leave no powder for the actual setup, and let emotions drive every decision.",
  [239, 68, 68]
);

addBox(
  "PROFESSIONAL APPROACH: Plan the levels before market opens, scale into strength",
  "Pre-market analysis identified RDDT as strong. The 15-min ORB and VWAP were the key levels. Initial entry was small at VWAP reclaim. Add was on flag break (price proving the thesis). Exit was at PMH (pre-defined target). Three decisions, all pre-meditated. No emotion needed.",
  [16, 185, 129]
);

// ===== ENTRY CRITERIA =====
addText("ENTRY CRITERIA — Multi-Confluence Checklist (What I Used)", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const criteria = [
  "RDDT identified as strong in pre-market analysis (homework done)",
  "First 15 minutes complete — ORB high and low marked",
  "Pullback finds buyers at VWAP (not breaks through it)",
  "5-min candle reclaims VWAP with conviction",
  "Stop placement is structural (LOD / ORB low) — not arbitrary",
  "Position size graduated: small initial, add on flag break confirmation",
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

// ===== INTRADAY ACTION =====
if (y + 100 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("INTRADAY ACTION (5-Minute Chart)", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const actions = [
  ["Pre-Market Analysis Identifies RDDT", "Sent analysis this morning — RDDT flagged as strong. Levels marked: PMH at 172.87, support / resistance zones noted. Walking into the open with a plan."],
  ["Open Pullback to VWAP", "Stock gives back early gains and pulls into VWAP. Sellers test buyer commitment. This is the decision point — does demand show up?"],
  ["VWAP Reclaim — Initial Entry", "Buyers step in. 5-min reclaims VWAP. Entered small, stop set at Low of Day (which lines up with the 15-min ORB low — structural, not arbitrary)."],
  ["ORB Defense, Flag Forms", "Price holds above the ORB high. A tight bull flag forms — sellers can't push it lower. Each retest fails with smaller candles. Buyers in control."],
  ["Flag Break — Add More", "Flag breaks to the upside on increasing volume. Added size here. The thesis has now been confirmed — small initial position turned into a real position."],
  ["Move Stops to Break-Even", "Once the trade is up and the next leg is in motion, trail stops to entry. Now the worst case is a flat trade — that's a free option on more upside."],
  ["PMH Touch — Sold All", "Price runs to PMH at 172.87 and rejects. Pre-defined target hit. Full exit. Don't get greedy with pre-defined targets — banking the W is the discipline."],
];

actions.forEach(([label, desc], i) => {
  if (y + 50 > pageHeight - margin) { doc.addPage(); y = margin; }
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, contentWidth, 50, 4, 4, "F");
  doc.setTextColor(16, 185, 129);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`${i + 1}.`, margin + 12, y + 18);
  doc.setTextColor(20, 20, 20);
  doc.text(label, margin + 30, y + 18);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(desc, contentWidth - 40);
  doc.text(lines, margin + 30, y + 33);
  y += 60;
});

addSpace(10);

// ===== KEY CONCEPT — SCALING IN =====
if (y + 120 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("KEY CONCEPT — Scaling In As The Trade Proves Itself", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);
addText("Most amateurs front-load size on entry one and have no powder left when the real signal fires. The pro approach: small initial, add on confirmation, exit at target.", { size: 10, color: [70, 70, 70] });
addSpace(8);

addBox(
  "Initial Entry — Smallest Size, Tightest Risk",
  "VWAP reclaim is a probabilistic edge, not a certainty. Sized small so a stop-out is small. The first entry is just to be in the trade — not to make the trade.",
  [59, 130, 246]
);

addBox(
  "The Add — Where Real Money Gets Made",
  "Flag break on top of ORB defense is a much higher-conviction setup than the initial VWAP reclaim. This is the entry to lean on. Stop tightens, size adds, R:R accelerates.",
  [16, 185, 129]
);

addBox(
  "Move To Break-Even — Then Let It Work",
  "Once the trade is in profit and the next leg confirms, move stop to entry. Now you can't lose. Free option on the rest of the move. This is how losers stay small and winners run.",
  [16, 185, 129]
);

// ===== RISK MANAGEMENT =====
if (y + 120 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("RISK MANAGEMENT", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

addBox(
  "Position Sizing",
  "Graduated entry: small on initial VWAP reclaim, add on flag break. The total position size matched the conviction of the setup at each step. Bigger size required bigger confirmation.",
  [59, 130, 246]
);

addBox(
  "Stop Loss",
  "Initial stop: Low of the Day, which aligned with the 15-min ORB low. Structural, not arbitrary. After the flag break, stops moved to entry (break-even). Once in profit, downside was zero.",
  [239, 68, 68]
);

addBox(
  "Profit Target",
  "PMH at 172.87 was the pre-defined target — that's where price would meet the most overhead resistance. Sold all on touch. Don't fight your own plan; targets are targets for a reason.",
  [16, 185, 129]
);

// ===== TRADE PLAN SUMMARY =====
if (y + 220 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("TRADE PLAN SUMMARY", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const summary = [
  ["Setup", "VWAP Reclaim + ORB Defense + Flag Break Add"],
  ["Direction", "Long (Strong stock, identified pre-market)"],
  ["Initial Entry", "5-min VWAP reclaim — small position"],
  ["Initial Stop", "Low of Day / 15-min ORB low"],
  ["Add Trigger", "Flag break on top of 15-min ORB"],
  ["Stop After Add", "Move to break-even"],
  ["Target", "PMH ($172.87)"],
  ["Exit", "Sold all on PMH touch"],
  ["Result", "WIN — full target hit"],
  ["Discipline", "Plan made pre-market, executed step by step"],
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
  "Pre-market homework is the entire edge. Knowing RDDT was strong before the open meant the plan was already written by 9:30.",
  "Be in strong stocks — RDDT was a leader. Strong stocks are where the cleanest setups appear.",
  "Initial entry is just to BE in the trade. Real size goes in on confirmation (the flag break, not the VWAP reclaim).",
  "Structural stops beat arbitrary stops. LOD + 15-min ORB low align — that's a real level, not a number on the screen.",
  "Move stops to break-even after the trade proves itself. Free options on the rest of the move.",
  "Pre-defined targets exist for a reason. PMH was the target, PMH got the exit. No greed, no negotiation.",
  "Scaling in is professional. Front-loading size is amateur. Sizing matches conviction at each step.",
  "Wins like this come from preparation + patience + execution. Skip any one of those and the trade falls apart.",
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

// Save
const outPath = "/Users/junaidpasha/Downloads/RDDT_Trade_Plan_Mezan.pdf";
fs.writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
console.log("PDF saved to:", outPath);
