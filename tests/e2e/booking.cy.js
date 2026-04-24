describe('Booking Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('learner@sds.vn');
    cy.get('input[type="password"]').type('Learn1234');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/learner');
  });

  it('shows weekly calendar with available slots', () => {
    cy.visit('/bookings');
    cy.get('[data-testid="weekly-calendar"]').should('be.visible');
  });

  it('books a session successfully', () => {
    cy.visit('/bookings');
    cy.get('.slot-available').first().click();
    cy.get('.ant-modal').should('be.visible');
    cy.get('.ant-modal .ant-btn-primary').click();
    cy.get('.ant-message-success').should('be.visible');
  });
});
