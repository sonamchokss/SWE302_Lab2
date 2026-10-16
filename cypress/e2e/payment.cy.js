/// <reference types="cypress" />

describe("Tuition payment", () => {
  beforeEach(function () {
    cy.fixture("payment").as("payment");
    cy.fixture("users").then((users) => cy.login(users.student, { visit: "/payment.html" }));
  });

  it("submits a valid screenshot and transaction number and shows a receipt", function () {
    cy.uniqueTransaction(this.payment.validPrefix).then((txn) => {
      cy.get("[data-cy=screenshot]").selectFile(this.payment.validFile, { force: true });
      cy.get("[data-cy=transaction-number]").type(txn);
      cy.get("[data-cy=pay-btn]").click();

      cy.get("[data-cy=payment-confirmation]").should("be.visible");
      cy.get("[data-cy=receipt-number]").invoke("text").should("match", /^RCPT-\d{4}-\d+$/);
      cy.get("[data-cy=confirm-transaction]").should("have.text", txn);
      cy.get("[data-cy=payment-history]").should("contain", txn);
    });
  });

  it("rejects a file that is not an image", function () {
    cy.get("[data-cy=screenshot]").selectFile(this.payment.invalidFile, { force: true });

    cy.get("[data-cy=file-error]").should("contain", "Only .jpg, .jpeg or .png");
    cy.get("[data-cy=transaction-number]").type("555-123456789");
    cy.get("[data-cy=pay-btn]").click();
    cy.get("[data-cy=payment-confirmation]").should("not.be.visible");
  });

  it("rejects an invalid transaction number format", function () {
    cy.get("[data-cy=screenshot]").selectFile(this.payment.validFile, { force: true });
    cy.get("[data-cy=transaction-number]").type(this.payment.invalidTransaction);
    cy.get("[data-cy=pay-btn]").click();

    cy.get("[data-cy=transaction-error]").should("contain", "123-456789012");
    cy.get("[data-cy=payment-confirmation]").should("not.be.visible");
  });

  it("rejects a missing transaction number", function () {
    cy.get("[data-cy=screenshot]").selectFile(this.payment.validFile, { force: true });
    cy.get("[data-cy=pay-btn]").click();

    cy.get("[data-cy=transaction-error]").should("contain", "Enter the transaction number");
    cy.get("[data-cy=payment-confirmation]").should("not.be.visible");
  });

  it("rejects a transaction number that was already submitted", function () {
    cy.payTuition(this.payment.validPrefix).then((txn) => {
      cy.get("[data-cy=submit-another-btn]").click();
      cy.get("[data-cy=screenshot]").selectFile(this.payment.validFile, { force: true });
      cy.get("[data-cy=transaction-number]").type(txn);
      cy.get("[data-cy=pay-btn]").click();

      cy.get("[data-cy=payment-message]").should("contain", "already been submitted");
    });
  });
});
