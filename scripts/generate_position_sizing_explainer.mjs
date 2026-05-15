// Position Sizing Explainer — Mezan Research
// Teaches what every field on the position size calculator means, using SNDK
// as the worked example.
//
// Run:  node scripts/generate_position_sizing_explainer.mjs
// Out:  /Users/junaidpasha/Downloads/tradeplans/Position_Sizing_Explainer_SNDK.pdf

import { jsPDF } from "jspdf";
import fs from "fs";

const doc = new jsPDF({ unit: "pt", format: "letter" });
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 50;
const contentWidth = pageWidth - margin * 2;
let y = margin;

// ─── SNDK example ────────────────────────────────────────────────────────────
const ACCOUNT = 10000;
const RISK_PCT = 2;
const ENTRY = 702.0;
const STOP = 659.0;

const RISK_DOLLARS = ACCOUNT * (RISK_PCT / 100);
const STOP_DISTANCE = Math.abs(ENTRY - STOP);
const STOP_PCT = (STOP_DISTANCE / ENTRY) * 100;
const SHARES_RAW = RISK_DOLLARS / STOP_DISTANCE;
const SHARES = Math.floor(SHARES_RAW);
const POSITION_SIZE = SHARES * ENTRY;
const POSITION_PCT = (POSITION_SIZE / ACCOUNT) * 100;
const ACTUAL_LOSS = SHARES * STOP_DISTANCE;

const fmt$ = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt$0 = (n) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const fmtPct = (n) => `${n.toFixed(1)}%`;

// ─── Helpers ────────────────────────────────────────────────────────────────
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
const addPageIfNeeded = (h) => {
  if (y + h > pageHeight - margin) { doc.addPage(); y = margin; }
};

// Field card: bold field name on accent stripe + plain explanation + value
const fieldCard = (fieldName, explanation, valueExample, accent = [16, 185, 129]) => {
  addPageIfNeeded(95);
  // Accent stripe on left
  doc.setFillColor(...accent);
  doc.rect(margin, y, 4, 80, "F");
  // Field name
  doc.setTextColor(...accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(fieldName, margin + 14, y + 16);
  // Explanation
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(explanation, contentWidth - 16);
  doc.text(lines, margin + 14, y + 34);
  // Value (SNDK example)
  const valueY = y + 34 + lines.length * 13 + 6;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`SNDK example  →  ${valueExample}`, margin + 14, valueY);
  y += Math.max(80, lines.length * 13 + 60);
  addSpace(8);
};

// ─── HEADER ─────────────────────────────────────────────────────────────────
doc.setFillColor(6, 10, 16);
doc.rect(0, 0, pageWidth, 80, "F");
doc.setTextColor(255, 255, 255);
doc.setFont("helvetica", "bold");
doc.setFontSize(22);
doc.text("Mezan Research", margin, 40);
doc.setFontSize(10);
doc.setTextColor(16, 185, 129);
doc.text("Position Sizing Explainer", margin, 58);
doc.setTextColor(160, 160, 160);
doc.text("May 10, 2026", pageWidth - margin - 60, 58);

y = 110;

// ─── TITLE ──────────────────────────────────────────────────────────────────
addText("Understanding Position Sizing", { size: 20, bold: true, color: [20, 20, 20] });
addText("A field-by-field walkthrough using SNDK as the worked example", { size: 12, color: [100, 100, 100] });
addSpace(12);
addLine();
addSpace(4);

// ─── INTRO ──────────────────────────────────────────────────────────────────
addText("Why position sizing matters more than entries", { size: 12, bold: true, color: [16, 185, 129] });
addSpace(4);
addText(
  "Most retail traders blow up not because their entries are wrong but because they size positions on conviction instead of risk. Two traders can take the exact same trade — same ticker, same entry, same stop — and end up with completely different outcomes. The difference is position size.\n\nThis guide walks through every input and every output of the Mezan Position Size Calculator using SNDK at $702 with a stop at $659 as the example.",
  { size: 10, color: [70, 70, 70] }
);
addSpace(15);

// ─── THE SNDK SETUP AT A GLANCE ─────────────────────────────────────────────
addPageIfNeeded(220);
addText("THE SNDK SETUP AT A GLANCE", { size: 11, bold: true, color: [16, 185, 129] });
addSpace(8);

const setupRows = [
  ["Account Size", fmt$0(ACCOUNT)],
  ["Risk Per Trade", `${RISK_PCT}% of account`],
  ["Entry Price", fmt$(ENTRY)],
  ["Stop Loss Price", fmt$(STOP)],
  ["Direction", "LONG (stop is below entry)"],
];
setupRows.forEach(([label, value]) => {
  if (y + 22 > pageHeight - margin) { doc.addPage(); y = margin; }
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, contentWidth, 22, "F");
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(label, margin + 12, y + 14);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.text(value, margin + 220, y + 14);
  y += 24;
});
addSpace(15);

