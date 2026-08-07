import '@ui5/webcomponents-cypress-commands';
import { MemberTable } from './MemberTable';
import { MemberRoles, UNNAMED_PROVIDER_PREFIX } from '../../lib/api/types/shared/members';

const members = [
  { name: 'alice@example.com', kind: 'User', roles: [MemberRoles.admin] },
  { name: 'bob@example.com', kind: 'User', roles: [MemberRoles.view] },
  { name: 'carol@example.com', kind: 'Group', roles: [MemberRoles.view] },
];

const mount = (overrideMembers = members) =>
  cy.mount(<MemberTable members={overrideMembers} requireAtLeastOneMember={false} hideNamespaceColumn />);

describe('MemberTable', () => {
  it('renders all members', () => {
    mount();
    cy.contains('alice@example.com').should('exist');
    cy.contains('bob@example.com').should('exist');
    cy.contains('carol@example.com').should('exist');
  });

  it('filters members by name via search bar', () => {
    mount();
    cy.get('ui5-input').typeIntoUi5Input('alice');
    cy.contains('alice@example.com').should('exist');
    cy.contains('bob@example.com').should('not.exist');
    cy.contains('carol@example.com').should('not.exist');
  });

  it('search is case-insensitive', () => {
    mount();
    cy.get('ui5-input').typeIntoUi5Input('BOB');
    cy.contains('bob@example.com').should('exist');
    cy.contains('alice@example.com').should('not.exist');
  });

  it('shows all members when search is cleared', () => {
    mount();
    cy.get('ui5-input').typeIntoUi5Input('alice');
    cy.contains('bob@example.com').should('not.exist');
    cy.get('ui5-input').typeIntoUi5Input('{selectall}{del}');
    cy.contains('bob@example.com').should('exist');
  });

  it('shows validation message when requireAtLeastOneMember and no members', () => {
    cy.mount(<MemberTable members={[]} requireAtLeastOneMember hideNamespaceColumn />);
    cy.contains('You need to have at least one member assigned.').should('exist');
  });

  it('renders role badges', () => {
    mount();
    cy.contains('Administrator').should('exist');
    cy.contains('Viewer').should('exist');
  });

  it('renders a single ungrouped table when there is only one provider', () => {
    mount();
    cy.contains('Default').should('not.exist');
    cy.contains('Custom').should('not.exist');
  });

  it('renders a separate table per provider, each labeled with its member count', () => {
    const mixedMembers = [
      { name: 'alice@example.com', kind: 'User', roles: [MemberRoles.admin] },
      { name: 'dave@example.com', kind: 'User', roles: [MemberRoles.admin] },
      { name: 'bob@example.com', kind: 'User', roles: [MemberRoles.view], provider: 'okta' },
    ];
    mount(mixedMembers);
    cy.contains('Default (2)').should('exist');
    cy.contains('okta (1)').should('exist');
    cy.contains('alice@example.com').should('exist');
    cy.contains('dave@example.com').should('exist');
    cy.contains('bob@example.com').should('exist');
  });

  it('labels a provider whose real name is unavailable as "Custom"', () => {
    const membersWithUnnamedProvider = [
      { name: 'alice@example.com', kind: 'User', roles: [MemberRoles.admin] },
      { name: 'bob@example.com', kind: 'User', roles: [MemberRoles.view], provider: `${UNNAMED_PROVIDER_PREFIX}0` },
    ];
    mount(membersWithUnnamedProvider);
    cy.contains('Custom (1)').should('exist');
    cy.contains(UNNAMED_PROVIDER_PREFIX).should('not.exist');
  });

  it('does not group when every member shares the same single provider', () => {
    // Single shared provider — grouping would be redundant.
    const singleProviderMembers = [
      { name: 'alice@example.com', kind: 'User', roles: [MemberRoles.admin], provider: 'okta' },
      { name: 'bob@example.com', kind: 'User', roles: [MemberRoles.view], provider: 'okta' },
    ];
    mount(singleProviderMembers);
    cy.contains('okta').should('not.exist');
  });

  it('hides the Namespace column when no member has a namespace, even if hideNamespaceColumn is unset', () => {
    cy.mount(<MemberTable members={members} requireAtLeastOneMember={false} />);
    cy.contains('Namespace').should('not.exist');
  });

  it('shows the Namespace column when at least one member has a namespace', () => {
    const membersWithNamespace = [
      { name: 'alice@example.com', kind: 'User', roles: [MemberRoles.admin] },
      { name: 'bob@example.com', kind: 'Group', roles: [MemberRoles.view], namespace: 'my-namespace' },
    ];
    cy.mount(<MemberTable members={membersWithNamespace} requireAtLeastOneMember={false} />);
    cy.contains('Namespace').should('exist');
    cy.contains('my-namespace').should('exist');
  });

  it('filters members across all provider tables using the single shared search bar', () => {
    const mixedMembers = [
      { name: 'alice@example.com', kind: 'User', roles: [MemberRoles.admin] },
      { name: 'bob@example.com', kind: 'User', roles: [MemberRoles.view], provider: 'okta' },
    ];
    mount(mixedMembers);
    cy.get('ui5-input').typeIntoUi5Input('bob');
    cy.contains('alice@example.com').should('not.exist');
    // Default group has no matches left, so it's gone.
    cy.contains('Default').should('not.exist');
    cy.contains('okta (1)').should('exist');
    cy.contains('bob@example.com').should('exist');
  });
});
