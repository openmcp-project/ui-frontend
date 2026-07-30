import '@ui5/webcomponents-cypress-commands';
import { useState } from 'react';
import { Member } from '../../../../lib/api/types/shared/members.ts';
import { ExtraProviderMetadata } from '../../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import { IdentityProvidersStep } from './IdentityProvidersStep.tsx';

// A thin stateful wrapper so the component behaves like it does inside the real wizard,
// where the container owns members/providers state and passes down setters.
function StatefulIdentityProvidersStep({
  initialMembers = [],
  initialProviders = [],
  initialDefaultProviderEnabled = true,
}: {
  initialMembers?: Member[];
  initialProviders?: ExtraProviderMetadata[];
  initialDefaultProviderEnabled?: boolean;
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [providers, setProviders] = useState<ExtraProviderMetadata[]>(initialProviders);
  const [isDefaultProviderEnabled, setIsDefaultProviderEnabled] = useState(initialDefaultProviderEnabled);

  return (
    <IdentityProvidersStep
      members={members}
      providers={providers}
      isDefaultProviderEnabled={isDefaultProviderEnabled}
      onMembersChange={setMembers}
      onProvidersChange={setProviders}
      onDefaultProviderEnabledChange={setIsDefaultProviderEnabled}
    />
  );
}

describe('IdentityProvidersStep', () => {
  before(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('module is not defined')) return false;
    });
  });

  it('always renders the default provider group', () => {
    cy.mount(<StatefulIdentityProvidersStep />);
    cy.contains('Default identity provider').should('exist');
  });

  it('locks the default-provider checkbox when there are no extra providers', () => {
    cy.mount(<StatefulIdentityProvidersStep />);
    cy.get('[data-testid="default-provider-enabled-checkbox"]').should('have.attr', 'disabled');
  });

  it('adds a new provider group after saving the Add Identity Provider dialog', () => {
    cy.mount(<StatefulIdentityProvidersStep />);

    cy.contains('custom').should('not.exist');
    cy.get('[data-testid="add-provider-button"]').click();
    cy.get('[data-testid="provider-name-input"]').typeIntoUi5Input('custom');
    cy.get('[data-testid="provider-issuer-input"]').typeIntoUi5Input('https://example.com');
    cy.get('[data-testid="provider-client-id-input"]').typeIntoUi5Input('client-id-1');
    cy.get('ui5-dialog[open]').contains('ui5-button', 'Add Identity Provider').click();

    cy.contains('custom').should('exist');
    cy.get('[data-testid="default-provider-enabled-checkbox"]').should('not.have.attr', 'disabled');
  });

  it('deleting a provider removes its group and its members', () => {
    const providers: ExtraProviderMetadata[] = [
      { name: 'custom', issuer: 'https://example.com', clientID: 'client-id-1' },
    ];
    const members: Member[] = [{ kind: 'User', name: 'bob@example.com', roles: ['cluster-admin'], provider: 'custom' }];

    cy.mount(<StatefulIdentityProvidersStep initialProviders={providers} initialMembers={members} />);

    cy.contains('bob@example.com').should('exist');
    cy.get('[data-testid="delete-provider-custom"]').click();
    cy.contains('Its 1 member will also be removed').should('exist');
    cy.get('[data-testid="confirm-delete-provider-button"]').click();

    cy.get('[data-testid="delete-provider-custom"]').should('not.exist');
    cy.contains('bob@example.com').should('not.exist');
  });

  it('re-enables the default provider when the last remaining provider is deleted while it was disabled', () => {
    const providers: ExtraProviderMetadata[] = [
      { name: 'custom', issuer: 'https://example.com', clientID: 'client-id-1' },
    ];

    cy.mount(<StatefulIdentityProvidersStep initialProviders={providers} initialDefaultProviderEnabled={false} />);

    cy.get('[data-testid="default-provider-enabled-checkbox"]').should('not.have.attr', 'checked');
    cy.get('[data-testid="delete-provider-custom"]').click();
    cy.get('[data-testid="confirm-delete-provider-button"]').click();

    cy.get('[data-testid="default-provider-enabled-checkbox"]').should('have.attr', 'checked');
  });

  it('adding a member from inside a custom provider panel keeps it scoped to that provider (regression)', () => {
    const providers: ExtraProviderMetadata[] = [
      { name: 'custom', issuer: 'https://example.com', clientID: 'client-id-1' },
    ];

    cy.mount(<StatefulIdentityProvidersStep initialProviders={providers} />);

    cy.get('[data-testid="provider-custom-add-member-button"]').first().click();
    cy.get('[data-testid="provider-custom-member-email-input"]').typeIntoUi5Input('bob@example.com');
    cy.get('ui5-dialog[open]').contains('ui5-button', 'Add User or Group').click();

    cy.contains('ui5-panel', 'custom').should('contain', 'bob@example.com');
    cy.contains('ui5-panel', 'Default identity provider').should('not.contain', 'bob@example.com');
  });

  it('renaming a provider re-tags its existing members onto the new name', () => {
    const providers: ExtraProviderMetadata[] = [
      { name: 'custom', issuer: 'https://example.com', clientID: 'client-id-1' },
    ];
    const members: Member[] = [{ kind: 'User', name: 'bob@example.com', roles: ['cluster-admin'], provider: 'custom' }];

    cy.mount(<StatefulIdentityProvidersStep initialProviders={providers} initialMembers={members} />);

    cy.get('[data-testid="edit-provider-custom"]').click();
    cy.get('[data-testid="provider-name-input"]').clearUi5Input().typeIntoUi5Input('renamed');
    cy.get('[data-testid="save-provider-button"]').click();

    cy.contains('ui5-panel', 'renamed').should('contain', 'bob@example.com');
    cy.contains('custom').should('not.exist');
  });

  it('shows a validation error when no member is assigned anywhere and blocks once one is added', () => {
    cy.mount(<StatefulIdentityProvidersStep initialMembers={[]} />);

    cy.get('[data-testid="no-members-error"]').should('exist');

    cy.get('[data-testid="default-provider-add-member-button"]').first().click();
    cy.get('[data-testid="default-provider-member-email-input"]').typeIntoUi5Input('alice@example.com');
    cy.get('ui5-dialog[open]').contains('ui5-button', 'Add User or Group').click();

    cy.get('[data-testid="no-members-error"]').should('not.exist');
  });

  it('shows the validation error again after disabling the default provider drops its only members', () => {
    const providers: ExtraProviderMetadata[] = [
      { name: 'custom', issuer: 'https://example.com', clientID: 'client-id-1' },
    ];
    const members: Member[] = [{ kind: 'User', name: 'alice@example.com', roles: ['cluster-admin'] }];

    cy.mount(<StatefulIdentityProvidersStep initialProviders={providers} initialMembers={members} />);

    cy.get('[data-testid="no-members-error"]').should('not.exist');
    cy.get('[data-testid="default-provider-enabled-checkbox"]').click();
    cy.get('[data-testid="no-members-error"]').should('exist');
  });

  it('hides the default-provider members table when it is disabled', () => {
    const providers: ExtraProviderMetadata[] = [
      { name: 'custom', issuer: 'https://example.com', clientID: 'client-id-1' },
    ];
    const members: Member[] = [{ kind: 'User', name: 'alice@example.com', roles: ['cluster-admin'] }];

    cy.mount(
      <StatefulIdentityProvidersStep
        initialProviders={providers}
        initialMembers={members}
        initialDefaultProviderEnabled={false}
      />,
    );

    cy.contains('alice@example.com').should('not.exist');
    cy.contains('The default identity provider is disabled').should('exist');
  });
});
