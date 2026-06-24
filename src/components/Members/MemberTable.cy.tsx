import '@ui5/webcomponents-cypress-commands';
import { MemberTable } from './MemberTable';
import { MemberRoles } from '../../lib/api/types/shared/members';

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
});
