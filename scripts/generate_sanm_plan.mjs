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
doc.text("April 28, 2026", pageWidth - margin - 60, 58);

y = 110;

// ===== TITLE =====
addText("SANM (Sanmina Corporation)", { size: 18, bold: true, color: [20, 20, 20] });
addText("Post-Earnings Gap-Up — Day Trade Setup", { size: 12, color: [100, 100, 100] });
addSpace(15);
addLine();
addSpace(5);

// ===== SETUP CONTEXT =====
addText("SETUP CONTEXT", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(5);
addText("Sanmina (SANM) reported strong earnings yesterday, gapping up significantly in pre-market trading. The stock opened well above the previous day's range, creating a high-probability day trading opportunity if executed with discipline.", { size: 10, color: [70, 70, 70] });
addSpace(15);

// ===== KEY LEVELS IDENTIFIED =====
addText("KEY LEVELS IDENTIFIED (from chart)", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const levels = [
  ["1", "Pre-Market High (PMH)", "The high reached during pre-market trading. Acts as immediate resistance and a key reclaim level."],
  ["2", "Pre-Market Low (PML)", "The low of pre-market session. Important support and intraday risk reference."],
  ["3", "Previous Day High (PDH)", "Yesterday's session high. Now flipped to support after gap-up — bullish if held."],
  ["4", "Previous Day Low (PDL)", "Yesterday's session low at $183.23. Major support if pullback occurs."],
  ["5", "Key Observation: Hammer Candle", "15 minutes before market open, a hammer candle formed — buyers stepped in aggressively. This signals demand."],
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
  "AMATEUR MISTAKE: Entering at the open",
  "Inexperienced traders chase the first 5-minute candle, often buying right at the top of the gap. They get trapped when sellers come in and price retraces aggressively. Most gap-ups see initial sell pressure as overnight holders take profits.",
  [239, 68, 68]
);

addBox(
  "PROFESSIONAL APPROACH: Wait for the 15-minute confirmation",
  "Wait for the first 15 minutes to complete on the 5-minute chart. This filters out noise and lets the true intraday trend emerge. Only enter if multiple confluences align.",
  [16, 185, 129]
);

// ===== ENTRY CRITERIA =====
addText("ENTRY CRITERIA — Multi-Confluence Checklist", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const criteria = [
  "Price trading above the Pre-Market High after the first 15 minutes",
  "5-minute candle closes back above VWAP (reclaim signal)",
  "SPY and QQQ are showing strength or holding key levels",
  "No major macro headwinds (FOMC announcements, geopolitical events)",
  "Volume is supporting the move — not dying off",
  "Stock holding above a key moving average (VWAP, 50 EMA, or 200 EMA)",
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
  ["Sellers Push Down", "After the gap-up open, sellers stepped in aggressively. Price gave back early gains. This is normal — overnight holders take profits."],
  ["200 EMA Holds (Low of Day)", "Price found support at the 200 EMA, which became the Low of Day. This is a strong technical level — buyers defended it."],
  ["Consolidation Above LOD", "Price is now consolidating tightly. This is healthy — sellers exhausted, buyers absorbing supply."],
  ["The Waiting Game", "If SPY shows strength and SANM reclaims VWAP, this becomes the entry trigger. Patience is the edge."],
];

actions.forEach(([label, desc], i) => {
  if (y + 50 > pageHeight - margin) { doc.addPage(); y = margin; }
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, contentWidth, 50, 4, 4, "F");
  doc.setTextColor(16, 185, 129);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`${i + 3}.`, margin + 12, y + 18);
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

// ===== RISK MANAGEMENT =====
if (y + 120 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("RISK MANAGEMENT", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

addBox(
  "Position Sizing",
  "In choppy or uncertain markets, reduce size. Instead of 100 shares, trade 50. This keeps emotions in check and lets you stay objective. The market will give you many chances — survival is the only goal.",
  [59, 130, 246]
);

addBox(
  "Stop Loss",
  "Place stop at the Low of the Day (LOD). If price breaks below LOD, the setup is invalidated. Exit immediately, no questions asked. Stop placement is non-negotiable.",
  [239, 68, 68]
);

addBox(
  "Profit Targets",
  "First Target: Pre-Market High reclaim. Take 50% off. Move stop to break-even. Let the rest ride toward the 230.56 level (yesterday's high before pullback) for the home run.",
  [16, 185, 129]
);

// ===== TRADE PLAN SUMMARY =====
if (y + 160 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("TRADE PLAN SUMMARY", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const summary = [
  ["Setup", "Post-Earnings Gap-Up + VWAP Reclaim"],
  ["Direction", "Long (Bullish bias)"],
  ["Entry Trigger", "5-min candle closes above VWAP with SPY confirming"],
  ["Stop Loss", "Below Low of Day (LOD)"],
  ["First Target", "Pre-Market High"],
  ["Second Target", "Previous swing high (~$230.56)"],
  ["Risk:Reward", "Aim for at least 1:2"],
  ["Position Size", "Reduced (50% of normal) due to mixed market context"],
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
  "Patience over impulse: The first 15 minutes are amateur hour — let it play out.",
  "Confluences win: Multiple aligned signals (VWAP + PMH + market strength) > single signals.",
  "Context matters: SPY/QQQ direction can override even great individual setups.",
  "Risk management is the edge: Smaller size + tight stops = long-term survival.",
  "Hammer candles before open signal demand — note them, but don't rush in.",
  "If you're early and amateurs got trapped — you're now the smart money providing liquidity.",
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
const outPath = "/Users/junaidpasha/Downloads/SANM_Trade_Plan_Mezan.pdf";
fs.writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
console.log("PDF saved to:", outPath);
