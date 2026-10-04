const express = require("express");
const defaultRepo = require("./studentRepository");
const { validateStudentId, validatePassword } = require("./validators");
const { requireAuth, requireRole, isSelfOrAdmin, addUser, findUser } = require("./auth");

// Factory so the same router logic can be wired to any pg.Pool
// (a real dev-database pool in server.js, or a Testcontainers pool in tests).
// `repo` defaults to the PostgreSQL repository; server.js passes the in-memory
// one when no database is configured.
//
// Access rules:
//   GET  /        list all students      -> admin only
//   GET  /:id     one student            -> admin, or the student themself
//   POST /        create student+login   -> admin only
//   PUT / DELETE                         -> admin only
function buildStudentRouter(pool, repo = defaultRepo) {
  const { createStudent, getStudentById, listStudents, updateStudent, deleteStudent } = repo;
  const router = express.Router();
  // Express 4 does not catch rejected promises, so forward DB errors to the error handler.
  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  router.use(requireAuth);

  router.post("/", requireRole("admin"), wrap(async (req, res) => {
    const { studentId, fullName, email, program, password } = req.body || {};

    const idCheck = validateStudentId(studentId);
    if (!idCheck.valid) return res.status(400).json({ message: idCheck.message });
    if (!fullName || !email || !program) {
      return res.status(400).json({ message: "Full name, email and program are required" });
    }
    if (password !== undefined) {
      const pwCheck = validatePassword(password);
      if (!pwCheck.valid) return res.status(400).json({ message: pwCheck.message });
    }
    if (findUser(studentId)) {
      return res.status(409).json({ message: `Student with ID ${studentId} already exists` });
    }

    const result = await createStudent(pool, { studentId, fullName, email, program });
    if (!result.success) return res.status(409).json({ message: result.message });

    // Give the new student a login (initial password supplied by the admin).
    if (password) addUser({ studentId, password, role: "student", fullName });
    res.status(201).json(result.data);
  }));

  router.get("/", requireRole("admin"), wrap(async (req, res) => {
    const rows = await listStudents(pool);
    res.json(rows);
  }));

  router.get("/:studentId", wrap(async (req, res) => {
    if (!isSelfOrAdmin(req.user, req.params.studentId)) {
      return res.status(403).json({ message: "You can only view your own record" });
    }
    const result = await getStudentById(pool, req.params.studentId);
    if (!result.found) return res.status(404).json({ message: result.message });
    res.json(result.data);
  }));

  router.put("/:studentId", requireRole("admin"), wrap(async (req, res) => {
    const result = await updateStudent(pool, req.params.studentId, req.body);
    if (!result.success) return res.status(404).json({ message: result.message });
    res.json(result.data);
  }));

  router.delete("/:studentId", requireRole("admin"), wrap(async (req, res) => {
    const result = await deleteStudent(pool, req.params.studentId);
    if (!result.success) return res.status(404).json({ message: result.message });
    res.json({ message: "Student deleted", data: result.data });
  }));

  return router;
}

module.exports = buildStudentRouter;
