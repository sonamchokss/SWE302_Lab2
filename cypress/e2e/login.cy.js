/// <reference types="cypress" />

describe("Student login", () => {
  beforeEach(function () {
    cy.fixture("users").as("users");
    cy.visit("/login.html");
  });

  it("valid login reaches the student dashboard", function () {
    cy.get("[data-cy=student-id]").type(this.users.student.studentId);
    cy.get("[data-cy=password]").type(this.users.student.password);
    cy.get("[data-cy=login-btn]").click();

    cy.url().should("include", "/index.html");
    cy.get("[data-cy=welcome]").should("contain", this.users.student.firstName);
  });

  it("shows an error for a 7-digit Student ID", function () {
    cy.get("[data-cy=student-id]").type(this.users.invalidStudentId);
    cy.get("[data-cy=password]").type(this.users.student.password);
    cy.get("[data-cy=login-btn]").click();

    cy.get("[data-cy=student-id-error]").should("contain", "8 digits");
    cy.url().should("include", "/login.html");
  });

  it("rejects empty fields and stays on the login page", () => {
    cy.get("[data-cy=login-btn]").click();

    cy.get("[data-cy=student-id-error]").should("contain", "Enter your Student ID");
    cy.get("[data-cy=password-error]").should("contain", "Enter your password");
    cy.url().should("include", "/login.html");
  });

  it("rejects a wrong password", function () {
    cy.get("[data-cy=student-id]").type(this.users.student.studentId);
    cy.get("[data-cy=password]").type(this.users.wrongPassword);
    cy.get("[data-cy=login-btn]").click();

    cy.get("[data-cy=login-message]").should("contain", "Invalid Student ID or Password");
    cy.url().should("include", "/login.html");
  });
});
