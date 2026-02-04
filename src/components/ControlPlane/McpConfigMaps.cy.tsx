/* eslint-disable @typescript-eslint/no-explicit-any */
import { MemoryRouter } from 'react-router-dom';
import { McpConfigMaps } from './McpConfigMaps';
import { useApiResource } from '../../lib/api/useApiResource.ts';
import { SplitterProvider } from '../Splitter/SplitterContext.tsx';

describe('McpConfigMaps', () => {
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

    if (path === '/api/v1/namespaces/default/configmaps') {
      return {
        data: [
          {
            metadata: { name: 'cm-1', namespace: 'default', creationTimestamp: '2024-01-01T00:00:00Z' },
            data: { a: 'b' },
          },
        ],
        error: undefined,
        isLoading: false,
      };
    }

    if (path === '/api/v1/namespaces/kube-system/configmaps') {
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

  it('loads namespaces and shows configmaps for default namespace by default', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <McpConfigMaps useApiResource={fakeUseApiResource as any} />
        </SplitterProvider>
      </MemoryRouter>,
    );

    cy.contains('cm-1').should('be.visible');
  });

  it('switching namespace triggers loading configmaps for that namespace', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <McpConfigMaps useApiResource={fakeUseApiResource as any} />
        </SplitterProvider>
      </MemoryRouter>,
    );

    cy.contains('cm-1').should('be.visible');

    // Open dropdown and pick kube-system
    cy.get('ui5-select').click();
    cy.contains('ui5-option', 'kube-system').click();

    cy.then(() => {
      const paths = calls.map((r) => r?.path).filter(Boolean);
      expect(paths).to.include('/api/v1/namespaces/kube-system/configmaps');
    });
  });

  it('treats 403 as empty table', () => {
    const forbiddenUseApiResource: typeof useApiResource = (resource: any): any => {
      const path = typeof resource?.path === 'string' ? resource.path : '';
      if (path === '/api/v1/namespaces') {
        return { data: [{ metadata: { name: 'default' } }], error: undefined, isLoading: false };
      }
      if (path === '/api/v1/namespaces/default/configmaps') {
        return { data: undefined, error: { status: 403, message: '403' }, isLoading: false };
      }
      return { data: [], error: undefined, isLoading: false };
    };

    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <McpConfigMaps useApiResource={forbiddenUseApiResource as any} />
        </SplitterProvider>
      </MemoryRouter>,
    );

    cy.contains('No data').should('exist');
    cy.contains('403').should('not.exist');
  });
});
