const request = require("supertest");
const app = require("../src/server");

async function login(studentId, password) {
  const res = await request(app).post("/api/login").send({ studentId, password });
  return res;
}
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

let studentToken;
let adminToken;

beforeAll(async () => {
  studentToken = (await login("02230123", "Passw0rd")).body.token;
  adminToken = (await login("00000001", "Admin123")).body.token;
});

describe("POST /api/login", () => {
  test("valid student credentials return a token and role", async () => {
    const res = await login("02230123", "Passw0rd");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.role).toBe("student");
  });
  test("wrong password -> 401", async () => {
    const res = await login("02230123", "Wrongpass1");
    expect(res.status).toBe(401);
  });
  test("invalid student ID format -> 400", async () => {
    const res = await login("123", "Passw0rd");
    expect(res.status).toBe(400);
  });
  test("weak password format -> 400", async () => {
    const res = await login("02230123", "short");
    expect(res.status).toBe(400);
  });
});

describe("Protected routes", () => {
  test("no token -> 401", async () => {
    expect((await request(app).get("/api/modules")).status).toBe(401);
  });
  test("bad token -> 401", async () => {
    const res = await request(app).get("/api/me").set(bearer("nope"));
    expect(res.status).toBe(401);
  });
  test("GET /api/me returns the logged-in user", async () => {
    const res = await request(app).get("/api/me").set(bearer(studentToken));
    expect(res.status).toBe(200);
    expect(res.body.studentId).toBe("02230123");
  });
  test("logout invalidates the token", async () => {
    const { body } = await login("02230123", "Passw0rd");
    await request(app).post("/api/logout").set(bearer(body.token)).expect(200);
    await request(app).get("/api/me").set(bearer(body.token)).expect(401);
  });
});

