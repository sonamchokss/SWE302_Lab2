const express = require("express");
const path = require("path");
const multer = require("multer");
const { Pool } = require("pg");
const buildStudentRouter = require("./studentRoutes");
const memoryRepo = require("./memoryRepository");
const dbRepo = require("./studentRepository");
const auth = require("./auth");

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

const { requireAuth, requireRole, isSelfOrAdmin } = auth;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
const upload = multer({ dest: "uploads/" });

// ---- Demo data (in-memory) ----
const modules = [
  { moduleCode: "SWE301", moduleTitle: "Software Project Management", credits: 12 },
  { moduleCode: "SWE302", moduleTitle: "Software Testing & QA", credits: 12 },
  { moduleCode: "DBM301", moduleTitle: "Database Management", credits: 12 },
  { moduleCode: "NET301", moduleTitle: "Computer Networks", credits: 12 },
];
const registeredModules = { "02230123": ["SWE302"] };
const results = [
  { studentId: "02230123", moduleCode: "SWE302", moduleTitle: "Software Testing & QA", grade: "A" },
];

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
// Tuition payment (screenshot + transaction number) - logged-in users
// =====================================================================
app.post("/api/payment", requireAuth, upload.single("screenshot"), (req, res) => {
  const filename = req.file ? req.file.originalname : undefined;
  const fileCheck = validatePaymentFile(filename);
  if (!fileCheck.valid) return res.status(400).json({ message: fileCheck.message });

  const txnCheck = validateTransactionNumber(req.body.transactionNumber);
  if (!txnCheck.valid) return res.status(400).json({ message: txnCheck.message });

  const result = processPayment(true); // assume verifiable once format checks pass
  res.json(result);
});

// =====================================================================
// Modules
// =====================================================================

// GET /api/modules - list of all modules
app.get("/api/modules", requireAuth, (req, res) => {
  res.json(modules);
});

// GET /api/modules/:moduleCode - one module by code
app.get("/api/modules/:moduleCode", requireAuth, (req, res) => {
  const mod = modules.find((m) => m.moduleCode === req.params.moduleCode.toUpperCase());
  if (!mod) return res.status(404).json({ message: `Module ${req.params.moduleCode} not found` });
  res.json(mod);
});

// =====================================================================
// Module registration
// =====================================================================

// POST /api/register - students register for themselves; admins may register anyone
app.post("/api/register", requireAuth, (req, res) => {
  const { moduleCode, paymentVerified, drugTestVerified, registrationPeriodOpen } = req.body || {};
  const studentId =
    req.user.role === "admin" && req.body.studentId ? req.body.studentId : req.user.studentId;

  const decision = decideRegistration(paymentVerified, drugTestVerified, registrationPeriodOpen);
  if (!decision.allowed) return res.status(400).json({ message: decision.message });

  const code = String(moduleCode || "").toUpperCase();
  if (!modules.some((m) => m.moduleCode === code)) {
    return res.status(400).json({ message: code ? `Module ${code} does not exist` : "Module code is required" });
  }

  const existing = registeredModules[studentId] || [];
  const dupCheck = checkDuplicateRegistration(existing, code);
  if (!dupCheck.allowed) return res.status(400).json({ message: dupCheck.message });

  existing.push(code);
  registeredModules[studentId] = existing;
  res.json({ message: dupCheck.message });
});

// GET /api/registrations - the logged-in student's registered modules
app.get("/api/registrations", requireAuth, (req, res) => {
  const codes = registeredModules[req.user.studentId] || [];
  res.json(modules.filter((m) => codes.includes(m.moduleCode)));
});

// =====================================================================
// Results
// =====================================================================

// GET /api/results - list: own results (student) or every result (admin)
app.get("/api/results", requireAuth, (req, res) => {
  const list =
    req.user.role === "admin" ? results : results.filter((r) => r.studentId === req.user.studentId);
  res.json(list);
});

// GET /api/results/:studentId - by ID: yourself, or anyone if admin
app.get("/api/results/:studentId", requireAuth, (req, res) => {
  if (!isSelfOrAdmin(req.user, req.params.studentId)) {
    return res.status(403).json({ message: "You can only view your own results" });
  }
  const result = getStudentResult(results, req.params.studentId);
  if (!result.found) return res.status(404).json({ message: result.message });
  res.json({ ...result, results: results.filter((r) => r.studentId === req.params.studentId) });
});

// POST /api/results - admin records a grade
app.post("/api/results", requireAuth, requireRole("admin"), (req, res) => {
  const { studentId, moduleCode, grade } = req.body || {};

  const idCheck = validateStudentId(studentId);
  if (!idCheck.valid) return res.status(400).json({ message: idCheck.message });

  const mod = modules.find((m) => m.moduleCode === String(moduleCode || "").toUpperCase());
  if (!mod) return res.status(400).json({ message: "Module does not exist" });

  if (!/^(A|B|C|D)[+-]?$|^F$/.test(grade || "")) {
    return res.status(400).json({ message: "Grade must be A, B, C, D or F (optionally with + or -)" });
  }

  const existing = results.find((r) => r.studentId === studentId && r.moduleCode === mod.moduleCode);
  if (existing) {
    existing.grade = grade;
    return res.json(existing);
  }
  const record = { studentId, moduleCode: mod.moduleCode, moduleTitle: mod.moduleTitle, grade };
  results.push(record);
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
