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

  it('renders with copy icon only when not hovered', () => {
    mountWithProviders(<CopyButton collapsible text={testText} />);

    cy.get('ui5-button[icon="copy"]').should('exist');
  });

  it('expands to show text on hover', () => {
    mountWithProviders(<CopyButton collapsible text={testText} />);

    const button = cy.get('ui5-button[icon="copy"]');
    button.trigger('mouseenter', { force: true });

    cy.wait(350);
    button.should('contain.text', testText);
  });

  it('collapses when mouse leaves', () => {
    mountWithProviders(<CopyButton collapsible text={testText} />);

    const button = cy.get('ui5-button[icon="copy"]');
    button.trigger('mouseenter', { force: true });
    cy.wait(350);
    button.trigger('mouseleave', { force: true });
    cy.wait(350);

    button.should('exist');
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

    const button = cy.get('ui5-button[icon="copy"]');
    button.trigger('mouseenter', { force: true });
    cy.wait(350);
    button.click();
    cy.wait(500);

    button.should('have.attr', 'design', 'Positive');
    button.should('contain.text', 'Copied to clipboard');
  });

  it('displays text as tooltip', () => {
    mountWithProviders(<CopyButton collapsible text={testText} />);

    cy.get('ui5-button[icon="copy"]').should('have.attr', 'tooltip', testText);
  });

  it('handles long strings', () => {
    const longText = 'project-very-long-project-name--ws-very-long-workspace-name';
    mountWithProviders(<CopyButton collapsible text={longText} />);

    const button = cy.get('ui5-button[icon="copy"]');
    button.trigger('mouseenter', { force: true });
    cy.wait(350);

    button.should('contain.text', longText);
  });

  it('renders non-collapsible variant without container div', () => {
    mountWithProviders(<CopyButton text={testText} />);

    cy.get('ui5-button[icon="copy"]').should('exist').should('contain.text', testText);
  });
});
