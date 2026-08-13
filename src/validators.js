/**
 * Validation logic for the CST College Student Management System.
 * Each function is a pure function (no I/O) so it can be unit-tested
 * directly, independent of the Express routes that call it.
 *
 * Requirement references (from the Lab 1 SRS review):
 *   R1/R2 - Student ID
 *   R3/R4 - Password
 *   R6    - Payment screenshot file type
 *   R7    - Transaction number format
 */

// R1, R2: Student ID must be exactly 8 digits, numeric only, mandatory
function validateStudentId(id) {
  if (id === undefined || id === null || id === "") {
    return { valid: false, message: "Student ID is required" };
  }
  if (!/^\d+$/.test(id)) {
    return { valid: false, message: "Student ID must contain numeric characters only" };
  }
  if (id.length !== 8) {
    return { valid: false, message: "Student ID must be exactly 8 digits" };
  }
  return { valid: true, message: "Student ID is valid" };
}

// R3, R4: Password 8-12 chars, at least one uppercase, one lowercase, one digit
function validatePassword(password) {
  if (password === undefined || password === null || password === "") {
    return { valid: false, message: "Password is required" };
  }
  if (password.length < 8) {
    return { valid: false, message: "Password is too short (minimum 8 characters)" };
  }
  if (password.length > 12) {
    return { valid: false, message: "Password is too long (maximum 12 characters)" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain an uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain a lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain a numeric digit" };
  }
  return { valid: true, message: "Password is valid" };
}

// R6: Payment screenshot must be .jpg, .jpeg, or .png, and is mandatory
function validatePaymentFile(filename) {
  if (!filename) {
    return { valid: false, message: "Payment screenshot is required" };
  }
  const allowed = /\.(jpg|jpeg|png)$/i;
  if (!allowed.test(filename)) {
    return { valid: false, message: "Invalid file type. Only .jpg, .jpeg, .png are allowed" };
  }
  return { valid: true, message: "Payment screenshot accepted" };
}

// R7: Transaction number = 3 digits + hyphen + 9 digits, mandatory
function validateTransactionNumber(txn) {
  if (!txn) {
    return { valid: false, message: "Transaction number is required" };
  }
  if (!/^\d{3}-\d{9}$/.test(txn)) {
    return { valid: false, message: "Invalid transaction number format" };
  }
  return { valid: true, message: "Transaction number is valid" };
}

module.exports = {
  validateStudentId,
  validatePassword,
  validatePaymentFile,
  validateTransactionNumber,
};
