const { PostgreSqlContainer } = require("@testcontainers/postgresql");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const {
  createStudent,
  getStudentById,
  listStudents,
  updateStudent,
  deleteStudent,
} = require("../../src/studentRepository");

// Container startup can take a while the first time (pulling the postgres
// image), so give this suite a generous timeout.
jest.setTimeout(120000);

let container;
let pool;

beforeAll(async () => {
  // Starts a real, ephemeral PostgreSQL instance in Docker via Testcontainers.
  container = await new PostgreSqlContainer("postgres:15-alpine").start();

  pool = new Pool({
    host: container.getHost(),
    port: container.getPort(),
    user: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  });

  const migration = fs.readFileSync(
    path.join(__dirname, "../../migrations/001_create_students_table.sql"),
    "utf8"
  );
  await pool.query(migration);
});

afterAll(async () => {
  if (pool) await pool.end();
  if (container) await container.stop();
});

// Isolate each test: start every test with an empty students table.
beforeEach(async () => {
  await pool.query("DELETE FROM students");
});

describe("createStudent — Add/register a student", () => {
  test("successfully creates a new student record", async () => {
    const result = await createStudent(pool, {
      studentId: "02230001",
      fullName: "Pema Wangmo",
      email: "pema.wangmo@rub.edu.bt",
      program: "BIT",
    });
    expect(result.success).toBe(true);
    expect(result.data.student_id).toBe("02230001");
    expect(result.data.full_name).toBe("Pema Wangmo");
  });

  test("prevents duplicate student records (same Student ID)", async () => {
    await createStudent(pool, {
      studentId: "02230002",
      fullName: "Tandin Dorji",
      email: "tandin@rub.edu.bt",
      program: "BSCS",
    });
    const duplicate = await createStudent(pool, {
      studentId: "02230002",
      fullName: "Different Name",
      email: "different@rub.edu.bt",
      program: "BIT",
    });
    expect(duplicate.success).toBe(false);
    expect(duplicate.message).toMatch(/already exists/i);
  });
});

describe("getStudentById — View/search student details", () => {
  test("retrieves an existing student by ID", async () => {
    await createStudent(pool, {
      studentId: "02230003",
      fullName: "Sonam Choki",
      email: "sonam@rub.edu.bt",
      program: "BIT",
    });
    const result = await getStudentById(pool, "02230003");
    expect(result.found).toBe(true);
    expect(result.data.full_name).toBe("Sonam Choki");
  });

  test("handles a non-existent student ID gracefully", async () => {
    const result = await getStudentById(pool, "09999999");
    expect(result.found).toBe(false);
    expect(result.message).toMatch(/not found/i);
  });
});

describe("listStudents — View list of registered students", () => {
  test("returns all registered students", async () => {
    await createStudent(pool, { studentId: "02230004", fullName: "A", email: "a@rub.edu.bt", program: "BIT" });
    await createStudent(pool, { studentId: "02230005", fullName: "B", email: "b@rub.edu.bt", program: "BSCS" });
    const rows = await listStudents(pool);
    expect(rows).toHaveLength(2);
  });

  test("returns an empty list when no students are registered", async () => {
    const rows = await listStudents(pool);
    expect(rows).toHaveLength(0);
  });
});

describe("updateStudent — Update student information", () => {
  test("successfully updates an existing student's program", async () => {
    await createStudent(pool, { studentId: "02230006", fullName: "Karma Yeshi", email: "karma@rub.edu.bt", program: "BIT" });
    const result = await updateStudent(pool, "02230006", { program: "BSCS" });
    expect(result.success).toBe(true);
    expect(result.data.program).toBe("BSCS");
  });

  test("handles an update to a non-existent student", async () => {
    const result = await updateStudent(pool, "09999999", { program: "BSCS" });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/not found/i);
  });
});

describe("deleteStudent — Delete a student record", () => {
  test("successfully deletes an existing student", async () => {
    await createStudent(pool, { studentId: "02230007", fullName: "Deki Yangzom", email: "deki@rub.edu.bt", program: "BIT" });
    const result = await deleteStudent(pool, "02230007");
    expect(result.success).toBe(true);

    const check = await getStudentById(pool, "02230007");
    expect(check.found).toBe(false);
  });

  test("handles deletion of a non-existent student", async () => {
    const result = await deleteStudent(pool, "09999999");
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/not found/i);
  });
});
