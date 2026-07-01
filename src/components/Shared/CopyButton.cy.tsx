import { CopyButton } from './CopyButton.tsx';
import '@ui5/webcomponents-cypress-commands';
import { CopyButtonProvider } from '../../context/CopyButtonContext.tsx';
import { ToastProvider } from '../../context/ToastContext.tsx';

describe('CopyButton collapsible', () => {
  const testText = 'project-test--ws-workspace';

  const mountWithProviders = (component: React.ReactElement) => {
    return cy.mount(
      <ToastProvider>
        <CopyButtonProvider>{component}</CopyButtonProvider>
      </ToastProvider>,
    );
  };

  // Re-query the button each time — Cypress `cy.get()` returns a chainable
  // that resolves to whatever the DOM had when it ran. Reusing a chain
  // reference across actions/renders was a source of stale-element flakes
  // combined with the `cy.wait(350)` animation delays we've now removed.
  const button = () => cy.get('ui5-button[icon="copy"]');

  it('renders with copy icon only when not hovered', () => {
    mountWithProviders(<CopyButton collapsible text={testText} />);

    button().should('exist');
  });

  it('expands to show text on hover', () => {
    mountWithProviders(<CopyButton collapsible text={testText} />);

    // `.trigger('mouseenter', { force: true })` is intentional: UI5 web
    // components don't reliably surface synthetic mouseenter across their
    // shadow-DOM boundary otherwise. It's a UI5 quirk, not a masked bug.
    button().trigger('mouseenter', { force: true });
    // `should` retries until the animation completes — no cy.wait needed.
    button().should('contain.text', testText);
  });

  it('collapses when mouse leaves', () => {
    mountWithProviders(<CopyButton collapsible text={testText} />);

    button().trigger('mouseenter', { force: true });
    button().should('contain.text', testText);
    button().trigger('mouseleave', { force: true });
    button().should('not.contain.text', testText);
  });

  it('shows success state when clicked', () => {
    cy.window().then((win) => {
      const writeTextStub = cy.stub().resolves();
      Object.defineProperty(win.navigator, 'clipboard', {
        value: { writeText: writeTextStub, readText: cy.stub().resolves('') },
        writable: true,
        configurable: true,
      });
    });

    mountWithProviders(<CopyButton collapsible text={testText} />);

    button().trigger('mouseenter', { force: true });
    button().should('contain.text', testText);
    button().click();

    button().should('have.attr', 'design', 'Positive');
    button().should('contain.text', 'Copied to clipboard');
  });

  it('displays text as tooltip', () => {
    mountWithProviders(<CopyButton collapsible text={testText} />);

    button().should('have.attr', 'tooltip', testText);
  });

  it('handles long strings', () => {
    const longText = 'project-very-long-project-name--ws-very-long-workspace-name';
    mountWithProviders(<CopyButton collapsible text={longText} />);

    button().trigger('mouseenter', { force: true });
    button().should('contain.text', longText);
  });

  it('renders non-collapsible variant without container div', () => {
    mountWithProviders(<CopyButton text={testText} />);

    cy.get('ui5-button[icon="copy"]').should('exist').should('contain.text', testText);
  });
});
