const { validatePaymentFile, validateTransactionNumber } = require("../src/validators");

describe("Payment screenshot validation (R6)", () => {
  test("TC13: .jpg is accepted", () => {
    expect(validatePaymentFile("receipt.jpg").valid).toBe(true);
  });
  test("accepts .jpeg", () => {
    expect(validatePaymentFile("receipt.jpeg").valid).toBe(true);
  });
  test("accepts .png", () => {
    expect(validatePaymentFile("receipt.png").valid).toBe(true);
  });
  test("TC14: .pdf is rejected as invalid file type", () => {
    expect(validatePaymentFile("receipt.pdf").valid).toBe(false);
  });
  test("rejects .gif", () => {
    expect(validatePaymentFile("receipt.gif").valid).toBe(false);
  });
  test("TC15: no file uploaded is rejected as required", () => {
    const r = validatePaymentFile(undefined);
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/required/i);
  });
});

describe("Transaction number validation (R7)", () => {
  test("TC16: 123-123456789 is accepted", () => {
    expect(validateTransactionNumber("123-123456789").valid).toBe(true);
  });
  test("TC17: 12-123456789 (2 digits before hyphen) is rejected", () => {
    expect(validateTransactionNumber("12-123456789").valid).toBe(false);
  });
  test("TC18: empty is rejected as required", () => {
    expect(validateTransactionNumber("").valid).toBe(false);
  });
  test("rejects missing hyphen", () => {
    expect(validateTransactionNumber("123123456789").valid).toBe(false);
  });
  test("rejects letter in transaction number", () => {
    expect(validateTransactionNumber("12A-123456789").valid).toBe(false);
  });

  // Boundary Value Analysis (Activity 2.3)
  test("BV-TX-01: 12 chars (segment too short) -> reject", () => {
    expect(validateTransactionNumber("123-12345678").valid).toBe(false);
  });
  test("BV-TX-02: 13 chars (correct pattern) -> accept", () => {
    expect(validateTransactionNumber("123-123456789").valid).toBe(true);
  });
  test("BV-TX-03: 14 chars (segment too long) -> reject", () => {
    expect(validateTransactionNumber("123-1234567890").valid).toBe(false);
  });
});
