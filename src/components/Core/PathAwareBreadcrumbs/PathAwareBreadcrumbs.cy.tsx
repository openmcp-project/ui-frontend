import { PathAwareBreadcrumbs } from './PathAwareBreadcrumbs';

describe('PathAwareBreadcrumbs', () => {
  const navigateCalls = [];
  const fakeUseNavigate = () => (path: string) => navigateCalls.push(path);
  const fakeUseParams = () => ({
    projectName: 'my-project',
    workspaceName: 'my-workspace',
    controlPlaneName: 'my-control-plane',
  });

  beforeEach(() => {
    navigateCalls.length = 0;
  });

  it('renders breadcrumbs for all path parameters', () => {
    // @ts-ignore
    cy.mount(<PathAwareBreadcrumbs useNavigate={fakeUseNavigate} useParams={fakeUseParams} />);

    // Check that all breadcrumbs are rendered
    cy.get("[data-testid='breadcrumb-item']").should('have.length', 4);
    cy.get("[data-testid='breadcrumb-item']").eq(0).should('contain', '[LOCAL] Projects');
    cy.get("[data-testid='breadcrumb-item']").eq(1).should('contain', 'my-project');
    cy.get("[data-testid='breadcrumb-item']").eq(2).should('contain', 'my-workspace');
    cy.get("[data-testid='breadcrumb-item']").eq(3).should('contain', 'my-control-plane');
  });

  it('navigates when clicking breadcrumbs for all path parameters', () => {
    let lastNavigatedPath: string | null = null;
    const fakeUseNavigate = () => (path: string) => {
      lastNavigatedPath = path;
    };
    // @ts-ignore
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

    // Click on 'my-control-plane' > Navigate to 'my-control-plane'
    cy.contains('my-control-plane').click();
    cy.wrap(null).then(() => {
      expect(lastNavigatedPath).to.equal('/mcp/projects/my-project/workspaces/my-workspace/mcps/my-control-plane');
    });
  });

  it('renders only home breadcrumb when there are no path parameters', () => {
    const fakeUseParams = () => ({});

    // @ts-ignore
    cy.mount(<PathAwareBreadcrumbs useNavigate={fakeUseNavigate} useParams={fakeUseParams} />);

    cy.get("[data-testid='breadcrumb-item']").should('have.length', 1);
  });

  it('handles partial route parameters', () => {
    const fakeUseParams = () => ({
      projectName: 'my-project',
      workspaceName: 'my-workspace',
      // No controlPlaneName
    });

    // @ts-ignore
    cy.mount(<PathAwareBreadcrumbs useNavigate={fakeUseNavigate} useParams={fakeUseParams} />);

    // Should show 3 breadcrumbs
    cy.get("[data-testid='breadcrumb-item']").should('have.length', 3);

    // Verify data-target attributes
    cy.get("[data-testid='breadcrumb-item']").eq(0).should('contain', '[LOCAL] Projects');
    cy.get("[data-testid='breadcrumb-item']").eq(1).should('contain', 'my-project');
    cy.get("[data-testid='breadcrumb-item']").eq(2).should('contain', 'my-workspace');
  });
});
