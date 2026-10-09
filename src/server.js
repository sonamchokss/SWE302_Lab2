const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { Pool } = require("pg");
const buildStudentRouter = require("./studentRoutes");
const memoryRepo = require("./memoryRepository");
const dbRepo = require("./studentRepository");
const auth = require("./auth");
const store = require("./store");
const { renderResultsPdf, renderReceiptPdf } = require("./pdf");

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
  checkDuplicateTransaction,
  getStudentResult,
  isPaymentVerified,
} = require("./businessLogic");

const { requireAuth, requireRole, isSelfOrAdmin } = auth;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
const upload = multer({ dest: "uploads/" });

// Express 4 does not catch rejected promises, so forward errors to the error handler.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---- Demo accounts ----
auth.addUser({ studentId: "02230123", password: "Passw0rd", role: "student", fullName: "Demo Student" });
auth.addUser({ studentId: "00000001", password: "Admin123", role: "admin", fullName: "CST Administrator" });

// ---- Students API (/api/students): PostgreSQL if DATABASE_URL is set, else in-memory ----
if (process.env.DATABASE_URL) {
  const studentsPool = new Pool({ connectionString: process.env.DATABASE_URL });
  app.use("/api/students", buildStudentRouter(studentsPool, dbRepo));
} else {
  memoryRepo.createStudent(null, {
    studentId: "02230123",
    fullName: "Demo Student",
    email: "02230123.cst@rub.edu.bt",
    program: "BE Software Engineering",
  });
  app.use("/api/students", buildStudentRouter(null, memoryRepo));
}

// ---- Helpers ----
function studentName(studentId) {
  const user = auth.findUser(studentId);
  return user ? user.fullName : studentId;
}

// Registration rules are decided on the server, never by what the browser sends.
function registrationStatus(studentId) {
  return {
    studentId,
    paymentVerified: isPaymentVerified(store.payments, studentId),
    drugTestVerified: store.isDrugTestVerified(studentId),
    registrationPeriodOpen: store.settings.registrationPeriodOpen,
  };
}

function removeUpload(file) {
  if (file && file.path) fs.unlink(file.path, () => {});
}

function sendPdf(res, buffer, filename) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

// =====================================================================
// Authentication
// =====================================================================

// POST /api/login  (public) -> returns a bearer token on success
app.post("/api/login", (req, res) => {
  const { studentId, password } = req.body || {};

  const idCheck = validateStudentId(studentId);
  if (!idCheck.valid) return res.status(400).json({ message: idCheck.message });

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) return res.status(400).json({ message: pwCheck.message });

  const user = auth.authenticate(studentId, password);
  if (!user) return res.status(401).json({ message: "Invalid Student ID or Password" });

  const token = auth.createSession(user);
  res.json({
    message: "Login successful",
    token,
    user: { studentId: user.studentId, role: user.role, fullName: user.fullName },
  });
});

// POST /api/logout
app.post("/api/logout", requireAuth, (req, res) => {
  auth.destroySession(req.token);
  res.json({ message: "Logged out" });
});

// GET /api/me - who am I?
app.get("/api/me", requireAuth, (req, res) => {
  const { studentId, role, fullName } = req.user;
  res.json({ studentId, role, fullName });
});

// =====================================================================
// Registration status and settings
// =====================================================================

// GET /api/status - my payment, clearance and period status (admins may pass :studentId)
app.get("/api/status", requireAuth, (req, res) => {
  res.json(registrationStatus(req.user.studentId));
});

app.get("/api/status/:studentId", requireAuth, (req, res) => {
  if (!isSelfOrAdmin(req.user, req.params.studentId)) {
    return res.status(403).json({ message: "You can only view your own status" });
  }
  res.json(registrationStatus(req.params.studentId));
});

