import '@ui5/webcomponents-cypress-commands';
import type React from 'react';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import { SplitterProvider } from '../Splitter/SplitterContext.tsx';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { MemberRoles } from '../../lib/api/types/shared/members';
import { ProjectCard } from './ProjectCard';

const fakeUseProjectMembers: typeof _useProjectMembers = () => ({
  members: [],
  displayName: undefined,
  createdBy: undefined,
  chargingTarget: undefined,
  chargingTargetType: undefined,
  deletionTimestamp: undefined,
  creationTimestamp: undefined,
  isLoading: false,
  supportLandscape: undefined,
  supportServiceIds: undefined,
  supportSecurityContacts: undefined,
  supportOpsContacts: undefined,
});

const fakeUseProjectMembersLoading: typeof _useProjectMembers = () => ({
  members: [],
  displayName: undefined,
  createdBy: undefined,
  chargingTarget: undefined,
  chargingTargetType: undefined,
  deletionTimestamp: undefined,
  creationTimestamp: undefined,
  isLoading: true,
  supportLandscape: undefined,
  supportServiceIds: undefined,
  supportSecurityContacts: undefined,
  supportOpsContacts: undefined,
});

const fakeUseProjectMembersWithMembers: typeof _useProjectMembers = () => ({
  members: [
    { name: 'alice@example.com', kind: 'User', roles: [MemberRoles.admin] },
    { name: 'bob@example.com', kind: 'User', roles: [MemberRoles.view] },
  ],
  displayName: undefined,
  createdBy: undefined,
  chargingTarget: undefined,
  chargingTargetType: undefined,
  deletionTimestamp: undefined,
  creationTimestamp: '2024-03-01T10:00:00Z',
  isLoading: false,
  supportLandscape: undefined,
  supportServiceIds: undefined,
  supportSecurityContacts: undefined,
  supportOpsContacts: undefined,
});

const fakeUseProjectMembersWithDisplayName: typeof _useProjectMembers = () => ({
  members: [],
  displayName: 'My Display Name',
  createdBy: undefined,
  chargingTarget: undefined,
  chargingTargetType: undefined,
  deletionTimestamp: undefined,
  creationTimestamp: undefined,
  isLoading: false,
  supportLandscape: undefined,
  supportServiceIds: undefined,
  supportSecurityContacts: undefined,
  supportOpsContacts: undefined,
});

const fakeUseProjectMembersInDeletion: typeof _useProjectMembers = () => ({
  members: [],
  displayName: undefined,
  createdBy: undefined,
  chargingTarget: undefined,
  chargingTargetType: undefined,
  deletionTimestamp: '2024-06-01T12:00:00Z',
  creationTimestamp: '2024-01-01T00:00:00Z',
  isLoading: false,
  supportLandscape: undefined,
  supportServiceIds: undefined,
  supportSecurityContacts: undefined,
  supportOpsContacts: undefined,
});

const fakeUseProjectMembersProduction: typeof _useProjectMembers = () => ({
  members: [],
  displayName: undefined,
  createdBy: undefined,
  chargingTarget: undefined,
  chargingTargetType: undefined,
  deletionTimestamp: undefined,
  creationTimestamp: undefined,
  isLoading: false,
  supportLandscape: 'production',
  supportServiceIds: undefined,
  supportSecurityContacts: undefined,
  supportOpsContacts: undefined,
});

const setAsDefaultRef = { current: false } as React.RefObject<boolean>;

const mount = (
  useProjectMembers: typeof _useProjectMembers = fakeUseProjectMembers,
  onProjectSelect?: (projectName: string) => void,
) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <MemoryRouter>
        <SplitterProvider>
          <ProjectCard
            projectName="test-project"
            setAsDefaultRef={setAsDefaultRef}
            useProjectMembers={useProjectMembers}
            onProjectSelect={onProjectSelect}
          />
        </SplitterProvider>
      </MemoryRouter>
    </MockedProvider>,
  );

describe('ProjectCard', () => {
  it('renders project name', () => {
    mount();
    cy.contains('test-project').should('be.visible');
  });

  it('renders display name as title and project name as subtitle when displayName is set', () => {
    mount(fakeUseProjectMembersWithDisplayName);
    cy.get('[class*="titleRow"]').find('span').first().should('be.visible').and('contain.text', 'My Display Name');
    cy.get('[class*="subtitle"]').should('be.visible').and('contain.text', 'test-project');
  });

  it('shows skeleton while loading', () => {
    mount(fakeUseProjectMembersLoading);
    // skeletonLine div is rendered in place of subtitle when loading
    cy.get('.skeletonLine, [class*="skeletonLine"]').should('exist');
    cy.get('ui5-avatar-group').should('not.exist');
  });

  it('shows member avatars when loaded with members', () => {
    mount(fakeUseProjectMembersWithMembers);
    cy.get('ui5-avatar-group').should('exist');
  });

  it('calls onProjectSelect when card is clicked', () => {
    const onSelect = cy.stub();
    mount(fakeUseProjectMembers, onSelect);
    cy.get('[role="button"]').first().click();
    cy.wrap(onSelect).should('have.been.calledOnceWith', 'test-project');
  });

  it('ribbon button click opens support popover when supportLandscape is production', () => {
    cy.mount(
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <SplitterProvider>
            <ProjectCard
              projectName="test-project"
              setAsDefaultRef={setAsDefaultRef}
              useProjectMembers={fakeUseProjectMembersProduction}
            />
          </SplitterProvider>
        </MemoryRouter>
      </MockedProvider>,
    );
    // The ribbon button has title="Production" (purposeLabel for 'production')
    cy.get('button[title="Production"]').click({ force: true });
    // The support info popover has headerText — filter to the responsive popover that's open
    // (menus also render ui5-responsive-popover but with class ui5-menu-rp)
    cy.get('ui5-responsive-popover:not(.ui5-menu-rp)').should('have.attr', 'open');
  });

  it('info button opens info popover', () => {
    mount();
    cy.get('ui5-button[icon="hint"]').click();
    cy.get('ui5-popover').should('have.attr', 'open');
  });

  it('shows red info button and deletion timestamp in popover when project is being deleted', () => {
    mount(fakeUseProjectMembersInDeletion);
    // Button should have the danger CSS class (CSS module name contains 'infoButtonDanger')
    cy.get('ui5-button[icon="hint"]')
      .invoke('attr', 'class')
      .should('match', /infoButtonDanger/);
    // Open the popover and verify deletion row appears
    cy.get('ui5-button[icon="hint"]').click();
    cy.get('ui5-popover').should('have.attr', 'open');
    cy.get('[class*="infoLabelDanger"]').should('exist');
    cy.get('[class*="infoValueDanger"]').should('exist');
  });
});
