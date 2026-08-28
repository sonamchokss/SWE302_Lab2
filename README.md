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

Then open `http://localhost:3000` in your browser. Try each page:
- **Login** (`login.html`) — demo account `02230123` / `Passw0rd`
- **Registration** (`register.html`) — payment upload + module registration
- **Results** (`results.html`) — view a registered student's result

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
│   ├── businessLogic.js       # payment, registration, duplicate checks, results
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
│   └── style.css              # shared page styles
├── tests/
│   ├── db/
│   │   └── studentRepository.integration.test.js  # PostgreSQL/Testcontainers tests
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
