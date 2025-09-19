import { PathAwareBreadcrumbs } from './PathAwareBreadcrumbs';
import { useNavigate, useParams } from 'react-router-dom';

describe('PathAwareBreadcrumbs', () => {
  let lastNavigatedPath = '';
  const fakeUseNavigate = (() => (path: string) => {
    lastNavigatedPath = path;
  }) as typeof useNavigate;
  const fakeUseParams = (() => ({
    projectName: 'my-project',
    workspaceName: 'my-workspace',
    controlPlaneName: 'my-control-plane',
  })) as typeof useParams;

  beforeEach(() => {
    lastNavigatedPath = '';
  });

  it('renders breadcrumbs for all path parameters', () => {
    cy.mount(<PathAwareBreadcrumbs useNavigate={fakeUseNavigate} useParams={fakeUseParams} />);

    // Check that all breadcrumbs are rendered
    cy.get("[data-testid='breadcrumb-item']").should('have.length', 3);
    cy.get("[data-testid='breadcrumb-item']").eq(0).should('contain', '[LOCAL] Projects');
    cy.get("[data-testid='breadcrumb-item']").eq(1).should('contain', 'my-project');
    cy.get("[data-testid='breadcrumb-item']").eq(2).should('contain', 'my-workspace');
  });

  it('navigates when clicking breadcrumbs for all path parameters', () => {
    cy.mount(<PathAwareBreadcrumbs useNavigate={fakeUseNavigate} useParams={fakeUseParams} />);

    // Navigate to '/'
    cy.contains('[LOCAL] Projects').click();
    cy.wrap(null).then(() => {
      expect(lastNavigatedPath).to.equal('/');
    });

    // Click on 'my-project' > Navigate to 'my-project'
    cy.contains('my-project').click();
    cy.wrap(null).then(() => {
      expect(lastNavigatedPath).to.equal('/mcp/projects/my-project');
    });

    // Click on 'my-workspace' > Navigate to 'my-project' since workspaces don’t expose a direct path
    cy.contains('my-workspace').click();
    cy.wrap(null).then(() => {
      expect(lastNavigatedPath).to.equal('/mcp/projects/my-project');
    });
  });

  it('renders only home breadcrumb when there are no path parameters', () => {
    const fakeUseParams = (() => ({})) as typeof useParams;

    cy.mount(<PathAwareBreadcrumbs useNavigate={fakeUseNavigate} useParams={fakeUseParams} />);

    cy.get("[data-testid='breadcrumb-item']").should('have.length', 1);
  });

  it('handles partial route parameters', () => {
    const fakeUseParams = (() => ({
      projectName: 'my-project',
      // No workspaceName
      // No controlPlaneName
    })) as typeof useParams;

    cy.mount(<PathAwareBreadcrumbs useNavigate={fakeUseNavigate} useParams={fakeUseParams} />);

    // Should show 3 breadcrumbs
    cy.get("[data-testid='breadcrumb-item']").should('have.length', 2);

    // Verify data-target attributes
    cy.get("[data-testid='breadcrumb-item']").eq(0).should('contain', '[LOCAL] Projects');
    cy.get("[data-testid='breadcrumb-item']").eq(1).should('contain', 'my-project');
  });
});