// PUT /api/clearance/:studentId - admin sets the drug testing report status
app.put("/api/clearance/:studentId", requireAuth, requireRole("admin"), (req, res) => {
  const { studentId } = req.params;
  const idCheck = validateStudentId(studentId);
  if (!idCheck.valid) return res.status(400).json({ message: idCheck.message });
  const { drugTestVerified } = req.body || {};
  if (typeof drugTestVerified !== "boolean") {
    return res.status(400).json({ message: "drugTestVerified must be true or false" });
  }
  store.setDrugTestVerified(studentId, drugTestVerified);
  res.json(registrationStatus(studentId));
});

// GET / PUT /api/settings - registration period (PUT is admin only)
app.get("/api/settings", requireAuth, (req, res) => {
  res.json(store.settings);
});

app.put("/api/settings", requireAuth, requireRole("admin"), (req, res) => {
  const { registrationPeriodOpen } = req.body || {};
  if (typeof registrationPeriodOpen !== "boolean") {
    return res.status(400).json({ message: "registrationPeriodOpen must be true or false" });
  }
  store.settings.registrationPeriodOpen = registrationPeriodOpen;
  res.json(store.settings);
});

// =====================================================================
// Tuition payment (screenshot + transaction number) - logged-in users
// =====================================================================

// POST /api/payment
app.post("/api/payment", requireAuth, upload.single("screenshot"), (req, res) => {
  const filename = req.file ? req.file.originalname : undefined;
  const fileCheck = validatePaymentFile(filename);
  if (!fileCheck.valid) {
    removeUpload(req.file);
    return res.status(400).json({ message: fileCheck.message });
  }

  const transactionNumber = String(req.body.transactionNumber || "").trim();
  const txnCheck = validateTransactionNumber(transactionNumber);
  if (!txnCheck.valid) {
    removeUpload(req.file);
    return res.status(400).json({ message: txnCheck.message });
  }

  const dupCheck = checkDuplicateTransaction(store.payments, transactionNumber);
  if (!dupCheck.allowed) {
    removeUpload(req.file);
    return res.status(409).json({ message: dupCheck.message });
  }

  const result = processPayment(true); // assume verifiable once format checks pass
  const payment = store.addPayment({
    studentId: req.user.studentId,
    transactionNumber,
    screenshotName: filename,
  });
  res.json({ ...result, payment });
});

// GET /api/payments - my payments (admins see all)
app.get("/api/payments", requireAuth, (req, res) => {
  const list =
    req.user.role === "admin"
      ? store.payments
      : store.payments.filter((p) => p.studentId === req.user.studentId);
  res.json(list);
});

