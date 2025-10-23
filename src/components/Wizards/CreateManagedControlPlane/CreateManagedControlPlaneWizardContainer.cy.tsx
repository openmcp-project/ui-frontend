import { CreateManagedControlPlaneWizardContainer } from './CreateManagedControlPlaneWizardContainer.tsx';
import { useCreateManagedControlPlane } from '../../../hooks/useCreateManagedControlPlane.tsx';
import { CreateManagedControlPlaneType } from '../../../lib/api/types/crate/createManagedControlPlane.ts';
import { useAuthOnboarding } from '../../../spaces/onboarding/auth/AuthContextOnboarding.tsx';

describe('CreateManagedControlPlaneWizardContainer', () => {
  let createMutationPayload: CreateManagedControlPlaneType | null = null;

  const fakeUseCreateManagedControlPlane: typeof useCreateManagedControlPlane = () => ({
    mutate: async (data: CreateManagedControlPlaneType): Promise<CreateManagedControlPlaneType> => {
      createMutationPayload = data;
      return data;
    },
  });
  const fakeUseAuthOnboarding = (() => ({
    user: {
      email: 'name@domain.com',
    },
  })) as typeof useAuthOnboarding;

  beforeEach(() => {
    createMutationPayload = null;
  });

  it('creates a Managed Control Plane', () => {
    cy.mount(
      <CreateManagedControlPlaneWizardContainer
        useCreateManagedControlPlane={fakeUseCreateManagedControlPlane}
        useAuthOnboarding={fakeUseAuthOnboarding}
        isOpen={true}
        setIsOpen={() => {}}
      />,
    );

    const expMutationPayload: CreateManagedControlPlaneType = {
      apiVersion: 'core.openmcp.cloud/v1alpha1',
      kind: 'ManagedControlPlane',
      metadata: {
        name: 'some-text',
        namespace: '--ws-',
        annotations: {
          'openmcp.cloud/display-name': '',
        },
        labels: {
          'openmcp.cloud.sap/charging-target-type': '',
          'openmcp.cloud.sap/charging-target': '',
        },
      },
      spec: {
        authentication: {
          enableSystemIdentityProvider: true,
        },
        components: {
          apiServer: {
            type: 'GardenerDedicated',
          },
        },
        authorization: {
          roleBindings: [
            {
              role: 'admin',
              subjects: [
                {
                  kind: 'User',
                  name: 'openmcp:name@domain.com',
                },
              ],
            },
          ],
        },
      },
    };

    cy.get('#name').find(' input[id*="inner"]').type('some-text');
    cy.get('ui5-button').contains('Next').click(); // navigate to Members
    cy.get('ui5-button').contains('Next').click(); // navigate to Component Selection
    cy.get('ui5-button').contains('Next').click(); // navigate to Summarize
    cy.get('ui5-button').contains('Create').click();
    cy.then(() => cy.wrap(createMutationPayload).deepEqualJson(expMutationPayload));
  });
});
