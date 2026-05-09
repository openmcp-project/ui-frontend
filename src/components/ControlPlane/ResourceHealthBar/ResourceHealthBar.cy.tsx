import { ResourceHealthBar } from './ResourceHealthBar';

describe('ResourceHealthBar', () => {
  describe('ready-synced mode', () => {
    it('renders all resources as ready and synced', () => {
      const resources = [
        { ready: true, synced: true },
        { ready: true, synced: true },
        { ready: true, synced: true },
      ];

      cy.mount(<ResourceHealthBar resources={resources} type="ready-synced" />);

      cy.get('[class*="healthBar"]').should('exist');
      cy.get('[class*="goodSegment"]').should('exist');
      cy.get('[class*="badSegment"]').should('not.exist');
      cy.get('[class*="unknownSegment"]').should('not.exist');
    });

    it('renders mixed resource states', () => {
      const resources = [
        { ready: true, synced: true },
        { ready: false, synced: false },
        { ready: undefined, synced: undefined },
      ];

      cy.mount(<ResourceHealthBar resources={resources} type="ready-synced" />);

      cy.get('[class*="healthBar"]').should('exist');
      cy.get('[class*="goodSegment"]').should('exist');
      cy.get('[class*="badSegment"]').should('exist');
      cy.get('[class*="unknownSegment"]').should('exist');
    });

    it('renders all resources as not ready', () => {
      const resources = [
        { ready: false, synced: false },
        { ready: false, synced: false },
      ];

      cy.mount(<ResourceHealthBar resources={resources} type="ready-synced" />);

      cy.get('[class*="healthBar"]').should('exist');
      cy.get('[class*="goodSegment"]').should('not.exist');
      cy.get('[class*="badSegment"]').should('exist');
      cy.get('[class*="unknownSegment"]').should('not.exist');
    });

    it('handles empty resources array', () => {
      cy.mount(<ResourceHealthBar resources={[]} type="ready-synced" />);

      cy.get('[class*="healthBar"]').should('exist');
      cy.get('[class*="goodSegment"]').should('not.exist');
      cy.get('[class*="badSegment"]').should('not.exist');
      cy.get('[class*="unknownSegment"]').should('not.exist');
    });
  });

  describe('installed-healthy mode', () => {
    it('renders all resources as installed and healthy', () => {
      const resources = [
        { installed: true, healthy: true },
        { installed: true, healthy: true },
      ];

      cy.mount(<ResourceHealthBar resources={resources} type="installed-healthy" />);

      cy.get('[class*="healthBar"]').should('exist');
      cy.get('[class*="goodSegment"]').should('exist');
      cy.get('[class*="badSegment"]').should('not.exist');
      cy.get('[class*="unknownSegment"]').should('not.exist');
    });

    it('renders installed but not healthy', () => {
      const resources = [
        { installed: true, healthy: false },
        { installed: true, healthy: false },
      ];

      cy.mount(<ResourceHealthBar resources={resources} type="installed-healthy" />);

      cy.get('[class*="healthBar"]').should('exist');
      cy.get('[class*="goodSegment"]').should('not.exist');
      cy.get('[class*="badSegment"]').should('exist');
      cy.get('[class*="unknownSegment"]').should('not.exist');
    });

    it('renders not installed resources', () => {
      const resources = [
        { installed: false, healthy: false },
        { installed: false, healthy: false },
      ];

      cy.mount(<ResourceHealthBar resources={resources} type="installed-healthy" />);

      cy.get('[class*="healthBar"]').should('exist');
      cy.get('[class*="goodSegment"]').should('not.exist');
      cy.get('[class*="badSegment"]').should('not.exist');
      cy.get('[class*="unknownSegment"]').should('exist');
    });

    it('renders mixed states correctly', () => {
      const resources = [
        { installed: true, healthy: true },
        { installed: true, healthy: false },
        { installed: false, healthy: false },
      ];

      cy.mount(<ResourceHealthBar resources={resources} type="installed-healthy" />);

      cy.get('[class*="healthBar"]').should('exist');
      cy.get('[class*="goodSegment"]').should('exist');
      cy.get('[class*="badSegment"]').should('exist');
      cy.get('[class*="unknownSegment"]').should('exist');
    });
  });

  describe('visual properties', () => {
    it('has correct width proportions for 50/50 split', () => {
      const resources = [
        { ready: true, synced: true },
        { ready: false, synced: false },
      ];

      cy.mount(<ResourceHealthBar resources={resources} type="ready-synced" />);

      cy.get('[class*="goodSegment"]').should('have.css', 'width').and('match', /40px/); // 50% of 80px
      cy.get('[class*="badSegment"]').should('have.css', 'width').and('match', /40px/);
    });

    it('is inline-flex and has correct dimensions', () => {
      const resources = [{ ready: true, synced: true }];

      cy.mount(<ResourceHealthBar resources={resources} type="ready-synced" />);

      cy.get('[class*="healthBar"]')
        .should('have.css', 'display', 'inline-flex')
        .should('have.css', 'height', '6px')
        .should('have.css', 'width', '80px');
    });
  });
});
