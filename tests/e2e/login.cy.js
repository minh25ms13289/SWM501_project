describe('Login Page', () => {
  beforeEach(() => { cy.visit('/login'); });

  it('renders login form', () => {
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Log In');
  });

  it('shows error on invalid credentials', () => {
    cy.get('input[type="email"]').type('wrong@sds.vn');
    cy.get('input[type="password"]').type('wrong');
    cy.get('button[type="submit"]').click();
    cy.get('.ant-message-error').should('be.visible');
  });

  it('redirects admin to dashboard', () => {
    cy.get('input[type="email"]').type('admin@sds.vn');
    cy.get('input[type="password"]').type('Admin1234');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/admin/dashboard');
  });
});
