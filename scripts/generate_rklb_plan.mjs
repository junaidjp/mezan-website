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
doc.text("April 30, 2026", pageWidth - margin - 60, 58);

y = 110;

// ===== TITLE =====
addText("RKLB (Rocket Lab USA, Inc.)", { size: 18, bold: true, color: [20, 20, 20] });
addText("15-Minute Opening Range Breakout — VWAP Reclaim", { size: 12, color: [100, 100, 100] });
addSpace(15);
addLine();
addSpace(5);

// ===== CHART IMAGE =====
// Look for the chart in a few common spots; detect format from magic bytes.
const candidatePaths = [
  "/Users/junaidpasha/Downloads/rklb_chart.png",
  "/Users/junaidpasha/Downloads/rklb_chart.jpg",
  "/Users/junaidpasha/Downloads/rklb_chart.jpeg",
];
const chartPath = candidatePaths.find((p) => fs.existsSync(p));

if (chartPath) {
  try {
    const buf = fs.readFileSync(chartPath);
    // Magic bytes — PNG starts with 89 50, JPEG starts with FF D8.
    const isPng = buf[0] === 0x89 && buf[1] === 0x50;
    const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
    const fmt = isPng ? "PNG" : isJpg ? "JPEG" : null;
    if (!fmt) {
      console.warn(`Unsupported image format at ${chartPath}; skipping`);
    } else {
      const mime = isPng ? "image/png" : "image/jpeg";
      const imgData = buf.toString("base64");
      const imgWidth = contentWidth;
      const imgHeight = imgWidth * 0.5; // chart aspect ratio ~2:1
      if (y + imgHeight > pageHeight - margin) { doc.addPage(); y = margin; }
      doc.addImage(`data:${mime};base64,${imgData}`, fmt, margin, y, imgWidth, imgHeight);
      y += imgHeight + 8;
      doc.setTextColor(140, 140, 140);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("RKLB — 15m chart (left) and 5m chart (right). Note ORB high at $82.82 and VWAP at $81.13.", margin, y);
      y += 18;
      console.log(`Embedded chart (${fmt}) from ${chartPath} — ${(buf.length / 1024).toFixed(0)} KB`);
    }
  } catch (e) {
    console.warn("Could not embed chart image:", e.message);
  }
} else {
  console.warn("No chart found at any of:", candidatePaths.join(", "));
  console.warn("PDF will be generated without image");
}

addSpace(8);

