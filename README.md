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
├── src/
│   ├── validators.js      # R1-R7 field validation (pure functions)
│   ├── businessLogic.js   # payment, decision table, duplicate check, results
│   └── server.js          # Express routes wiring it all together
├── public/                # login.html, register.html, results.html, index.html
├── tests/
│   ├── studentIdPassword.test.js
│   ├── paymentTransaction.test.js
│   └── businessLogic.test.js
└── package.json
```