// ─── INPUT FIELDS ───────────────────────────────────────────────────────────
addPageIfNeeded(40);
addText("THE INPUTS — what you give the calculator", { size: 13, bold: true, color: [16, 185, 129] });
addSpace(8);

fieldCard(
  "Account Size",
  "Your total trading capital. NOT your net worth. NOT your total brokerage balance. ONLY the dollars you've allocated to this trading strategy and are mentally prepared to put at risk. If you trade a $10K account but your real net worth is $200K, your account size for sizing purposes is $10K.",
  fmt$0(ACCOUNT),
);

fieldCard(
  "Risk Per Trade (%)",
  "The percentage of your account you're willing to lose if the trade hits its stop. This is the most important number in trading. 1% is conservative. 2% is the textbook standard. 2.5% is aggressive but survivable. 5% is asking to blow up — four consecutive losses puts you down 19%, the kind of drawdown that ends careers.",
  `${RISK_PCT}% — meaning ${fmt$0(RISK_DOLLARS)} max loss per trade`,
);

fieldCard(
  "Entry Price",
  "The price at which you intend to buy (long) or sell short. This is the trigger — the level where your thesis becomes valid. Don't average down into worse entries; pick one and execute.",
  fmt$(ENTRY),
);

fieldCard(
  "Stop Loss Price",
  "The price at which you exit if the trade goes against you. The stop should be at a level where the original thesis is invalidated — below structural support, below a key moving average, below a swing low. NOT a random percentage. The stop is the thesis. If price hits it, you were wrong. Get out.",
  fmt$(STOP),
);

fieldCard(
  "Target Price (optional)",
  "Where you take profit. Adding this turns the calculator into a reward-to-risk gauge — it tells you whether the trade is even worth taking before you click buy. A 1:2 R:R or better is the minimum standard. Below 1:1 means you're risking more than you can possibly make.",
  "Skip for this example — covered in the R:R Calculator",
  [120, 120, 120],
);

// ─── OUTPUT FIELDS ──────────────────────────────────────────────────────────
addPageIfNeeded(40);
addText("THE OUTPUTS — what the calculator tells you", { size: 13, bold: true, color: [16, 185, 129] });
addSpace(8);

fieldCard(
  "Stop Distance",
  "The dollar amount per share between your entry and your stop. This is your per-share risk. It's the variable that determines how many shares you can buy — wider stops mean fewer shares, tighter stops mean more shares.",
  `${fmt$(ENTRY)} − ${fmt$(STOP)} = ${fmt$(STOP_DISTANCE)} per share  (${fmtPct(STOP_PCT)} of entry)`,
);

fieldCard(
  "Risk Dollars",
  "The total dollars you're willing to lose on this single trade. Calculated as Account Size × Risk %. This is the cap. The calculator's job is to find the share count that exactly matches this number when the stop is hit.",
  `${fmt$0(ACCOUNT)} × ${RISK_PCT}% = ${fmt$0(RISK_DOLLARS)}`,
);

fieldCard(
  "Buy This Many Shares (the headline)",
  "The exact share count where, if the stop is hit, your loss equals (or is just below) your risk budget. Calculated as Risk Dollars ÷ Stop Distance, then rounded DOWN — never up — because rounding up would mean accepting more risk than you signed up for.",
  `${fmt$0(RISK_DOLLARS)} ÷ ${fmt$(STOP_DISTANCE)} = ${SHARES_RAW.toFixed(2)} → rounded down to ${SHARES} shares`,
);

fieldCard(
  "Position Size ($)",
  "The total dollar value of the trade — Shares × Entry Price. Notice this can be much larger than your risk dollars. Your $200 of risk on SNDK lets you control a $2,808 position. That's not leverage; it's just math. The risk is still capped at $200 because the stop is only $43 below entry.",
  `${SHARES} shares × ${fmt$(ENTRY)} = ${fmt$0(POSITION_SIZE)}`,
);

fieldCard(
  "Position as % of Account (the watchdog)",
  "Position Size ÷ Account Size. This number tells you how concentrated this single trade is in your overall portfolio. Under 25% is normal. 25-100% is heavy concentration — only acceptable for high-conviction setups. Over 100% means the trade is too big for your account and would require margin to execute.",
  `${fmt$0(POSITION_SIZE)} ÷ ${fmt$0(ACCOUNT)} = ${fmtPct(POSITION_PCT)}  (heavy concentration)`,
  [245, 158, 11],
);

