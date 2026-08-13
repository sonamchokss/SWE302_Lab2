const {
  processPayment,
  decideRegistration,
  checkDuplicateRegistration,
  getStudentResult,
} = require("../src/businessLogic");

describe("Payment verification (R8, R9)", () => {
  test("TC19: verifiable payment generates an electronic receipt", () => {
    const r = processPayment(true);
    expect(r.status).toBe("receipt_generated");
  });
  test("TC20: unverifiable payment leaves registration incomplete", () => {
    const r = processPayment(false);
    expect(r.status).toBe("incomplete");
  });
});

describe("Registration decision table (Activity 3 — all 8 rules)", () => {
  test("Rule 1: Y/Y/Y -> Registration Allowed", () => {
    const r = decideRegistration(true, true, true);
    expect(r.allowed).toBe(true);
    expect(r.message).toBe("Registration Allowed");
  });
  test("Rule 2: Y/Y/N -> Registration period is closed.", () => {
    expect(decideRegistration(true, true, false).message).toBe("Registration period is closed.");
  });
  test("Rule 3: Y/N/Y -> Drug testing report not verified.", () => {
    expect(decideRegistration(true, false, true).message).toBe("Drug testing report not verified.");
  });
  test("Rule 4: Y/N/N -> Drug testing report not verified.", () => {
    expect(decideRegistration(true, false, false).message).toBe("Drug testing report not verified.");
  });
  test("Rule 5: N/Y/Y -> Tuition payment not verified.", () => {
    expect(decideRegistration(false, true, true).message).toBe("Tuition payment not verified.");
  });
  test("Rule 6: N/Y/N -> Tuition payment not verified.", () => {
    expect(decideRegistration(false, true, false).message).toBe("Tuition payment not verified.");
  });
  test("Rule 7: N/N/Y -> Tuition payment not verified.", () => {
    expect(decideRegistration(false, false, true).message).toBe("Tuition payment not verified.");
  });
  test("Rule 8: N/N/N -> Tuition payment not verified.", () => {
    expect(decideRegistration(false, false, false).message).toBe("Tuition payment not verified.");
  });

  // Same 4 rows called out explicitly as TC21-TC24 in the Lab 1 report
  test("TC21: all verified -> Registration Allowed", () => {
    expect(decideRegistration(true, true, true).allowed).toBe(true);
  });
  test("TC22: drug test not verified -> rejected", () => {
    expect(decideRegistration(true, false, true).allowed).toBe(false);
  });
  test("TC23: payment not verified -> rejected", () => {
    expect(decideRegistration(false, true, true).allowed).toBe(false);
  });
  test("TC24: registration period closed -> rejected", () => {
    expect(decideRegistration(true, true, false).allowed).toBe(false);
  });
});

describe("Duplicate module registration", () => {
  test("TC25: registering an already-registered module is rejected", () => {
    const r = checkDuplicateRegistration(["SWE302"], "SWE302");
    expect(r.allowed).toBe(false);
  });
  test("registering a new module succeeds", () => {
    const r = checkDuplicateRegistration(["SWE302"], "SWE201");
    expect(r.allowed).toBe(true);
  });
});

describe("Result viewing (Section 4)", () => {
  const db = [{ studentId: "02230123", moduleCode: "SWE302", moduleTitle: "Software Testing & QA", grade: "A" }];

  test("TC26: registered student sees Module Code, Title, and Grade", () => {
    const r = getStudentResult(db, "02230123");
    expect(r.found).toBe(true);
    expect(r.moduleCode).toBe("SWE302");
    expect(r.moduleTitle).toBe("Software Testing & QA");
    expect(r.grade).toBe("A");
  });
  test("TC27: unregistered / unknown student ID has no result", () => {
    const r = getStudentResult(db, "99999999");
    expect(r.found).toBe(false);
  });
});
