const express = require("express");
const path = require("path");
const multer = require("multer");

const {
  validateStudentId,
  validatePassword,
  validatePaymentFile,
  validateTransactionNumber,
} = require("./validators");

const {
  processPayment,
  decideRegistration,
  checkDuplicateRegistration,
  getStudentResult,
} = require("./businessLogic");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
const upload = multer({ dest: "uploads/" });

// ---- In-memory "database" for demo purposes ----
const users = [{ studentId: "02230123", password: "Passw0rd" }];
const registeredModules = { "02230123": ["SWE302"] };
const results = [
  { studentId: "02230123", moduleCode: "SWE302", moduleTitle: "Software Testing & QA", grade: "A" },
];

// ---- Login ----
app.post("/api/login", (req, res) => {
  const { studentId, password } = req.body;

  const idCheck = validateStudentId(studentId);
  if (!idCheck.valid) return res.status(400).json({ message: idCheck.message });

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) return res.status(400).json({ message: pwCheck.message });

  const user = users.find((u) => u.studentId === studentId && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid Student ID or Password" });

  res.json({ message: "Login successful" });
});

// ---- Tuition payment submission (screenshot + transaction number) ----
app.post("/api/payment", upload.single("screenshot"), (req, res) => {
  const filename = req.file ? req.file.originalname : undefined;
  const fileCheck = validatePaymentFile(filename);
  if (!fileCheck.valid) return res.status(400).json({ message: fileCheck.message });

  const txnCheck = validateTransactionNumber(req.body.transactionNumber);
  if (!txnCheck.valid) return res.status(400).json({ message: txnCheck.message });

  const result = processPayment(true); // assume verifiable once format checks pass
  res.json(result);
});

// ---- Module registration ----
app.post("/api/register", (req, res) => {
  const { studentId, moduleCode, paymentVerified, drugTestVerified, registrationPeriodOpen } = req.body;

  const decision = decideRegistration(paymentVerified, drugTestVerified, registrationPeriodOpen);
  if (!decision.allowed) return res.status(400).json({ message: decision.message });

  const existing = registeredModules[studentId] || [];
  const dupCheck = checkDuplicateRegistration(existing, moduleCode);
  if (!dupCheck.allowed) return res.status(400).json({ message: dupCheck.message });

  existing.push(moduleCode);
  registeredModules[studentId] = existing;
  res.json({ message: dupCheck.message });
});

// ---- Result viewing ----
app.get("/api/results/:studentId", (req, res) => {
  const result = getStudentResult(results, req.params.studentId);
  if (!result.found) return res.status(404).json({ message: result.message });
  res.json(result);
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`CST SMS server running on http://localhost:${PORT}`));
}

module.exports = app;
