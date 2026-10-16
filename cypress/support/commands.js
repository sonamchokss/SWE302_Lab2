/// <reference types="cypress" />
// Custom commands for the CST Student Management System tests.

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// Opens a page with the session already stored, the same way the app stores it after login.
Cypress.Commands.add("visitAs", (session, page) => {
  cy.visit(page, {
    onBeforeLoad(win) {
      win.sessionStorage.setItem("token", session.token);
      win.sessionStorage.setItem("user", JSON.stringify(session.user));
    },
  });
});

// cy.login(user, { visit: "/payment.html" })
// Logs in through the API (fast, no repeated typing) and opens a page (default: dashboard).
// Yields { token, user } so a test can also call the API as that user.
Cypress.Commands.add("login", (user, options = {}) => {
  const page = options.visit || "/index.html";
  cy.request("POST", "/api/login", { studentId: user.studentId, password: user.password }).then((res) => {
    expect(res.status).to.eq(200);
    const session = { token: res.body.token, user: res.body.user };
    cy.visitAs(session, page);
    cy.wrap(session, { log: false });
  });
});

// A new valid transaction number each time (3 digits, hyphen, 9 digits), because the system
// rejects a transaction number that was already used.
Cypress.Commands.add("uniqueTransaction", (prefix = "555") => {
  cy.wrap(`${prefix}-${String(Date.now()).slice(-9)}`, { log: false });
});

// Pays tuition through the Pay Tuition page (must already be on /payment.html).
// Yields the transaction number that was submitted.
Cypress.Commands.add("payTuition", (prefix = "555") => {
  cy.uniqueTransaction(prefix).then((txn) => {
    cy.get("[data-cy=screenshot]").selectFile("cypress/fixtures/payment-proof.png", { force: true });
    cy.get("[data-cy=transaction-number]").type(txn);
    cy.get("[data-cy=pay-btn]").click();
    cy.get("[data-cy=payment-confirmation]").should("be.visible");
    cy.wrap(txn, { log: false });
  });
});

// Gets a student to the Register Modules page with one module registered:
// logs in, pays tuition (registration needs a payment), registers the module through the API,
// then opens /register.html. A module that is already registered is not an error.
Cypress.Commands.add("setupRegisteredModule", (user, moduleCode) => {
  cy.login(user, { visit: "/payment.html" }).then((session) => {
    cy.payTuition();
    cy.request({
      method: "POST",
      url: "/api/register",
      headers: authHeader(session.token),
      body: { moduleCode },
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status !== 200) {
        expect(res.status).to.eq(400);
        expect(res.body.message).to.contain("already registered");
      }
    });
    cy.visitAs(session, "/register.html");
    cy.wrap(session, { log: false });
  });
});
