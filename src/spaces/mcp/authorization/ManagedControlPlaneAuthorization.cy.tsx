import { useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ManagedControlPlaneAuthorization } from './ManagedControlPlaneAuthorization.tsx';
import { McpContext } from '../../../lib/shared/McpContext.tsx';
import type { AccessState } from '../../../lib/api/access/useCanI.ts';
import { clearAllDenied, isDenied, rememberDenied } from '../../../lib/api/access/downstreamAccessStore.ts';
import { FrontendConfigContext } from '../../../context/FrontendConfigContext.tsx';
import { mockedFrontendConfig } from '../../../utils/testing.ts';

function Gate() {
  const [state, setState] = useState<AccessState>('unknown');
  return (
    <>
      <button data-testid="deny" onClick={() => setState('denied')}>
        Deny
      </button>
      <button data-testid="allow" onClick={() => setState('allowed')}>
        Allow
      </button>
      <ManagedControlPlaneAuthorization
        useAuthorizationCheckV2={() => ({ state, isLoading: state === 'unknown', isUnauthorized: state === 'denied' })}
      >
        <div data-testid="content">Control plane content</div>
      </ManagedControlPlaneAuthorization>
    </>
  );
}

describe('v2 page gate persistence', () => {
  beforeEach(clearAllDenied);

  it('renders pending content, preserves remembered denies on unknown, and clears only the successful IdP', () => {
    rememberDenied('p/w/cp/custom');
    rememberDenied('p/w/cp/openmcp');
    cy.mount(
      <FrontendConfigContext.Provider value={mockedFrontendConfig}>
        <McpContext.Provider value={{ project: 'p', workspace: 'w', name: 'cp', isV2: true }}>
          <MemoryRouter initialEntries={['/projects/p/workspaces/w/cp?idp=custom']}>
            <Routes>
              <Route path="/projects/:projectName/workspaces/:workspaceName/:controlPlaneName" element={<Gate />} />
            </Routes>
          </MemoryRouter>
        </McpContext.Provider>
      </FrontendConfigContext.Provider>,
    );
    cy.get('[data-testid="content"]').should('exist');
    cy.then(() => expect(isDenied('p/w/cp/custom')).to.equal(true));
    cy.get('[data-testid="deny"]').click();
    cy.get('[data-testid="content"]').should('not.exist');
    cy.contains('Access Denied').should('exist');
    cy.get('[data-testid="allow"]').click();
    cy.get('[data-testid="content"]').should('exist');
    cy.then(() => {
      expect(isDenied('p/w/cp/custom')).to.equal(false);
      expect(isDenied('p/w/cp/openmcp')).to.equal(true);
    });
  });
});
