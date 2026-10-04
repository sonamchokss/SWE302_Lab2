# CST Student Management System — SWE302 Lab 2

Web app + Jest unit tests implementing the requirements reviewed in Lab 1
(Student Login, Tuition Payment, Module Registration, Result Viewing).

## Setup

```bash
cd cst-sms
npm install
```

## Run the web app

```bash
npm start
```

Then open `http://localhost:3000` in your browser and log in first:

| Role    | Student ID | Password   | Can do |
|---------|------------|------------|--------|
| Student | `02230123` | `Passw0rd` | view own profile, pay tuition, register modules, view own results |
| Admin   | `00000001` | `Admin123` | everything above for any student, plus list/find/add students and record grades |

Pages: **Login** (`login.html`), **Home** (`index.html` — landing page for visitors, personalised dashboard once logged in),
**Registration** (`register.html`), **Results** (`results.html`),
**Students** (`students.html`, admin only).

## API (all routes except login need `Authorization: Bearer <token>`)

| Method | Route | Access | Purpose |
|--------|-------|--------|---------|
| POST | `/api/login` | public | log in, returns token + user |
| POST | `/api/logout` | logged in | end session |
| GET  | `/api/me` | logged in | current user |
| **GET (list)** | `/api/students` | admin | list all students |
| **GET (by ID)** | `/api/students/:studentId` | admin or that student | one student |
| **POST (create)** | `/api/students` | admin | create student + login |
| PUT / DELETE | `/api/students/:studentId` | admin | update / delete |
| GET  | `/api/modules`, `/api/modules/:code` | logged in | list / one module |
| POST | `/api/payment` | logged in | tuition payment (screenshot + txn no.) |
| POST | `/api/register` | logged in | register a module |
| GET  | `/api/registrations` | logged in | my registered modules |
| GET  | `/api/results`, `/api/results/:studentId` | self or admin | list / by ID |
| POST | `/api/results` | admin | record a grade |

By default students and accounts are held in memory (reset on restart).
Set `DATABASE_URL` (e.g. `postgres://cst_admin:cst_password@localhost:5432/cst_sms`)
to store student records in PostgreSQL instead; login accounts remain in memory.

## Run the unit tests with coverage

```bash
npm test
```

This runs all Jest test suites and prints a coverage table (statements,
branches, functions, lines) for `src/validators.js` and
`src/businessLogic.js`.

## What to screenshot for submission

1. **Web app screens** — the Login, Registration (payment + module),
   and Results pages, each showing at least one successful action and
   one validation error message.
2. **Terminal: all tests passing** — the full `npm test` output showing
   every test suite and test case passing (green checkmarks).
3. **Coverage table** — the coverage summary Jest prints at the end of
   `npm test` (or open `coverage/lcov-report/index.html` in a browser
   for the visual report).

## Project structure

```
cst-sms/
├── migrations/
│   └── 001_create_students_table.sql
├── src/
│   ├── auth.js                # password hashing, token sessions, role middleware
│   ├── businessLogic.js       # payment, registration, duplicate checks, results
│   ├── memoryRepository.js    # in-memory students (used when no DATABASE_URL)
│   ├── server.js              # Express app and API setup
│   ├── studentRepository.js   # PostgreSQL CRUD operations
│   ├── studentRoutes.js       # /api/students routes
│   └── validators.js          # R1-R7 field validation
├── public/
│   ├── app.js                 # browser-side interactions
│   ├── index.html             # home page
│   ├── login.html             # student login
│   ├── register.html          # payment and module registration
│   ├── results.html           # result viewing
│   ├── students.html          # admin: list / find / add students
│   └── style.css              # shared page styles
├── tests/
│   ├── db/
│   │   └── studentRepository.integration.test.js  # PostgreSQL/Testcontainers tests
│   ├── api.auth.test.js       # login + role-based API tests (supertest)
│   ├── businessLogic.test.js
│   ├── paymentTransaction.test.js
│   └── studentIdPassword.test.js
├── .env                    # local environment variables
├── .gitignore
├── docker-compose.yml      # local PostgreSQL service
├── package.json
├── package-lock.json
└── README.md
```

Generated or local-only directories such as `node_modules/`, `uploads/`, and
`coverage/` are excluded from version control.

## JMeter lab fixtures

The JMeter lab workspace is under `jmeter-lab/`:

- `jmeter-lab/data/students.csv` contains 12 deterministic student records for
  parameterised test requests.
- `jmeter-lab/results/` is intended for JMeter result files.
- `jmeter-lab/reports/` is intended for generated HTML or summary reports.

With Docker running, reset the PostgreSQL database to the CSV fixture using
PowerShell:

```powershell
.\jmeter-lab\reset-db.ps1
```

The reset script starts the PostgreSQL service if necessary, applies the
students-table migration, removes existing student rows, and loads the known
fixture data.
