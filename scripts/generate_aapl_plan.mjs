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
addText("AAPL (Apple Inc.)", { size: 18, bold: true, color: [20, 20, 20] });
addText("Post-Earnings ORB Long — Stopped at PMH Break (A Disciplined Loss)", { size: 12, color: [100, 100, 100] });
addSpace(15);
addLine();
addSpace(5);

// ===== MAIN CHART =====
embedImage(
  [
    "/Users/junaidpasha/Desktop/proceduralMemory/apple-pm.jpg",
    "/Users/junaidpasha/Downloads/aapl_chart.png",
    "/Users/junaidpasha/Downloads/aapl_chart.jpg",
    "/Users/junaidpasha/Downloads/aapl_chart.jpeg",
  ],
  "AAPL — 15m chart (left) and 5m chart (right). Numbered annotations: 1) PMH 287.21, 2) 15-min ORB, 3) Entry on handle break, 4) Caution candle, 5) Stop trigger when PMH broke and closed below."
);

addSpace(8);

// ===== SETUP CONTEXT =====
addText("SETUP CONTEXT", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(5);
addText("AAPL is a name I trade often and hold in my long-term account. Today's intraday rationale was clean: strong earnings, buyers interested, and price action confirming it pre-market. The plan was a 15-minute Opening Range Breakout long, taken on a 5-minute handle off the ORB high. The trade did not work — but the playbook around it did. This document walks through the entry, the warning signs that built up, the broader-market context (SPY weakness, VIX rising), and the disciplined exit. The core lesson: following your rules on a losing trade is itself the win.", { size: 10, color: [70, 70, 70] });
addSpace(15);

// ===== KEY LEVELS / ANNOTATIONS =====
addText("CHART ANNOTATIONS — What Each Number Means", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const levels = [
  ["1", "Premarket High (PMH) — $287.21", "The high during pre-market trading. The most important intraday level on a gap-up day. Reclaim and hold above = bulls in control. Break and close below = thesis invalidated."],
  ["2", "15-Min Opening Range Breakout (ORB)", "First 15 minutes of regular session marked. The ORB high becomes the key breakout-confirmation level. Patience here is the entire edge."],
  ["3", "Entry — Handle on ORB High (5-min)", "On the 5-min, price formed a tight handle above the ORB high. Entry was taken on the handle break — textbook continuation trigger after the ORB."],
  ["4", "Caution Candle — Should Have Exited", "A red 5-min candle with weak follow-through formed near 287. The caution candle is the market's first warning that buyers are losing momentum. In hindsight, full exit here was the right call."],
  ["5", "PMH Retest + Adds, Then Stop", "Price retested PMH and bounced; I added a few shares. Then SPY weakened and VIX began rising. PMH broke and a 5-min candle closed below it — full exit. Small loss. Rules followed."],
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

// ===== INTRADAY MARKET CONTEXT =====
if (y + 80 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("INTRADAY MARKET CONTEXT — Why The Tape Mattered", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);
addText("Even with a great individual setup, broader-market direction can override the trade. Today, two macro signals quietly turned against the long: SPY rolled over while VIX began rising. Both were visible in real time and both said 'be careful.'", { size: 10, color: [70, 70, 70] });
addSpace(8);

// Optional SPY + VIX context images
const hadSpy = embedImage(
  [
    "/Users/junaidpasha/Desktop/proceduralMemory/apple-spy-relaltionship.jpg",
    "/Users/junaidpasha/Downloads/aapl_spy_context.png",
    "/Users/junaidpasha/Downloads/spy_context.png",
    "/Users/junaidpasha/Downloads/aapl_spy_context.jpg",
  ],
  "SPY showing weakness — index losing buyers while AAPL was being held up.",
  0.85
);
const hadVix = embedImage(
  [
    "/Users/junaidpasha/Desktop/proceduralMemory/apple-vix-relationship.jpg",
    "/Users/junaidpasha/Downloads/aapl_vix_context.png",
    "/Users/junaidpasha/Downloads/vix_context.png",
    "/Users/junaidpasha/Downloads/aapl_vix_context.jpg",
  ],
  "VIX rising — fear bid coming back into the market. Headwind for any intraday long.",
  0.85
);

if (!hadSpy && !hadVix) {
  addText("(SPY and VIX context images optional — save as aapl_spy_context.png / aapl_vix_context.png in Downloads to embed.)", { size: 9, color: [150, 150, 150] });
  addSpace(6);
}

addSpace(10);

// ===== AMATEUR VS PROFESSIONAL =====
addBox(
  "AMATEUR MISTAKE: Ignoring the caution candle and the tape",
  "An amateur stays anchored to the original thesis: 'good earnings, buyers were interested.' They ignore the caution candle on the chart, ignore SPY rolling over, ignore VIX turning up. They average down at PMH retest hoping for a bounce, get caught when PMH fails, and freeze. By the time they exit, the small loss has become a real one.",
  [239, 68, 68]
);

addBox(
  "PROFESSIONAL APPROACH: Pre-defined stop, follow it without negotiation",
  "The rule was set before the trade: PMH break with a 5-min close below = full exit. When it triggered, the exit happened. No hoping, no averaging into a failing setup. The caution candle was a warning to tighten — the next leg invalidated the thesis, so the position closed for a small, controlled loss.",
  [16, 185, 129]
);

// ===== ENTRY CRITERIA =====
addText("ENTRY CRITERIA — Multi-Confluence Checklist (What I Used)", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const criteria = [
  "Earnings catalyst + buyer interest visible in pre-market",
  "Price held above the Premarket High in the open",
  "First 15 minutes of regular hours completed (ORB high marked)",
  "5-minute handle / consolidation on top of ORB high (continuation pattern)",
  "Entry on the handle break with stop pre-defined at PMH",
  "Broader market (SPY) constructive at the time of entry",
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
  ["Open Run → Pre-Market High", "Earnings tailwind carried price up to the PMH at 287.21. This was the level the trade was built around."],
  ["15-Min ORB Established", "First 15 minutes finished. ORB high marked. Patience pays — wait for the handle, do not chase the candle."],
  ["Handle Break → Long Entry", "5-min showed a clean handle on top of the ORB high. Entry taken on the break, stop pre-set at PMH."],
  ["Caution Candle Prints", "Red 5-min candle with weak body / wick rejection at 287+. First sign that buyers are losing the next leg. Tighten stops or trim here."],
  ["PMH Retest → Added Shares", "Price came back to PMH and bounced. I added a few shares. In hindsight: with SPY rolling and VIX rising, this add was wrong — adding to a position fighting the tape."],
  ["SPY Weakens, VIX Rising", "Macro context turned. SPY printed weakness, VIX broke higher. Headwind for any intraday long — exit watch active."],
  ["PMH Break + Close Below → Full Exit", "The pre-defined trigger fired. 5-min candle closed below PMH. Full exit, small loss. Rule executed without hesitation. Game of probabilities."],
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

// ===== WHAT I'D DO DIFFERENTLY =====
if (y + 120 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("WHAT I'D DO DIFFERENTLY (Honest Self-Review)", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

addBox(
  "The Caution Candle Was a Real Signal — Not Noise",
  "When the caution candle printed at 287+, the right move was to scale out 50% and tighten stop, not to wait for the PMH break. Acting on early warnings means exiting near the top of the move instead of giving back through the level.",
  [59, 130, 246]
);

addBox(
  "Don't Add to a Position Fighting the Tape",
  "Adding on the PMH retest felt natural — the level held. But SPY had already started weakening and VIX was turning up. A re-entry adding new size requires fresh confluence, not just a hold of the original level. New size needs new conviction.",
  [239, 68, 68]
);

// ===== RISK MANAGEMENT =====
if (y + 120 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("RISK MANAGEMENT", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

addBox(
  "Position Sizing",
  "Intraday AAPL trade is sized separately from the long-term core position. Treat them as two different accounts. Today's intraday trade was within risk budget — small loss did not affect the long-term thesis or holding.",
  [59, 130, 246]
);

addBox(
  "Stop Loss",
  "Pre-defined: PMH break with a 5-min close below. Non-negotiable. The stop fired, the exit happened. No averaging down past the stop, no 'just one more candle' hopium.",
  [239, 68, 68]
);

addBox(
  "Profit Targets (Had It Worked)",
  "First trim at the day's prior high if PMH held as support. Trail the rest with 5-min higher-lows. Final exit on a structure break, on a VIX spike, or into a relative-strength fade vs SPY — whichever fired first.",
  [16, 185, 129]
);

// ===== TRADE PLAN SUMMARY =====
if (y + 200 > pageHeight - margin) { doc.addPage(); y = margin; }
addText("TRADE PLAN SUMMARY", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const summary = [
  ["Setup", "Post-Earnings 15-Min ORB + Handle Break"],
  ["Direction", "Long (Bullish bias on earnings)"],
  ["Entry Trigger", "5-min handle break on top of ORB high"],
  ["Initial Stop", "PMH ($287.21) — 5-min close below"],
  ["First Target", "Day's prior high (had it worked)"],
  ["Result", "Stopped at PMH break — small loss"],
  ["Macro Context", "SPY weakening, VIX rising — headwinds"],
  ["Discipline", "Rules followed — exit on trigger, no averaging past stop"],
  ["Long-term Position", "Untouched (separate account, separate thesis)"],
  ["Lesson", "Following the rules on a loser is the win"],
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
  "Trading is a game of probabilities. Not every trade wins. Following rules is the only edge that compounds.",
  "Caution candles are real signals — when one prints, scale and tighten. Don't wait for the level to break.",
  "Always check SPY and VIX before adding size. Macro headwinds neutralize even great single-name setups.",
  "Adding on a retest needs new confluence, not just the level holding. New size = new conviction.",
  "Pre-defining the stop before entry is the entire game. When it fires, you execute — no negotiation.",
  "Keep the long-term core separate from intraday trades. Different accounts, different rules, different psychology.",
  "A small disciplined loss is a 'win' — it preserves capital and confidence for the next setup.",
  "Reviewing the trade afterwards (like this document) is what turns experience into edge.",
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
const outPath = "/Users/junaidpasha/Downloads/AAPL_Trade_Plan_Mezan.pdf";
fs.writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
console.log("PDF saved to:", outPath);