// ===== SETUP CONTEXT =====
addText("SETUP CONTEXT", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(5);
addText("Be in strong stocks making strong moves. Preparation every night and before the open is the edge. While the broader market sold off and Tech traded weak, sector strength rotated into LLY and Space names — RKLB was a clear leader. RKLB printed a large opening candle. Amateurs chased the open and got stopped on the inevitable retrace. The disciplined trader waited for the 15-minute Opening Range Breakout (ORB), watched the 5-minute pullback to VWAP, and only entered when buyers stepped back in and price closed above the ORB high.", { size: 10, color: [70, 70, 70] });
addSpace(15);

// ===== KEY LEVELS IDENTIFIED =====
addText("KEY LEVELS IDENTIFIED (from chart)", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const levels = [
  ["1", "15-Min ORB High ($82.82)", "The high made during the first 15 minutes of the regular session. The prime breakout-confirmation level — close above signals buyers are still in control."],
  ["2", "VWAP ($81.13)", "Volume-Weighted Average Price. The single most-watched intraday line. A successful retest and bounce off VWAP is a classic continuation signal in a trending stock."],
  ["3", "EMA 13 ($82.39) — Fast Trend", "Short-term momentum guide. Price riding above EMA 13 = trend intact, dip-buyers in control."],
  ["4", "EMA 48 ($81.63) — Mid Trend", "Pullback magnet during healthy uptrends. A retest here that holds is a high-quality re-entry zone."],
  ["5", "EMA 200 ($79.33) — Major Support", "The deep-pullback line. If price loses 200 EMA, the setup is broken — exit and reassess."],
  ["6", "Sector Context", "LLY running, Space sector strong, Tech weak — be in the running sectors. This is what justified leaning long on RKLB despite a weak tape."],
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
  "AMATEUR MISTAKE: Buying the opening candle",
  "Inexperienced traders see the big green opening candle and chase it. They buy right at the top of the first 5 minutes, get stopped out on the inevitable pullback, and watch the eventual breakout from the sidelines — angry. The opening candle is an information event, not a trade signal.",
  [239, 68, 68]
);

addBox(
  "PROFESSIONAL APPROACH: Wait for the 15-min ORB to complete, then watch the 5-min reaction",
  "Let the first 15 minutes finish. Mark the high and low. Drop to the 5-min and watch the retest behavior. A pullback to VWAP that holds, followed by a 5-min close back above the ORB high, is the buyer-interest signal. Enter there with stop just below the retest swing low.",
  [16, 185, 129]
);

// ===== ENTRY CRITERIA =====
addText("ENTRY CRITERIA — Multi-Confluence Checklist", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const criteria = [
  "First 15 minutes of regular hours have completed (ORB high and low marked)",
  "Pullback finds support at VWAP — not breaks through it",
  "5-minute candle closes back above the 15-min ORB high (buyer-interest confirmation)",
  "Stock is in a sector showing relative strength (LLY/Space here, not Tech)",
  "Volume on the reclaim candle is above the pullback's average volume",
  "Price holding above EMA 13 / EMA 48 — trend structure intact",
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
  ["Big Opening Candle", "Strong demand off the open as Space sector rotated bid. Amateurs chase here. Disciplined trader notes the candle but does not act."],
  ["Pullback to VWAP", "Price gives back early gains and tags VWAP at $81.13. Sellers test buyer commitment. This is the reveal — does demand show up?"],
  ["Bounce Off VWAP, Close Above ORB", "VWAP holds. Price reverses, prints higher candles, and closes back above the 15-min ORB high at $82.82. Buyers are still interested — this is the entry trigger."],
  ["Trail to Resistance, Watch Retests", "After entry, move stop to break-even on the next leg up. Watch how price interacts with overhead resistance — every retest tells you something about who's in control."],
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

// ===== EXIT THESIS — RESISTANCE / SUPPORT RETESTS =====
if (y + 120 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("EXIT THESIS — Reading Multiple Retests", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);
addText("Once you have a break-even stop, the question shifts from 'where do I get out if wrong' to 'where do I sell to lock in profit'. The number of times a level is tested is the tell.", { size: 10, color: [70, 70, 70] });
addSpace(8);

addBox(
  "RESISTANCE: Each retest weakens the level slightly… until it breaks",
  "First rejection: strong sellers defending. Second rejection: still defended, but on lower commitment. Third+ retest: sellers thinning out — the next attempt usually punches through. Don't sell into the third test — that's often where the breakout fires.",
  [59, 130, 246]
);

addBox(
  "SUPPORT: Same logic, inverted — multiple retests precede the failure",
  "First test holds: buyers stepping in. Second test holds: buyer commitment thinning. Third+ test: support is on borrowed time — the next break is usually the real one. If your stop is just below support and you've seen 3 tests, tighten it.",
  [239, 68, 68]
);

// ===== RISK MANAGEMENT =====
if (y + 120 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("RISK MANAGEMENT", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

addBox(
  "Position Sizing",
  "On a weak-tape day with sector rotation, lean smaller. Half-size on entry, add only after price proves itself by clearing the next intraday level. Survival before size.",
  [59, 130, 246]
);

addBox(
  "Stop Loss",
  "Initial stop: just below the VWAP retest low (the pullback swing low). If price loses VWAP and stays below, the setup is invalid. Move stop to break-even immediately after the next 5-min candle closes higher than your entry candle.",
  [239, 68, 68]
);

addBox(
  "Profit Targets",
  "First trim at the next visible overhead level (prior intraday high or pre-market high). Trail the rest with a 5-min higher-low structure. Exit fully when price prints a clean break-of-structure to the downside or fails the 4th retest of resistance.",
  [16, 185, 129]
);

// ===== TRADE PLAN SUMMARY =====
if (y + 200 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("TRADE PLAN SUMMARY", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const summary = [
  ["Setup", "15-min ORB Breakout + VWAP Reclaim"],
  ["Direction", "Long (Bullish bias — sector strength)"],
  ["Entry Trigger", "5-min close above $82.82 after VWAP hold"],
  ["Initial Stop", "Below the VWAP retest swing low"],
  ["Move to BE", "After next 5-min higher-close confirms"],
  ["First Target", "Next overhead resistance (intraday high)"],
  ["Trail Method", "5-min structure (higher lows)"],
  ["Risk:Reward", "Minimum 1:2"],
  ["Position Size", "Half-size on weak market tape"],
  ["Sector Context", "Long-friendly: Space + LLY strong; Tech avoided"],
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
  "Be in strong stocks making strong moves — sector rotation matters more than the index.",
  "The first 15 minutes is the warm-up, not the trade. Mark the ORB and wait.",
  "VWAP retest + reclaim above ORB high = buyers still interested. That's the entry, not the open.",
  "After break-even, your job changes — now you're managing the exit, not the loss.",
  "Each retest of resistance weakens it; each retest of support weakens it. Read who's tiring out.",
  "Don't sell into the third resistance test — that's frequently where the real breakout fires.",
  "Half-size on weak tape. The market gives many chances. Surviving each session is the only edge that compounds.",
  "Preparation the night before and pre-market homework is the unfair advantage. Most amateurs skip it.",
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
const outPath = "/Users/junaidpasha/Downloads/RKLB_Trade_Plan_Mezan.pdf";
fs.writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
console.log("PDF saved to:", outPath);
