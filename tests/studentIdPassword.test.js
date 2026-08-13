const { validateStudentId, validatePassword } = require("../src/validators");

describe("Student ID validation (R1, R2)", () => {
  test("TC01: exactly 8 digits is accepted", () => {
    expect(validateStudentId("02230123").valid).toBe(true);
  });
  test("TC02: empty ID is rejected as required", () => {
    const r = validateStudentId("");
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/required/i);
  });
  test("TC03: 7 digits (too short) is rejected", () => {
    expect(validateStudentId("2230123").valid).toBe(false);
  });
  test("TC04: 9 digits (too long) is rejected", () => {
    expect(validateStudentId("022301234").valid).toBe(false);
  });
  test("TC05: letters present is rejected", () => {
    expect(validateStudentId("0223ABCD").valid).toBe(false);
  });

  // Boundary Value Analysis (Activity 2.1)
  test("BV-ID-01: 7 digits -> reject", () => {
    expect(validateStudentId("0223012").valid).toBe(false);
  });
  test("BV-ID-02: 8 digits -> accept", () => {
    expect(validateStudentId("02230123").valid).toBe(true);
  });
  test("BV-ID-03: 9 digits -> reject", () => {
    expect(validateStudentId("022301234").valid).toBe(false);
  });
});

describe("Password validation (R3, R4)", () => {
  test("TC06: valid 8-char password with upper/lower/digit is accepted", () => {
    expect(validatePassword("Passw0rd").valid).toBe(true);
  });
  test("TC07: empty password is rejected as required", () => {
    expect(validatePassword("").valid).toBe(false);
  });
  test("TC08: 6-7 char password is rejected as too short", () => {
    expect(validatePassword("Pas0rd").valid).toBe(false);
  });
  test("TC09: 13+ char password is rejected as too long", () => {
    expect(validatePassword("Passw0rdsABCD").valid).toBe(false);
  });
  test("TC10: no uppercase letter is rejected", () => {
    expect(validatePassword("password1").valid).toBe(false);
  });
  test("TC11: no lowercase letter is rejected", () => {
    expect(validatePassword("PASSWORD1").valid).toBe(false);
  });
  test("TC12: no numeric digit is rejected", () => {
    expect(validatePassword("Password").valid).toBe(false);
  });

  // Boundary Value Analysis (Activity 2.2)
  test("BV-PW-01: 7 chars -> reject", () => {
    expect(validatePassword("Pas0rda").valid).toBe(false);
  });
  test("BV-PW-02: 8 chars -> accept", () => {
    expect(validatePassword("Passw0rd").valid).toBe(true);
  });
  test("BV-PW-03: 9 chars -> accept", () => {
    expect(validatePassword("Passw0rds").valid).toBe(true);
  });
  test("BV-PW-04: 11 chars -> accept", () => {
    expect(validatePassword("Passw0rdsAB").valid).toBe(true);
  });
  test("BV-PW-05: 12 chars -> accept", () => {
    expect(validatePassword("Passw0rdsABC").valid).toBe(true);
  });
  test("BV-PW-06: 13 chars -> reject", () => {
    expect(validatePassword("Passw0rdsABCD").valid).toBe(false);
  });
});
