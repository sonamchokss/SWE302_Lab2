/**
 * In-memory demo data for the CST SMS. Everything here resets when the server
 * restarts. Student records can additionally live in PostgreSQL (DATABASE_URL).
 */
const crypto = require("crypto");

const modules = [
  { moduleCode: "SWE301", moduleTitle: "Software Project Management", credits: 12 },
  { moduleCode: "SWE302", moduleTitle: "Software Testing & QA", credits: 12 },
  { moduleCode: "DBM301", moduleTitle: "Database Management", credits: 12 },
  { moduleCode: "NET301", moduleTitle: "Computer Networks", credits: 12 },
];

// studentId -> [moduleCode, ...]
const registeredModules = { "02230123": ["SWE302"] };

const results = [
  { studentId: "02230123", moduleCode: "SWE302", moduleTitle: "Software Testing & QA", grade: "A" },
];

// Tuition payments submitted through the payment page.
const payments = [];

// Per-student clearance (drug testing report). Defaults to not verified.
const clearance = { "02230123": { drugTestVerified: true } };

// Server-side registration settings, changed by admins.
const settings = { registrationPeriodOpen: true };

let receiptSequence = 1000;

function nextReceiptNumber() {
  receiptSequence += 1;
  return `RCPT-${new Date().getFullYear()}-${receiptSequence}`;
}

function addPayment({ studentId, transactionNumber, screenshotName }) {
  const payment = {
    id: crypto.randomUUID(),
    receiptNumber: nextReceiptNumber(),
    studentId,
    transactionNumber,
    screenshotName: screenshotName || "",
    status: "verified",
    createdAt: new Date().toISOString(),
  };
  payments.push(payment);
  return payment;
}

function setDrugTestVerified(studentId, value) {
  clearance[studentId] = { ...(clearance[studentId] || {}), drugTestVerified: value };
  return clearance[studentId];
}

function isDrugTestVerified(studentId) {
  return Boolean(clearance[studentId] && clearance[studentId].drugTestVerified);
}

module.exports = {
  modules,
  registeredModules,
  results,
  payments,
  clearance,
  settings,
  addPayment,
  setDrugTestVerified,
  isDrugTestVerified,
};