describe("GET list", () => {
  test("admin can list students", async () => {
    const res = await request(app).get("/api/students").set(bearer(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((s) => s.student_id === "02230123")).toBe(true);
  });
  test("student cannot list students -> 403", async () => {
    const res = await request(app).get("/api/students").set(bearer(studentToken));
    expect(res.status).toBe(403);
  });
  test("any logged-in user can list modules", async () => {
    const res = await request(app).get("/api/modules").set(bearer(studentToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
  test("student sees only their own results in the list", async () => {
    const res = await request(app).get("/api/results").set(bearer(studentToken));
    expect(res.status).toBe(200);
    expect(res.body.every((r) => r.studentId === "02230123")).toBe(true);
  });
});

describe("GET by ID", () => {
  test("student can view own record", async () => {
    const res = await request(app).get("/api/students/02230123").set(bearer(studentToken));
    expect(res.status).toBe(200);
    expect(res.body.student_id).toBe("02230123");
  });
  test("student cannot view someone else -> 403", async () => {
    const res = await request(app).get("/api/students/02230999").set(bearer(studentToken));
    expect(res.status).toBe(403);
  });
  test("admin gets 404 for unknown student", async () => {
    const res = await request(app).get("/api/students/09999999").set(bearer(adminToken));
    expect(res.status).toBe(404);
  });
  test("student can view own result by ID", async () => {
    const res = await request(app).get("/api/results/02230123").set(bearer(studentToken));
    expect(res.status).toBe(200);
    expect(res.body.grade).toBe("A");
  });
  test("student cannot view another student's result -> 403", async () => {
    const res = await request(app).get("/api/results/02230999").set(bearer(studentToken));
    expect(res.status).toBe(403);
  });
  test("module by code", async () => {
    const res = await request(app).get("/api/modules/swe302").set(bearer(studentToken));
    expect(res.status).toBe(200);
    expect(res.body.moduleCode).toBe("SWE302");
  });
});

describe("POST create", () => {
  const newStudent = {
    studentId: "02230777",
    fullName: "Tashi Dorji",
    email: "tashi@rub.edu.bt",
    program: "BE IT",
    password: "Tashi1234",
  };

  test("student cannot create students -> 403", async () => {
    const res = await request(app).post("/api/students").set(bearer(studentToken)).send(newStudent);
    expect(res.status).toBe(403);
  });
  test("admin creates a student, who can then log in", async () => {
    const res = await request(app).post("/api/students").set(bearer(adminToken)).send(newStudent);
    expect(res.status).toBe(201);
    expect(res.body.student_id).toBe("02230777");

    const loginRes = await login("02230777", "Tashi1234");
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.role).toBe("student");
  });
  test("duplicate student -> 409", async () => {
    const res = await request(app).post("/api/students").set(bearer(adminToken)).send(newStudent);
    expect(res.status).toBe(409);
  });
  test("invalid student ID -> 400", async () => {
    const res = await request(app)
      .post("/api/students")
      .set(bearer(adminToken))
      .send({ ...newStudent, studentId: "12" });
    expect(res.status).toBe(400);
  });
  test("missing fields -> 400", async () => {
    const res = await request(app)
      .post("/api/students")
      .set(bearer(adminToken))
      .send({ studentId: "02230888" });
    expect(res.status).toBe(400);
  });
  test("admin records a result; student sees it", async () => {
    const res = await request(app)
      .post("/api/results")
      .set(bearer(adminToken))
      .send({ studentId: "02230123", moduleCode: "SWE301", grade: "B+" });
    expect(res.status).toBe(201);
    const list = await request(app).get("/api/results").set(bearer(studentToken));
    expect(list.body.some((r) => r.moduleCode === "SWE301" && r.grade === "B+")).toBe(true);
  });
  test("student cannot record results -> 403", async () => {
    const res = await request(app)
      .post("/api/results")
      .set(bearer(studentToken))
      .send({ studentId: "02230123", moduleCode: "SWE301", grade: "A" });
    expect(res.status).toBe(403);
  });
  test("invalid grade -> 400", async () => {
    const res = await request(app)
      .post("/api/results")
      .set(bearer(adminToken))
      .send({ studentId: "02230123", moduleCode: "SWE301", grade: "Z" });
    expect(res.status).toBe(400);
  });
});

describe("Module registration (POST /api/register)", () => {
  const ok = { paymentVerified: true, drugTestVerified: true, registrationPeriodOpen: true };

  test("registers a new module for the logged-in student", async () => {
    const res = await request(app)
      .post("/api/register")
      .set(bearer(studentToken))
      .send({ moduleCode: "dbm301", ...ok });
    expect(res.status).toBe(200);
    const mine = await request(app).get("/api/registrations").set(bearer(studentToken));
    expect(mine.body.some((m) => m.moduleCode === "DBM301")).toBe(true);
  });
  test("duplicate registration -> 400", async () => {
    const res = await request(app)
      .post("/api/register")
      .set(bearer(studentToken))
      .send({ moduleCode: "SWE302", ...ok });
    expect(res.status).toBe(400);
  });
  test("decision table still applies (payment not verified)", async () => {
    const res = await request(app)
      .post("/api/register")
      .set(bearer(studentToken))
      .send({ moduleCode: "NET301", ...ok, paymentVerified: false });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Tuition payment not verified.");
  });
  test("unknown module -> 400", async () => {
    const res = await request(app)
      .post("/api/register")
      .set(bearer(studentToken))
      .send({ moduleCode: "XXX999", ...ok });
    expect(res.status).toBe(400);
  });
  test("requires login", async () => {
    const res = await request(app).post("/api/register").send({ moduleCode: "NET301", ...ok });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/payment", () => {
  test("requires login", async () => {
    expect((await request(app).post("/api/payment")).status).toBe(401);
  });
  test("valid screenshot + transaction number -> receipt", async () => {
    const res = await request(app)
      .post("/api/payment")
      .set(bearer(studentToken))
      .field("transactionNumber", "123-123456789")
      .attach("screenshot", Buffer.from("fake"), "proof.png");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("receipt_generated");
  });
  test("bad file type -> 400", async () => {
    const res = await request(app)
      .post("/api/payment")
      .set(bearer(studentToken))
      .field("transactionNumber", "123-123456789")
      .attach("screenshot", Buffer.from("fake"), "proof.pdf");
    expect(res.status).toBe(400);
  });
});
