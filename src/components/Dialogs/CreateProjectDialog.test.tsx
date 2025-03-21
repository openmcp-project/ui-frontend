import React, { useState, useRef } from 'react';
import {
  CreateProjectWorkspaceDialog,
  onCreatePayload,
} from './CreateProjectWorkspaceDialog';
import { Member, MemberRoles } from '../../lib/api/types/shared/members';
import { ErrorDialogHandle } from '../Shared/ErrorMessageBox';
import { InputDomRef } from '@ui5/webcomponents-react';

export const CreateProjectWorkspaceDialogWrapper: React.FC<{
  spyFormBody?: (data: any) => {};
}> = ({ spyFormBody }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [members, setMembers] = useState<Member[]>([
    {
      name: 'user1@example.com',
      roles: [MemberRoles.admin],
      kind: 'User',
    },
  ]);
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const nameInputRef = useRef<InputDomRef>(null);
  const displayNameInputRef = useRef<InputDomRef>(null);
  const chargingTargetInputRef = useRef<InputDomRef>(null);
  const handleCreate = async () => {
    const payload: onCreatePayload = {
      name: nameInputRef.current?.value || '',
      displayName: displayNameInputRef.current?.value || '',
      chargingTarget: chargingTargetInputRef.current?.value || '',
      members: members,
    };

    spyFormBody?.(payload);
    setIsOpen(false);
  };
  return (
    <CreateProjectWorkspaceDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      titleText="Create Project Workspace"
      errorDialogRef={errorDialogRef}
      members={members}
      setMembers={setMembers}
      nameInputRef={nameInputRef}
      displayNameInputRef={displayNameInputRef}
      chargingTargetInputRef={chargingTargetInputRef}
      onCreate={handleCreate}
    />
  );
};

describe('CreateProjectWorkspaceDialog', () => {
  it('checks if there is existing member and delete it', () => {
    cy.mount(<CreateProjectWorkspaceDialogWrapper />, {});
    cy.get('div[data-component-name="AnalyticalTableContainerWithScrollbar"]')
      .contains('user1@example.com')
      .should('be.visible');
    cy.get('ui5-button[icon="delete"]').find('button').click({ force: true });
    cy.get('div[data-component-name="AnalyticalTableContainerWithScrollbar"]')
      .contains('user1@example.com')
      .should('not.exist');
  });

  it('should add a new member and display it in the table', () => {
    cy.mount(<CreateProjectWorkspaceDialogWrapper />, {});
    cy.get('ui5-input[id*="member-email-input"]')
      .find('input[id*="inner"]')
      .type('user2@example.com', { force: true });
    cy.get('ui5-button:contains("Add")').click({ force: true });
    cy.get('div[data-component-name="AnalyticalTableContainerWithScrollbar"]')
      .contains('user2@example.com')
      .should('be.visible');
  });

  it('fills the form, adds user and checks if the request body is correct', () => {
    const stubFn = cy.stub().as('stubFn');
    cy.mount(<CreateProjectWorkspaceDialogWrapper spyFormBody={stubFn} />, {});

    cy.get('ui5-input[id*="project-name-input"]')
      .find('input[id*="inner"]')
      .type('brand-new-workspace-test-01', { force: true });
    cy.get('ui5-input[id*="project-displayname-input"]')
      .find('input[id*="inner"]')
      .type('Brand new workspace number one', { force: true });
    cy.get('ui5-input[id*="project-chargingtarget-input"]')
      .find('input[id*="inner"]')
      .type('Charging target 1000', { force: true });
    cy.get('ui5-input[id*="member-email-input"]')
      .find('input[id*="inner"]')
      .type('user2@example.com', { force: true });
    cy.get('ui5-button:contains("Add")').click({ force: true });
    cy.get('ui5-button:contains("Create")').click({ force: true });

    cy.get('@stubFn').should('have.been.calledWith', {
      name: 'brand-new-workspace-test-01',
      displayName: 'Brand new workspace number one',
      chargingTarget: 'Charging target 1000',
      members: [
        {
          name: 'user1@example.com',
          roles: [MemberRoles.admin],
          kind: 'User',
        },
        {
          name: 'user2@example.com',
          roles: [MemberRoles.viewer],
          kind: 'User',
        },
      ],
    });
  });

  it('should handle multiple member additions', () => {
    cy.mount(<CreateProjectWorkspaceDialogWrapper />, {});

    const newMembers = ['user3@example.com', 'user4@example.com'];
    newMembers.forEach((email) => {
      cy.get('ui5-input[id*="member-email-input"]')
        .find('input[id*="inner"]')
        .clear({ force: true })
        .type(email, { force: true });
      cy.get('ui5-button:contains("Add")').click({ force: true });
    });

    newMembers.forEach((email) => {
      cy.get('div[data-component-name="AnalyticalTableContainerWithScrollbar"]')
        .contains(email)
        .should('be.visible');
    });
  });

  it('should close dialog when cancel is clicked', () => {
    cy.mount(<CreateProjectWorkspaceDialogWrapper />, {});

    cy.get('ui5-dialog').should('be.visible');
    cy.get('ui5-button:contains("Cancel")').click({ force: true });
    cy.get('ui5-dialog').should('not.be.visible');
  });
});