// GET /api/payments/:id/receipt - PDF receipt (owner or admin)
app.get(
  "/api/payments/:id/receipt",
  requireAuth,
  wrap(async (req, res) => {
    const payment = store.payments.find((p) => p.id === req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (!isSelfOrAdmin(req.user, payment.studentId)) {
      return res.status(403).json({ message: "You can only download your own receipts" });
    }
    const pdf = await renderReceiptPdf({ payment, studentName: studentName(payment.studentId) });
    sendPdf(res, pdf, `receipt-${payment.receiptNumber}.pdf`);
  })
);

// =====================================================================
// Modules
// =====================================================================

// GET /api/modules - list of all modules
app.get("/api/modules", requireAuth, (req, res) => {
  res.json(store.modules);
});

// GET /api/modules/:moduleCode - one module by code
app.get("/api/modules/:moduleCode", requireAuth, (req, res) => {
  const mod = store.modules.find((m) => m.moduleCode === req.params.moduleCode.toUpperCase());
  if (!mod) return res.status(404).json({ message: `Module ${req.params.moduleCode} not found` });
  res.json(mod);
});

// =====================================================================
// Module registration
// =====================================================================

// POST /api/register - students register for themselves; admins may register anyone.
// Payment, clearance and period are read from the server, not from the request body.
app.post("/api/register", requireAuth, (req, res) => {
  const { moduleCode } = req.body || {};
  const studentId =
    req.user.role === "admin" && req.body.studentId ? req.body.studentId : req.user.studentId;

  const status = registrationStatus(studentId);
  const decision = decideRegistration(
    status.paymentVerified,
    status.drugTestVerified,
    status.registrationPeriodOpen
  );
  if (!decision.allowed) return res.status(400).json({ message: decision.message });

  const code = String(moduleCode || "").toUpperCase();
  if (!store.modules.some((m) => m.moduleCode === code)) {
    return res.status(400).json({ message: code ? `Module ${code} does not exist` : "Module code is required" });
  }

  const existing = store.registeredModules[studentId] || [];
  const dupCheck = checkDuplicateRegistration(existing, code);
  if (!dupCheck.allowed) return res.status(400).json({ message: dupCheck.message });

  existing.push(code);
  store.registeredModules[studentId] = existing;
  res.json({ message: dupCheck.message });
});

// GET /api/registrations - the logged-in student's registered modules
app.get("/api/registrations", requireAuth, (req, res) => {
  const codes = store.registeredModules[req.user.studentId] || [];
  res.json(store.modules.filter((m) => codes.includes(m.moduleCode)));
});

// =====================================================================
// Results
// =====================================================================

// GET /api/results - list: own results (student) or every result (admin)
app.get("/api/results", requireAuth, (req, res) => {
  const list =
    req.user.role === "admin"
      ? store.results
      : store.results.filter((r) => r.studentId === req.user.studentId);
  res.json(list);
});

// GET /api/results/:studentId - by ID: yourself, or anyone if admin
app.get("/api/results/:studentId", requireAuth, (req, res) => {
  if (!isSelfOrAdmin(req.user, req.params.studentId)) {
    return res.status(403).json({ message: "You can only view your own results" });
  }
  const result = getStudentResult(store.results, req.params.studentId);
  if (!result.found) return res.status(404).json({ message: result.message });
  res.json({ ...result, results: store.results.filter((r) => r.studentId === req.params.studentId) });
});

// GET /api/results/:studentId/pdf - downloadable result statement (self or admin)
app.get(
  "/api/results/:studentId/pdf",
  requireAuth,
  wrap(async (req, res) => {
    const { studentId } = req.params;
    if (!isSelfOrAdmin(req.user, studentId)) {
      return res.status(403).json({ message: "You can only download your own results" });
    }
    const rows = store.results.filter((r) => r.studentId === studentId);
    if (rows.length === 0) return res.status(404).json({ message: "No results found for this student" });
    const pdf = await renderResultsPdf({ studentId, studentName: studentName(studentId), results: rows });
    sendPdf(res, pdf, `results-${studentId}.pdf`);
  })
);

// POST /api/results - admin records a grade
app.post("/api/results", requireAuth, requireRole("admin"), (req, res) => {
  const { studentId, moduleCode, grade } = req.body || {};

  const idCheck = validateStudentId(studentId);
  if (!idCheck.valid) return res.status(400).json({ message: idCheck.message });

  const mod = store.modules.find((m) => m.moduleCode === String(moduleCode || "").toUpperCase());
  if (!mod) return res.status(400).json({ message: "Module does not exist" });

  if (!/^(A|B|C|D)[+-]?$|^F$/.test(grade || "")) {
    return res.status(400).json({ message: "Grade must be A, B, C, D or F (optionally with + or -)" });
  }

  const existing = store.results.find((r) => r.studentId === studentId && r.moduleCode === mod.moduleCode);
  if (existing) {
    existing.grade = grade;
    return res.json(existing);
  }
  const record = { studentId, moduleCode: mod.moduleCode, moduleTitle: mod.moduleTitle, grade };
  store.results.push(record);
  res.status(201).json(record);
});

// ---- Fallback error handler (e.g. database errors) ----
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`CST SMS server running on http://localhost:${PORT}`));
}

module.exports = app;
