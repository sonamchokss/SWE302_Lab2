/// <reference types="cypress" />
// Enhanced feature (Lab 7):
//   T4 - payment receipt download and payment history
//   U5 - usability issue fixed: a registered module can be unregistered, with a confirmation prompt

describe("Enhanced feature: payment receipt (T4)", () => {
  beforeEach(() => {
    cy.fixture("users").then((users) => cy.login(users.student, { visit: "/payment.html" }));
  });

  it("downloads the receipt as a PDF from the confirmation card", () => {
    cy.intercept("GET", "/api/payments/*/receipt").as("receipt");
    cy.payTuition();

    cy.get("[data-cy=download-receipt-btn]").click();

    cy.wait("@receipt").then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      expect(response.headers["content-type"]).to.contain("application/pdf");
    });
  });

  it("lists the submitted payment in the payment history with a receipt button", () => {
    cy.payTuition().then((txn) => {
      cy.get("[data-cy=payment-history]").should("contain", txn);
      cy.get("[data-cy=history-receipt-btn]").should("be.visible").and("contain", "Receipt");
    });
  });
});

describe("Usability fix from Lab 7: unregister a module", () => {
  beforeEach(function () {
    cy.fixture("users").as("users");
    cy.fixture("feature").as("feature");
  });

  it("shows an Unregister button for every registered module", function () {
    cy.setupRegisteredModule(this.users.student, this.feature.module);

    cy.get(`[data-cy=registered-module][data-code=${this.feature.module}]`)
      .find("[data-cy=unregister-btn]")
      .should("be.visible")
      .and("contain", "Unregister");
    cy.get("[data-cy=registered-module]").each(($row) => {
      cy.wrap($row).find("[data-cy=unregister-btn]").should("exist");
    });
  });

  it("asks for confirmation and keeps the module when the student cancels", function () {
    const confirmStub = cy.stub().returns(false);
    cy.on("window:confirm", confirmStub);
    cy.setupRegisteredModule(this.users.student, this.feature.module);

    cy.get(`[data-cy=registered-module][data-code=${this.feature.module}]`)
      .find("[data-cy=unregister-btn]")
      .click();

    cy.wrap(confirmStub).should("have.been.calledOnce").and("have.been.calledWith", this.feature.confirmText);
    cy.get(`[data-cy=registered-module][data-code=${this.feature.module}]`).should("exist");
  });

  it("removes the module and shows a message when the student confirms", function () {
    cy.on("window:confirm", () => true);
    cy.setupRegisteredModule(this.users.student, this.feature.module);

    cy.get(`[data-cy=registered-module][data-code=${this.feature.module}]`)
      .find("[data-cy=unregister-btn]")
      .click();

    cy.get("[data-cy=toast]").should("contain", this.feature.toastText);
    cy.get(`[data-cy=registered-module][data-code=${this.feature.module}]`).should("not.exist");
    cy.get("[data-cy=module-select]").should("contain", this.feature.module);
  });

  it("rejects unregistering a module that is not registered", function () {
    cy.login(this.users.student, { visit: "/register.html" }).then((session) => {
      const url = `/api/registrations/${this.feature.module}`;
      const headers = { Authorization: `Bearer ${session.token}` };
      // make sure the module is not registered, then try to remove it again
      cy.request({ method: "DELETE", url, headers, failOnStatusCode: false });
      cy.request({ method: "DELETE", url, headers, failOnStatusCode: false }).then((res) => {
        expect(res.status).to.eq(404);
        expect(res.body.message).to.contain("is not registered");
      });
    });
  });

  it("rejects unregistering when nobody is logged in", function () {
    cy.request({
      method: "DELETE",
      url: `/api/registrations/${this.feature.module}`,
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 401);
  });
});
