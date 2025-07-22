import React, { useState, useRef } from 'react';
import { CreateProjectWorkspaceDialog, OnCreatePayload } from './CreateProjectWorkspaceDialog';
import { MemberRoles } from '../../lib/api/types/shared/members';
import { ErrorDialogHandle } from '../Shared/ErrorMessageBox';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { validationSchemaProjectWorkspace } from '../../lib/api/validations/schemas.ts';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';

export const CreateProjectWorkspaceDialogWrapper: React.FC<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spyFormBody?: (data: any) => object;
}> = ({ spyFormBody }) => {
  const [isOpen, setIsOpen] = useState(true);

  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<CreateDialogProps>({
    resolver: zodResolver(validationSchemaProjectWorkspace),
    defaultValues: {
      name: '',
      displayName: '',
      chargingTarget: '',
      members: [{ name: 'user1@example.com', roles: [MemberRoles.admin], kind: 'User' }],
      chargingTargetType: 'btp',
    },
  });

  const handleCreate = async ({ name, displayName, chargingTarget, members }: OnCreatePayload) => {
    const payload: OnCreatePayload = {
      name: name,
      displayName: displayName,
      chargingTarget: chargingTarget,
      members: members,
    };

    spyFormBody?.(payload);
    setIsOpen(false);
  };
  return (
    <CreateProjectWorkspaceDialog
      watch={watch}
      type={'workspace'}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      titleText="Create Workspace"
      errorDialogRef={errorDialogRef}
      members={watch('members')}
      register={register}
      errors={errors}
      setValue={setValue}
      onCreate={handleSubmit(handleCreate)}
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
    cy.get('span[id="members-error"]').contains('You need to have at least one member assigned.').should('be.visible');
  });

  it('should add a new member and display it in the table', () => {
    cy.mount(<CreateProjectWorkspaceDialogWrapper />, {});
    cy.get('ui5-input[id*="member-email-input"]').find('input[id*="inner"]').type('user2@example.com', { force: true });
    cy.get('ui5-button:contains("Add")').click({ force: true });
    cy.get('div[data-component-name="AnalyticalTableContainerWithScrollbar"]')
      .contains('user2@example.com')
      .should('be.visible');
  });

  it('fills the form, adds user and checks if the request body is correct', () => {
    const stubFn = cy.stub().as('stubFn');
    cy.mount(<CreateProjectWorkspaceDialogWrapper spyFormBody={stubFn} />, {});

    cy.get('ui5-input[id*="name"]').find('input[id*="inner"]').type('brand--01', { force: true });
    cy.get('ui5-input[id*="displayName"]')
      .find('input[id*="inner"]')
      .type('Brand new workspace number one', { force: true });
    cy.get('ui5-input[id*="chargingTarget"]')
      .find('input[id*="inner"]')
      .type('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', { force: true });
    cy.get('ui5-input[id*="email"]').find('input[id*="inner"]').type('user2@example.com', { force: true });
    cy.get('ui5-button:contains("Add")').click({ force: true });
    cy.get('ui5-button:contains("Create")').click({ force: true });

    cy.get('@stubFn').should('have.been.calledWith', {
      name: 'brand--01',
      displayName: 'Brand new workspace number one',
      chargingTarget: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
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
      cy.get('div[data-component-name="AnalyticalTableContainerWithScrollbar"]').contains(email).should('be.visible');
    });
  });

  it('should close dialog when cancel is clicked', () => {
    cy.mount(<CreateProjectWorkspaceDialogWrapper />, {});

    cy.get('ui5-dialog').should('be.visible');
    cy.get('ui5-button:contains("Cancel")').click({ force: true });
    cy.get('ui5-dialog').should('not.be.visible');
  });
});
