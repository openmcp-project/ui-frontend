import { useMutation } from '@apollo/client/react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { MouseEventHandler, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CrossplaneData } from '../../types/Crossplane.ts';
import type { UseManagedServicesQueryResult } from '../Kpi/useManagedServicesQuery.ts';
import { useManagedServicesQuery } from '../Kpi/useManagedServicesQuery.ts';
import { CrossplaneInstallDialog } from './CrossplaneInstallDialog.tsx';
import { CreateCrossplaneMutation } from './useCreateCrossplaneMutation.ts';
import { UpdateCrossplaneMutation } from './useUpdateCrossplaneMutation.ts';

vi.mock('@apollo/client/react', () => ({ useMutation: vi.fn() }));
vi.mock('../Kpi/useManagedServicesQuery.ts', () => ({ useManagedServicesQuery: vi.fn() }));
vi.mock('../../../../context/ToastContext.tsx', () => ({ useToast: () => ({ show: vi.fn() }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('../../../../components/Yaml/YamlViewer.tsx', () => ({ YamlViewer: () => null }));
vi.mock('yaml', () => ({ stringify: () => '' }));
vi.mock('@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js', () => ({}));
vi.mock('@ui5/webcomponents-fiori/dist/types/IllustrationMessageDesign.js', () => ({ default: {} }));
vi.mock('@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js', () => ({ default: {} }));
vi.mock('@ui5/webcomponents/dist/types/ButtonDesign.js', () => ({ default: {} }));

vi.mock('@ui5/webcomponents-react', () => ({
  Dialog: ({ children, footer, open }: { children?: ReactNode; footer?: ReactNode; open?: boolean }) =>
    open ? (
      <div data-testid="dialog">
        {children}
        {footer}
      </div>
    ) : null,
  Bar: ({ endContent }: { endContent?: ReactNode }) => <div>{endContent}</div>,
  Button: ({ children, onClick }: { children?: ReactNode; onClick?: MouseEventHandler }) => (
    <button onClick={onClick}>{children}</button>
  ),
  FlexBox: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Title: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  IllustratedMessage: ({ titleText }: { titleText?: string }) => (
    <div data-testid="illustrated-message">{titleText}</div>
  ),
  CheckBox: ({
    id,
    text,
    checked,
    onChange,
    disabled,
  }: {
    id?: string;
    text?: string;
    checked?: boolean;
    onChange?: (e: { target: { id: string | undefined } }) => void;
    disabled?: boolean;
  }) => (
    <input
      type="checkbox"
      id={id}
      aria-label={text}
      checked={!!checked}
      disabled={!!disabled}
      onChange={() => onChange?.({ target: { id } })}
    />
  ),
  Select: ({
    children,
    onChange,
    disabled,
    className,
  }: {
    children?: ReactNode;
    onChange?: (e: { detail: { selectedOption: HTMLOptionElement } }) => void;
    disabled?: boolean;
    valueState?: string;
    valueStateMessage?: ReactNode;
    className?: string;
  }) => (
    <select
      disabled={!!disabled}
      className={className}
      onChange={(e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        onChange?.({ detail: { selectedOption } });
      }}
    >
      {children}
    </select>
  ),
  Option: ({
    children,
    'data-version': dataVersion,
    'data-name': dataName,
  }: {
    children?: ReactNode;
    'data-version'?: string;
    'data-name'?: string;
  }) => (
    <option value={dataVersion ?? ''} data-version={dataVersion} data-name={dataName}>
      {children}
    </option>
  ),
}));

const MOCK_SERVICES = {
  managedServicesData: null,
  isLoading: false,
  error: null,
  services: [
    {
      name: 'crossplane',
      kind: 'Crossplane',
      apiVersion: 'crossplane.services.openmcp.cloud/v1alpha1',
      versions: [{ version: 'v2.0.2-1' }, { version: 'v1.20.1-1' }],
    },
  ],
  crossplaneProviders: [
    { name: 'provider-btp', versions: [{ version: '1.3.0' }] },
    { name: 'provider-helm', versions: [{ version: '1.0.1' }] },
  ],
};

const EXPECTED_BASE_OBJECT = {
  apiVersion: 'crossplane.services.openmcp.cloud/v1alpha1',
  kind: 'Crossplane',
  metadata: { name: 'test-mcp', namespace: 'test-namespace' },
};

describe('CrossplaneInstallDialog', () => {
  let createCrossplane: ReturnType<typeof vi.fn>;
  let updateCrossplane: ReturnType<typeof vi.fn>;

  afterEach(cleanup);

  beforeEach(() => {
    createCrossplane = vi.fn().mockResolvedValue({});
    updateCrossplane = vi.fn().mockResolvedValue({});

    vi.mocked(useMutation).mockImplementation(((doc: unknown) => {
      const result = {} as useMutation.Result<unknown>;
      if (doc === CreateCrossplaneMutation) return [createCrossplane, result];
      if (doc === UpdateCrossplaneMutation) return [updateCrossplane, result];
      return [vi.fn(), result];
    }) as unknown as typeof useMutation);

    vi.mocked(useManagedServicesQuery).mockReturnValue(MOCK_SERVICES as UseManagedServicesQueryResult);
  });

  const DEFAULT_PROPS = {
    open: true,
    onClose: vi.fn(),
    mcpName: 'test-mcp',
    mcpNamespace: 'test-namespace',
  };

  describe('install mode', () => {
    it('calls createCrossplane with version and one provider', async () => {
      render(<CrossplaneInstallDialog {...DEFAULT_PROPS} />);

      const [versionSelect, btpVersionSelect] = screen.getAllByRole('combobox');

      fireEvent.change(versionSelect, { target: { value: 'v2.0.2-1' } });
      fireEvent.click(screen.getByRole('checkbox', { name: 'provider-btp' }));
      fireEvent.change(btpVersionSelect, { target: { value: '1.3.0' } });
      fireEvent.click(screen.getByText('common.applyChanges'));

      await waitFor(() =>
        expect(createCrossplane).toHaveBeenCalledWith({
          variables: {
            namespace: 'test-namespace',
            object: {
              ...EXPECTED_BASE_OBJECT,
              spec: {
                version: 'v2.0.2-1',
                providers: [{ name: 'provider-btp', version: '1.3.0' }],
              },
            },
          },
        }),
      );
    });

    it('calls createCrossplane with multiple providers', async () => {
      render(<CrossplaneInstallDialog {...DEFAULT_PROPS} />);

      const [versionSelect, btpVersionSelect, helmVersionSelect] = screen.getAllByRole('combobox');

      fireEvent.change(versionSelect, { target: { value: 'v2.0.2-1' } });
      fireEvent.click(screen.getByRole('checkbox', { name: 'provider-btp' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'provider-helm' }));
      fireEvent.change(btpVersionSelect, { target: { value: '1.3.0' } });
      fireEvent.change(helmVersionSelect, { target: { value: '1.0.1' } });
      fireEvent.click(screen.getByText('common.applyChanges'));

      await waitFor(() =>
        expect(createCrossplane).toHaveBeenCalledWith({
          variables: {
            namespace: 'test-namespace',
            object: {
              ...EXPECTED_BASE_OBJECT,
              spec: {
                version: 'v2.0.2-1',
                providers: [
                  { name: 'provider-btp', version: '1.3.0' },
                  { name: 'provider-helm', version: '1.0.1' },
                ],
              },
            },
          },
        }),
      );
    });

    it('calls createCrossplane with empty providers when none are selected', async () => {
      render(<CrossplaneInstallDialog {...DEFAULT_PROPS} />);

      const [versionSelect] = screen.getAllByRole('combobox');

      fireEvent.change(versionSelect, { target: { value: 'v2.0.2-1' } });
      fireEvent.click(screen.getByText('common.applyChanges'));

      await waitFor(() =>
        expect(createCrossplane).toHaveBeenCalledWith({
          variables: {
            namespace: 'test-namespace',
            object: {
              ...EXPECTED_BASE_OBJECT,
              spec: { version: 'v2.0.2-1', providers: [] },
            },
          },
        }),
      );
    });

    it('does not submit when crossplane version is missing', async () => {
      render(<CrossplaneInstallDialog {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByText('common.applyChanges'));

      await waitFor(() => expect(createCrossplane).not.toHaveBeenCalled());
    });
  });

  describe('edit mode', () => {
    it('calls updateCrossplane with pre-loaded initial data', async () => {
      const initialData: CrossplaneData = {
        isInstalled: true,
        version: 'v1.20.1-1',
        providers: [{ name: 'provider-btp', version: '1.3.0' }],
      };

      render(<CrossplaneInstallDialog {...DEFAULT_PROPS} mode="edit" initialData={initialData} />);

      fireEvent.click(screen.getByText('common.applyChanges'));

      await waitFor(() =>
        expect(updateCrossplane).toHaveBeenCalledWith({
          variables: {
            namespace: 'test-namespace',
            name: 'test-mcp',
            object: {
              ...EXPECTED_BASE_OBJECT,
              spec: {
                version: 'v1.20.1-1',
                providers: [{ name: 'provider-btp', version: '1.3.0' }],
              },
            },
          },
        }),
      );
    });

    it('calls updateCrossplane reflecting deselected provider', async () => {
      const initialData: CrossplaneData = {
        isInstalled: true,
        version: 'v1.20.1-1',
        providers: [{ name: 'provider-btp', version: '1.3.0' }],
      };

      render(<CrossplaneInstallDialog {...DEFAULT_PROPS} mode="edit" initialData={initialData} />);

      fireEvent.click(screen.getByRole('checkbox', { name: 'provider-btp' }));
      fireEvent.click(screen.getByText('common.applyChanges'));

      await waitFor(() =>
        expect(updateCrossplane).toHaveBeenCalledWith({
          variables: {
            namespace: 'test-namespace',
            name: 'test-mcp',
            object: {
              ...EXPECTED_BASE_OBJECT,
              spec: { version: 'v1.20.1-1', providers: [] },
            },
          },
        }),
      );
    });
  });
});
