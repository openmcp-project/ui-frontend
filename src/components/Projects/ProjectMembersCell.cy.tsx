import '@ui5/webcomponents-cypress-commands';
import { MockedProvider } from '@apollo/client/testing/react';
import { ProjectMembersCell } from './ProjectMembersCell';
import { useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { MemberRoles } from '../../lib/api/types/shared/members';

const fakeUseProjectMembersLoading: typeof useProjectMembers = () => ({
  members: [],
  creationTimestamp: undefined,
  isLoading: true,
});

const fakeUseProjectMembersLoaded: typeof useProjectMembers = () => ({
  members: [
    { name: 'alice@example.com', kind: 'User', roles: [MemberRoles.admin] },
    { name: 'bob@example.com', kind: 'User', roles: [MemberRoles.view] },
  ],
  creationTimestamp: '2024-01-15T10:00:00Z',
  isLoading: false,
});

const fakeUseProjectMembersEmpty: typeof useProjectMembers = () => ({
  members: [],
  creationTimestamp: '2024-01-15T10:00:00Z',
  isLoading: false,
});

describe('ProjectMembersCell', () => {
  it('shows busy indicator while loading', () => {
    cy.mount(
      <MockedProvider mocks={[]}>
        <ProjectMembersCell projectName="test-project" useProjectMembers={fakeUseProjectMembersLoading} />
      </MockedProvider>,
    );

    cy.get('ui5-busy-indicator').should('exist');
    cy.get('ui5-avatar-group').should('not.exist');
  });

  it('shows avatar group when members are loaded', () => {
    cy.mount(
      <MockedProvider mocks={[]}>
        <ProjectMembersCell projectName="test-project" useProjectMembers={fakeUseProjectMembersLoaded} />
      </MockedProvider>,
    );

    cy.get('ui5-busy-indicator').should('not.exist');
    cy.get('ui5-avatar-group').should('exist');
    cy.get('ui5-avatar').should('have.length', 2);
  });

  it('shows empty avatar group when project has no members', () => {
    cy.mount(
      <MockedProvider mocks={[]}>
        <ProjectMembersCell projectName="test-project" useProjectMembers={fakeUseProjectMembersEmpty} />
      </MockedProvider>,
    );

    cy.get('ui5-busy-indicator').should('not.exist');
    cy.get('ui5-avatar').should('have.length', 0);
  });
});
