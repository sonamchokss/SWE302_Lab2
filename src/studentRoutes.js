const express = require("express");
const {
  createStudent,
  getStudentById,
  listStudents,
  updateStudent,
  deleteStudent,
} = require("./studentRepository");

// Factory so the same router logic can be wired to any pg.Pool
// (a real dev-database pool in server.js, or a Testcontainers pool in tests).
function buildStudentRouter(pool) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const result = await createStudent(pool, req.body);
    if (!result.success) return res.status(409).json({ message: result.message });
    res.status(201).json(result.data);
  });

  router.get("/", async (req, res) => {
    const rows = await listStudents(pool);
    res.json(rows);
  });

  router.get("/:studentId", async (req, res) => {
    const result = await getStudentById(pool, req.params.studentId);
    if (!result.found) return res.status(404).json({ message: result.message });
    res.json(result.data);
  });

  router.put("/:studentId", async (req, res) => {
    const result = await updateStudent(pool, req.params.studentId, req.body);
    if (!result.success) return res.status(404).json({ message: result.message });
    res.json(result.data);
  });

  router.delete("/:studentId", async (req, res) => {
    const result = await deleteStudent(pool, req.params.studentId);
    if (!result.success) return res.status(404).json({ message: result.message });
    res.json({ message: "Student deleted", data: result.data });
  });

  return router;
}

module.exports = buildStudentRouter;
