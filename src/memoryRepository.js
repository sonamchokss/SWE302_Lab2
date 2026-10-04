/**
 * In-memory stand-in for studentRepository.js, used when no DATABASE_URL is
 * configured so the app works out of the box. Same function names, same
 * return shapes (snake_case rows) as the PostgreSQL version.
 */
const students = new Map();

async function createStudent(_db, { studentId, fullName, email, program }) {
  if (students.has(studentId)) {
    return { success: false, message: `Student with ID ${studentId} already exists` };
  }
  const row = {
    student_id: studentId,
    full_name: fullName,
    email,
    program,
    created_at: new Date().toISOString(),
  };
  students.set(studentId, row);
  return { success: true, data: row };
}

async function getStudentById(_db, studentId) {
  const row = students.get(studentId);
  if (!row) return { found: false, message: `Student with ID ${studentId} not found` };
  return { found: true, data: row };
}

async function listStudents() {
  return [...students.values()].sort((a, b) => a.student_id.localeCompare(b.student_id));
}

async function updateStudent(_db, studentId, { fullName, email, program }) {
  const row = students.get(studentId);
  if (!row) return { success: false, message: `Student with ID ${studentId} not found` };
  if (fullName != null) row.full_name = fullName;
  if (email != null) row.email = email;
  if (program != null) row.program = program;
  return { success: true, data: row };
}

async function deleteStudent(_db, studentId) {
  const row = students.get(studentId);
  if (!row) return { success: false, message: `Student with ID ${studentId} not found` };
  students.delete(studentId);
  return { success: true, data: row };
}

module.exports = { createStudent, getStudentById, listStudents, updateStudent, deleteStudent };
