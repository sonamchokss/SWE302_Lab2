/**
 * PDF generation for result transcripts and payment receipts (pdfkit).
 * Each function resolves with a Buffer containing the finished PDF.
 */
const PDFDocument = require("pdfkit");

const BRAND = "#1e3a8a";
const MUTED = "#6b7280";

function renderPdf(build) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    build(doc);
    doc.end();
  });
}

function drawHeader(doc, title) {
  doc.fillColor(BRAND).fontSize(18).font("Helvetica-Bold").text("CST Student Management System");
  doc.fillColor(MUTED).fontSize(10).font("Helvetica").text("College of Science and Technology");
  doc.moveDown(0.5);
  doc.strokeColor(BRAND).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);
  doc.fillColor("#111827").fontSize(15).font("Helvetica-Bold").text(title);
  doc.moveDown(0.8);
}

// Label in a fixed left column, value in a fixed right column, so rows always line up.
function drawField(doc, label, value) {
  const y = doc.y;
  doc.fillColor(MUTED).fontSize(10).font("Helvetica").text(label, 50, y, { width: 150 });
  doc.fillColor("#111827").font("Helvetica-Bold").text(String(value ?? "-"), 205, y, { width: 340 });
  doc.font("Helvetica");
  doc.moveDown(0.3);
}

function drawFooter(doc) {
  doc.fillColor(MUTED).fontSize(8).font("Helvetica")
    .text(`Generated ${new Date().toLocaleString("en-GB")}`, 50, 780, { align: "center", width: 495 });
}

function renderResultsPdf({ studentId, studentName, results }) {
  return renderPdf((doc) => {
    drawHeader(doc, "Academic Result Statement");
    drawField(doc, "Student ID:", studentId);
    drawField(doc, "Student name:", studentName);
    doc.moveDown(1);

    const cols = { code: 50, title: 150, grade: 470 };
    doc.fillColor("#ffffff").rect(50, doc.y, 495, 22).fill(BRAND);
    const headY = doc.y + 6;
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10)
      .text("Module code", cols.code + 6, headY)
      .text("Module title", cols.title, headY)
      .text("Grade", cols.grade, headY);
    doc.y = headY + 18;

    doc.font("Helvetica").fontSize(10);
    results.forEach((r, i) => {
      const y = doc.y + 6;
      if (i % 2 === 0) doc.fillColor("#f3f4f6").rect(50, doc.y, 495, 22).fill();
      doc.fillColor("#111827")
        .text(r.moduleCode, cols.code + 6, y)
        .text(r.moduleTitle, cols.title, y, { width: 300 })
        .font("Helvetica-Bold").text(r.grade, cols.grade, y).font("Helvetica");
      doc.y = y + 16;
    });

    doc.moveDown(2);
    doc.fillColor(MUTED).fontSize(9).text(`Total modules listed: ${results.length}`, 50, doc.y, { width: 495 });
    drawFooter(doc);
  });
}

function renderReceiptPdf({ payment, studentName }) {
  return renderPdf((doc) => {
    drawHeader(doc, "Tuition Payment Receipt");
    drawField(doc, "Receipt number:", payment.receiptNumber);
    drawField(doc, "Student ID:", payment.studentId);
    drawField(doc, "Student name:", studentName);
    drawField(doc, "Transaction number:", payment.transactionNumber);
    drawField(doc, "Date and time:", new Date(payment.createdAt).toLocaleString("en-GB"));
    drawField(doc, "Status:", "Verified");
    doc.moveDown(1.5);
    doc.fillColor(MUTED).fontSize(9)
      .text("This receipt confirms that the tuition payment above was submitted through the CST Student Management System.");
    drawFooter(doc);
  });
}

module.exports = { renderResultsPdf, renderReceiptPdf };
