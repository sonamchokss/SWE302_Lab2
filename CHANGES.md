# Changes in this version

This version addresses the usability and functional issues found while preparing the
Lab 7 usability test, and redesigns the interface.

## 1. Interface redesign

| Before | After |
|--------|-------|
| Single column of cards under a header and top nav | Sidebar dashboard with grouped navigation, topbar with user identity, and a welcome banner |
| Visitor landing page with marketing content | Login page with brand panel; dashboard is the home page after login |
| Forms and tables on the same page | Dedicated pages: Dashboard, Pay Tuition, Register Modules, Results, Students |
| Plain tables and text messages | Status cards, coloured badges, grade chips, empty states, toast notifications and inline field errors |

## 2. Responsive layout

- Wide screens (1024px and up): fixed sidebar and topbar.
- Tablets and phones (below 1024px): sidebar slides out from a ☰ button with an overlay.
- Phones (below 720px): single-column layout, larger touch targets, buttons stacked full width, user name hidden in the topbar to save space.
- Tables scroll horizontally inside their card instead of breaking the page; less important columns are hidden on small screens.
- Respects reduced-motion settings and keeps visible focus outlines for keyboard users.

## 3. Tuition payment (Lab 7 task T2)

- Own page, "Pay Tuition", linked from the sidebar, the dashboard banner and the registration checklist.
- Inline validation before submitting (file type, transaction number format), with the expected format written next to the field.
- Payments are stored. After submitting, the student sees a confirmation with the receipt number, transaction number and time, and can download the receipt as PDF.
- Payment history listing every submission with its receipt.
- A transaction number can only be used once (`409` with a clear message).

## 4. Result statement download (Lab 7 task T3)

- "Download statement (PDF)" on the Results page for students, and for admins for any student.
- The PDF shows the student ID, name, module code, title and grade for each result, plus the date generated.
- Students can only download their own statement (`403` for anyone else); a student with no results gets a `404` message.

## 5. Registration rules made safe

The original registration form let the student choose "Tuition Payment Verified: Yes" from a dropdown. That is now decided on the server:

- Payment verified: from the student's stored payments.
- Drug testing clearance: set by an admin (default pending).
- Registration period: set by an admin (default open).

The rule order (payment, then drug testing, then period) is unchanged and `decideRegistration()` is untouched, so its unit tests still pass.

## 6. Usability and error messages

| Problem found in the usability review | Change |
|---------------------------------------|--------|
| Transaction error only said "Invalid transaction number format" | Message now gives the expected format, e.g. `123-456789012` |
| Navigation called the payment area "Registration" | Nav now reads Pay Tuition, Register Modules, Results |
| Session expiry sent users to login silently | Login page shows "Your session has ended. Please log in again." |
| Submitting a form gave no feedback while saving | Buttons show "Submitting...", "Saving..." etc. and are disabled meanwhile |
| Registration page allowed clicking Register when rules would reject it | Button is disabled until all three checks are complete, with the reason shown |
| Student ID and grades typed by hand (typo risk) | Student ID accepts digits only; grades chosen from a list |
| Admin could not see why a student could not register | Students page and dashboard show registration status and clearance |
| No confirmation after paying | Confirmation card with receipt and next step |

## 7. API additions

- `GET /api/status`, `GET /api/status/:studentId`
- `PUT /api/clearance/:studentId` (admin)
- `GET /api/settings`, `PUT /api/settings` (admin)
- `GET /api/payments`, `GET /api/payments/:id/receipt`
- `GET /api/results/:studentId/pdf`

Existing routes keep their paths and responses. `POST /api/payment` still returns `status: "receipt_generated"`, with the new `payment` object added.

## 8. Tests

- Added API tests for: registration rules now read from the server (a student cannot register by sending `paymentVerified: true`), admin-only clearance and settings, receipt and statement PDFs (owner, admin, other student, not found), duplicate transaction numbers and the new validation message.
- The registration tests were updated because registration no longer trusts the request body. Previously a test sent `paymentVerified: true` and expected success; the same test now creates a real payment first.
- Added unit tests for `isPaymentVerified` and `checkDuplicateTransaction`.
- Jest now ignores the JMeter report folder, which removes a naming-collision warning.
- Result: 109 tests passing; 100% coverage on `businessLogic.js` and `validators.js`.

## 9. Lab 7 task mapping

| Task | Feature in this version |
|------|--------------------------|
| T1 Log in as a student | Login page and dashboard |
| T2 Let the college know you paid | Pay Tuition page, confirmation with receipt |
| T3 Find results and keep a copy | Results page with statement PDF download |
| T4 Enhanced feature | Receipt download (`/api/payments/:id/receipt`) and payment history, or your chosen feature |
