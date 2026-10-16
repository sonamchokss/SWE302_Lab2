/// <reference types="cypress" />

describe("Student results", () => {
  beforeEach(function () {
    cy.fixture("users").as("users");
    cy.fixture("results").as("results");
  });

  it("shows Module Code, Title and Grade", function () {
    cy.login(this.users.student, { visit: "/results.html" });

    this.results.headers.forEach((header) => {
      cy.get("[data-cy=results-table] thead").should("contain", header);
    });
    const { moduleCode, moduleTitle, grade } = this.results.expected;
    cy.get("[data-cy=results-table] tbody tr")
      .should("contain", moduleCode)
      .and("contain", moduleTitle)
      .and("contain", grade);
  });

  it("downloads the result statement as a PDF", function () {
    const fileName = `results-${this.users.student.studentId}.pdf`;
    cy.task("deleteDownload", fileName);
    cy.intercept("GET", "/api/results/*/pdf").as("statementPdf");
    cy.login(this.users.student, { visit: "/results.html" });

    cy.get("[data-cy=download-statement-btn]").click();

    cy.wait("@statementPdf").then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      expect(response.headers["content-type"]).to.contain("application/pdf");
    });
    cy.readFile(`${Cypress.config("downloadsFolder")}/${fileName}`, null, { timeout: 10000 });
  });

  it("sends a visitor who is not logged in to the login page", () => {
    cy.visit("/results.html");
    cy.url().should("include", "/login.html");
  });

  it("does not let a student download another student's statement", function () {
    cy.login(this.users.student, { visit: "/results.html" }).then((session) => {
      cy.request({
        url: `/api/results/${this.users.otherStudentId}/pdf`,
        headers: { Authorization: `Bearer ${session.token}` },
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 403);
    });
  });
});