fieldCard(
  "If Stopped Out (the gut check)",
  "The actual dollar loss if your stop is triggered — Shares × Stop Distance. This should be at or just under your Risk Dollars number. If you can't stomach this number, your risk % is too high; lower it before you click buy. The whole point of the calculator is to make this number visible BEFORE the trade, not after.",
  `${SHARES} shares × ${fmt$(STOP_DISTANCE)} = ${fmt$0(ACTUAL_LOSS)}  (vs ${fmt$0(RISK_DOLLARS)} budget — the rounding-down absorbed ${fmt$0(RISK_DOLLARS - ACTUAL_LOSS)})`,
  [239, 68, 68],
);

// ─── THE FULL MATH WALKTHROUGH ──────────────────────────────────────────────
addPageIfNeeded(40);
addText("THE FULL MATH — start to finish", { size: 13, bold: true, color: [16, 185, 129] });
addSpace(8);

const mathSteps = [
  ["1.  Risk Dollars", `Account × Risk%   =   ${fmt$0(ACCOUNT)} × ${RISK_PCT}%   =   ${fmt$0(RISK_DOLLARS)}`],
  ["2.  Stop Distance", `| Entry − Stop |   =   | ${fmt$(ENTRY)} − ${fmt$(STOP)} |   =   ${fmt$(STOP_DISTANCE)}`],
  ["3.  Shares (raw)", `Risk Dollars ÷ Stop Distance   =   ${fmt$0(RISK_DOLLARS)} ÷ ${fmt$(STOP_DISTANCE)}   =   ${SHARES_RAW.toFixed(4)}`],
  ["4.  Shares (final)", `floor(${SHARES_RAW.toFixed(4)})   =   ${SHARES}    ← always round DOWN`],
  ["5.  Position Size", `Shares × Entry   =   ${SHARES} × ${fmt$(ENTRY)}   =   ${fmt$0(POSITION_SIZE)}`],
  ["6.  % of Account", `Position ÷ Account   =   ${fmt$0(POSITION_SIZE)} ÷ ${fmt$0(ACCOUNT)}   =   ${fmtPct(POSITION_PCT)}`],
  ["7.  Actual Max Loss", `Shares × Stop Distance   =   ${SHARES} × ${fmt$(STOP_DISTANCE)}   =   ${fmt$0(ACTUAL_LOSS)}`],
];
mathSteps.forEach(([label, line]) => {
  addPageIfNeeded(28);
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 26, "F");
  doc.setTextColor(16, 185, 129);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(label, margin + 12, y + 11);
  doc.setTextColor(60, 60, 60);
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.text(line, margin + 12, y + 22);
  y += 30;
});
addSpace(15);

// ─── KEY TAKEAWAYS ──────────────────────────────────────────────────────────
addPageIfNeeded(40);
addText("KEY TAKEAWAYS", { size: 13, bold: true, color: [16, 185, 129] });
addSpace(8);

const takeaways = [
  "Risk is fixed before the trade — not negotiated during. The calculator's job is to translate your risk tolerance into a share count.",
  "Wider stops mean smaller positions. SNDK's $43 stop only allowed 4 shares — a tight $2 stop would have allowed 100 shares.",
  "Position size and risk are different things. A $2,808 SNDK position with a $172 max loss is a small risk on a big position.",
  "Always round shares DOWN. Rounding up means quietly accepting more risk than your plan allows.",
  "If the % of Account number alarms you, lower the risk %. Don't just take the trade and hope.",
  "If you can't accept the 'If Stopped Out' number emotionally, you can't trade the position. Period.",
];
takeaways.forEach((t) => {
  addPageIfNeeded(20);
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

// ─── DISCLAIMER ─────────────────────────────────────────────────────────────
addPageIfNeeded(80);
addSpace(20);
addLine();
doc.setTextColor(150, 150, 150);
doc.setFont("helvetica", "italic");
doc.setFontSize(8);
const disclaimer = "DISCLAIMER: Mezan Research is for educational purposes only. This is not financial advice. The SNDK example uses hypothetical numbers for illustration. Trading involves substantial risk of loss. The position size calculator does not account for slippage, commissions, gap risk, or margin. Always do your own research and consult a licensed financial advisor before making investment decisions.";
const dlines = doc.splitTextToSize(disclaimer, contentWidth);
doc.text(dlines, margin, y);

// ─── FOOTER on each page ────────────────────────────────────────────────────
const totalPages = doc.internal.getNumberOfPages();
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Mezan Research  |  Page ${i} of ${totalPages}`, margin, pageHeight - 20);
  doc.text("mezaninvesting.com/tools", pageWidth - margin - 110, pageHeight - 20);
}

const outPath = "/Users/junaidpasha/Downloads/tradeplans/Position_Sizing_Explainer_SNDK.pdf";
fs.writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
console.log("PDF saved to:", outPath);
