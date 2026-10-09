/**
 * Workflow / decision logic for the CST College Student Management System.
 * Mirrors Activity 3 (Decision Table) and the remaining scenarios in
 * Activity 4 of the Lab 1 report.
 */

// R8, R9: Payment verification outcome
function processPayment(isVerifiable) {
  if (isVerifiable) {
    return { status: "receipt_generated", message: "Electronic payment receipt generated" };
  }
  return { status: "incomplete", message: "Registration remains incomplete - payment could not be verified" };
}

/**
 * Registration decision table.
 * Order of precedence when multiple conditions fail:
 *   Payment -> Drug Testing Report -> Registration Period
 */
function decideRegistration(paymentVerified, drugTestVerified, registrationPeriodOpen) {
  if (!paymentVerified) {
    return { allowed: false, message: "Tuition payment not verified." };
  }
  if (!drugTestVerified) {
    return { allowed: false, message: "Drug testing report not verified." };
  }
  if (!registrationPeriodOpen) {
    return { allowed: false, message: "Registration period is closed." };
  }
  return { allowed: true, message: "Registration Allowed" };
}

// Duplicate module registration check
function checkDuplicateRegistration(registeredModules, moduleCode) {
  if (registeredModules.includes(moduleCode)) {
    return { allowed: false, message: `Module ${moduleCode} is already registered` };
  }
  return { allowed: true, message: `Module ${moduleCode} registered successfully` };
}

// Result viewing: student must be registered to view results
function getStudentResult(resultsDb, studentId) {
  const record = resultsDb.find((r) => r.studentId === studentId);
  if (!record) {
    return { found: false, message: "No result found for this student" };
  }
  return {
    found: true,
    moduleCode: record.moduleCode,
    moduleTitle: record.moduleTitle,
    grade: record.grade,
  };
}

// A tuition payment counts as verified when the student has at least one stored payment.
function isPaymentVerified(payments, studentId) {
  return payments.some((p) => p.studentId === studentId && p.status === "verified");
}

// Each transaction number may only be submitted once, across all students.
function checkDuplicateTransaction(payments, transactionNumber) {
  if (payments.some((p) => p.transactionNumber === transactionNumber)) {
    return { allowed: false, message: "This transaction number has already been submitted" };
  }
  return { allowed: true, message: "Transaction number is new" };
}

module.exports = {
  processPayment,
  decideRegistration,
  checkDuplicateRegistration,
  getStudentResult,
  isPaymentVerified,
  checkDuplicateTransaction,
};
