import { Member, MemberRoles } from '../../lib/api/types/shared/members';
import { EditMembers } from './EditMembers.tsx';

const email1 = 'test1@test.com';
const email2 = 'test2@test.com';

function mountContainer(members: Member[] = []) {
  cy.mount(<EditMembers members={members} onMemberChanged={cy.spy().as('onChangeSpy')} />);
}

describe('<EditMembers />', () => {
  it('Should create member with Viewer role', () => {
    mountContainer();

    cy.get('#member-email-input').typeIntoUi5Input(email1);
    cy.get('[data-testid="add-member-button"]').click();
    cy.get('@onChangeSpy').should('have.been.calledOnce');
    cy.get('@onChangeSpy').should('have.been.calledWith', [
      { name: email1, roles: [MemberRoles.viewer], kind: 'User' },
    ]);
  });

  it('Should create member with Adminisitrator role', () => {
    mountContainer();

    cy.get('#member-email-input').typeIntoUi5Input(email2);
    cy.get('#member-role-select').openDropDownByClick();
    cy.get('#member-role-select  [value="admin"]').clickDropdownMenuItem({
      force: true,
    });
    cy.get('[data-testid="add-member-button"]').click();
    cy.get('@onChangeSpy').should('have.been.calledOnce');
    cy.get('@onChangeSpy').should('have.been.calledWith', [{ name: email2, roles: [MemberRoles.admin], kind: 'User' }]);
  });

  it('Should remove selected member', () => {
    mountContainer([
      { name: email1, roles: [MemberRoles.admin], kind: 'User' },
      { name: email2, roles: [MemberRoles.viewer], kind: 'User' },
    ]);
    cy.get('[aria-rowindex="1"] > [data-column-id-cell="."] > ui5-button').click();
    cy.get('@onChangeSpy').should('have.been.calledOnce');
    cy.get('@onChangeSpy').should('have.been.calledWith', [
      { name: email2, roles: [MemberRoles.viewer], kind: 'User' },
    ]);
  });
});
