# CST Student Management System

Web app for the College of Science and Technology: student login, tuition payment
with downloadable receipts, module registration, results with PDF statements, and
an admin area. Built with Node.js + Express and plain HTML/CSS/JavaScript.

## Setup

```bash
cd cst-sms
npm install
npm start
```

Open `http://localhost:3000` and log in.

| Role    | Student ID | Password   | Can do |
|---------|------------|------------|--------|
| Student | `02230123` | `Passw0rd` | dashboard, pay tuition, register modules, view and download own results |
| Admin   | `00000001` | `Admin123` | dashboard, manage students, set drug testing clearance, open/close registration, record grades, download any student's statement |

## Pages

| Page | File | Who | Purpose |
|------|------|-----|---------|
| Login | `login.html` | everyone | Student ID and password, show/hide password, session-expired message |
| Dashboard | `index.html` | student, admin | Status cards, quick actions, registered modules, recent results (student); totals and recent payments (admin) |
| Pay Tuition | `payment.html` | student | Upload payment screenshot + transaction number, confirmation with receipt, payment history |
| Register Modules | `register.html` | student | Checklist (payment, clearance, registration window) and module registration |
| Results | `results.html` | student, admin | Own grades and PDF statement (student); search, statements and grade recording (admin) |
| Students | `students.html` | admin | Student list and search, add student, drug testing clearance, registration window |

The layout uses a sidebar on wide screens and a slide-out menu (the ☰ button) on tablets and phones. Tables scroll sideways inside their card on narrow screens rather than breaking the page.

## Registration rules

Module registration follows the decision table (payment → drug testing → registration period).
The three inputs are read on the **server**, not sent by the browser:

- **Tuition payment verified:** the student has at least one stored payment.
- **Drug testing clearance:** set by an admin on the Students page (defaults to pending).
- **Registration period:** set by an admin on the Students or Dashboard page (defaults to open).

## API (all routes except login need `Authorization: Bearer <token>`)

| Method | Route | Access | Purpose |
|--------|-------|--------|---------|
| POST | `/api/login` | public | log in, returns token + user |
| POST | `/api/logout` | logged in | end session |
| GET  | `/api/me` | logged in | current user |
| GET  | `/api/students` | admin | list all students |
| GET  | `/api/students/:studentId` | admin or that student | one student |
| POST | `/api/students` | admin | create student + login |
| PUT / DELETE | `/api/students/:studentId` | admin | update / delete |
| GET  | `/api/modules`, `/api/modules/:code` | logged in | list / one module |
| GET  | `/api/status` | logged in | my payment, clearance and period status |
| GET  | `/api/status/:studentId` | self or admin | status for a student |
| PUT  | `/api/clearance/:studentId` | admin | set drug testing clearance `{ drugTestVerified }` |
| GET  | `/api/settings` | logged in | registration period |
| PUT  | `/api/settings` | admin | set registration period `{ registrationPeriodOpen }` |
| POST | `/api/payment` | logged in | tuition payment (screenshot + transaction number) |
| GET  | `/api/payments` | logged in | my payments (admin: all) |
| GET  | `/api/payments/:id/receipt` | owner or admin | receipt as PDF |
| POST | `/api/register` | logged in | register a module |
| GET  | `/api/registrations` | logged in | my registered modules |
| GET  | `/api/results` | logged in | my results (admin: all) |
| GET  | `/api/results/:studentId` | self or admin | one student's results |
| GET  | `/api/results/:studentId/pdf` | self or admin | result statement as PDF |
| POST | `/api/results` | admin | record a grade |

By default student records, payments and results are held in memory and reset on restart.
Set `DATABASE_URL` (e.g. `postgres://cst_admin:cst_password@localhost:5432/cst_sms`) to store
student records in PostgreSQL instead; login accounts remain in memory.

## Run the unit and API tests

```bash
npm test
```

Runs all Jest suites and prints a coverage table for `src/validators.js` and
`src/businessLogic.js` (thresholds: 90% statements/functions/lines, 85% branches).
The PostgreSQL integration tests run separately with `npm run test:db` (requires Docker).

## Project structure

```
cst-sms/
├── src/
│   ├── auth.js                # password hashing, token sessions, role middleware
│   ├── businessLogic.js       # payment, registration, duplicate checks, results
│   ├── memoryRepository.js    # in-memory students (used when no DATABASE_URL)
│   ├── pdf.js                 # result statements and payment receipts (pdfkit)
│   ├── server.js              # Express app and API routes
│   ├── store.js               # in-memory modules, results, payments, clearance, settings
│   ├── studentRepository.js   # PostgreSQL CRUD operations
│   ├── studentRoutes.js       # /api/students routes
│   └── validators.js          # field validation
├── public/
│   ├── app.js                 # session, API helpers, sidebar shell, downloads
│   ├── style.css              # design system and responsive layout
│   ├── login.html  index.html  payment.html  register.html  results.html  students.html
├── tests/                     # Jest suites (API, business rules, validation)
├── migrations/                # PostgreSQL schema
├── jmeter-lab/                # performance-test fixtures (Lab 6)
├── docker-compose.yml         # local PostgreSQL service
├── CHANGES.md                 # what changed in this version and why
└── README.md
```

## Notes for the lab

- **Test accounts for usability sessions:** create a second student from the admin **Students** page, set their drug testing clearance, and record a grade for them so they can see results.
- **Receipts and statements** are generated when requested, so the PDF always reflects the latest data.
