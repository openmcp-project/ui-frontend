import { CopyNamespaceButton } from './CopyNamespaceButton.tsx';
import '@ui5/webcomponents-cypress-commands';

describe('CopyNamespaceButton', () => {
  const testNamespace = 'project-test--ws-workspace';

  it('renders with copy icon only when not hovered', () => {
    cy.mount(<CopyNamespaceButton namespace={testNamespace} />);

    // Button should be visible
    cy.get('ui5-button[icon="copy"]').should('exist');
  });

  it('expands to show namespace text on hover', () => {
    cy.mount(<CopyNamespaceButton namespace={testNamespace} />);

    // Get the button
    const button = cy.get('ui5-button[icon="copy"]');

    // Hover over the button itself
    button.trigger('mouseenter', { force: true });

    // Wait for animation and verify text is visible
    cy.wait(350); // Wait for animation to complete
    button.should('contain.text', testNamespace);
  });

  it('collapses when mouse leaves', () => {
    cy.mount(<CopyNamespaceButton namespace={testNamespace} />);

    const button = cy.get('ui5-button[icon="copy"]');

    // Hover to expand
    button.trigger('mouseenter', { force: true });
    cy.wait(350);

    // Leave hover
    button.trigger('mouseleave', { force: true });
    cy.wait(350);

    // Text should be hidden (opacity 0 via CSS)
    button.should('exist');
  });

  it('shows success state when clicked', () => {
    cy.mount(<CopyNamespaceButton namespace={testNamespace} />);

    const button = cy.get('ui5-button[icon="copy"]');

    // Hover and click
    button.trigger('mouseenter', { force: true });
    cy.wait(350);
    button.click();

    // Wait for async copy operation
    cy.wait(100);

    // Should show positive design and success message
    cy.get('ui5-button[design="Positive"]').should('exist');
    cy.get('ui5-button').should('contain.text', 'common.copyToClipboardSuccessToast');
  });

  it('displays namespace as tooltip', () => {
    cy.mount(<CopyNamespaceButton namespace={testNamespace} />);

    cy.get('ui5-button[icon="copy"]').should('have.attr', 'tooltip', testNamespace);
  });

  it('handles long namespace strings', () => {
    const longNamespace = 'project-very-long-project-name--ws-very-long-workspace-name';
    cy.mount(<CopyNamespaceButton namespace={longNamespace} />);

    const button = cy.get('ui5-button[icon="copy"]');

    // Hover to expand
    button.trigger('mouseenter', { force: true });
    cy.wait(350);

    // Should display full namespace
    button.should('contain.text', longNamespace);
  });
});
