const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "student_db",
});

async function createStudent(db, student) {
  const { studentId, fullName, email, program } = student;

  try {
    const result = await db.query(
      `INSERT INTO students (student_id, full_name, email, program)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [studentId, fullName, email, program]
    );
    return { success: true, data: result.rows[0] };
  } catch (error) {
    if (error.code === "23505") {
      return { success: false, message: `Student with ID ${studentId} already exists` };
    }
    throw error;
  }
}

async function getStudentById(db, studentId) {
  const result = await db.query(
    "SELECT * FROM students WHERE student_id = $1",
    [studentId]
  );
  if (result.rows.length === 0) {
    return { found: false, message: `Student with ID ${studentId} not found` };
  }
  return { found: true, data: result.rows[0] };
}

async function listStudents(db) {
  const result = await db.query("SELECT * FROM students ORDER BY student_id");
  return result.rows;
}

async function updateStudent(db, studentId, updates) {
  const { fullName, email, program } = updates;
  const result = await db.query(
    `UPDATE students 
     SET full_name = COALESCE($1, full_name), 
         email = COALESCE($2, email), 
         program = COALESCE($3, program) 
     WHERE student_id = $4 
     RETURNING *`,
    [fullName, email, program, studentId]
  );
  if (result.rows.length === 0) {
    return { success: false, message: `Student with ID ${studentId} not found` };
  }
  return { success: true, data: result.rows[0] };
}

async function deleteStudent(db, studentId) {
  const result = await db.query(
    "DELETE FROM students WHERE student_id = $1 RETURNING *",
    [studentId]
  );
  if (result.rows.length === 0) {
    return { success: false, message: `Student with ID ${studentId} not found` };
  }
  return { success: true, data: result.rows[0] };
}

module.exports = {
  pool,
  createStudent,
  getStudentById,
  listStudents,
  updateStudent,
  deleteStudent,
};