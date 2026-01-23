/* eslint-disable @typescript-eslint/no-explicit-any */
import { MemoryRouter } from 'react-router-dom';
import { McpSecrets } from './McpSecrets';
import { useApiResource } from '../../lib/api/useApiResource.ts';
import { SplitterProvider } from '../Splitter/SplitterContext.tsx';

describe('McpSecrets', () => {
  const calls: any[] = [];

  const fakeUseApiResource: typeof useApiResource = (resource: any): any => {
    calls.push(resource);

    const path = typeof resource?.path === 'string' ? resource.path : '';

    if (path === '/api/v1/namespaces') {
      return {
        data: [{ metadata: { name: 'default' } }, { metadata: { name: 'kube-system' } }],
        error: undefined,
        isLoading: false,
      };
    }

    if (path === '/api/v1/namespaces/default/secrets') {
      return {
        data: [
          {
            metadata: { name: 'sec-1', namespace: 'default', creationTimestamp: '2024-01-01T00:00:00Z' },
            type: 'Opaque',
          },
        ],
        error: undefined,
        isLoading: false,
      };
    }

    if (path === '/api/v1/namespaces/kube-system/secrets') {
      return {
        data: [],
        error: undefined,
        isLoading: false,
      };
    }

    return { data: [], error: undefined, isLoading: false };
  };

  beforeEach(() => {
    calls.length = 0;
  });

  it('loads secrets for default namespace by default', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <McpSecrets useApiResource={fakeUseApiResource as any} />
        </SplitterProvider>
      </MemoryRouter>,
    );

    cy.contains('sec-1').should('be.visible');
    cy.contains('Opaque').should('be.visible');
  });

  it('treats 403 as empty table', () => {
    const forbiddenUseApiResource: typeof useApiResource = (resource: any): any => {
      const path = typeof resource?.path === 'string' ? resource.path : '';
      if (path === '/api/v1/namespaces') {
        return { data: [{ metadata: { name: 'default' } }], error: undefined, isLoading: false };
      }
      if (path === '/api/v1/namespaces/default/secrets') {
        return { data: undefined, error: { status: 403, message: '403' }, isLoading: false };
      }
      return { data: [], error: undefined, isLoading: false };
    };

    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <McpSecrets useApiResource={forbiddenUseApiResource as any} />
        </SplitterProvider>
      </MemoryRouter>,
    );

    cy.contains(/no data/i).should('exist');
    cy.contains('403').should('not.exist');
  });

  it('switching namespace triggers loading secrets for that namespace', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <McpSecrets useApiResource={fakeUseApiResource as any} />
        </SplitterProvider>
      </MemoryRouter>,
    );

    cy.contains('sec-1').should('be.visible');

    cy.get('ui5-select').click();
    cy.contains('ui5-option', 'kube-system').click();

    cy.then(() => {
      const paths = calls.map((r) => r?.path).filter(Boolean);
      expect(paths).to.include('/api/v1/namespaces/kube-system/secrets');
    });
  });
});
