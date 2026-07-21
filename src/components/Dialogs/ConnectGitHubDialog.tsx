import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/connected.js';
import '@ui5/webcomponents-icons/dist/delete.js';
import '@ui5/webcomponents-icons/dist/edit.js';
import '@ui5/webcomponents-icons/dist/source-code.js';
import '@ui5/webcomponents-icons/dist/world.js';
import type { WizardStepChangeEventDetail } from '@ui5/webcomponents-fiori/dist/Wizard.js';
import type { MultiComboBoxSelectionChangeEventDetail } from '@ui5/webcomponents/dist/MultiComboBox.js';
import type { SelectChangeEventDetail } from '@ui5/webcomponents/dist/Select.js';
import {
  AnalyticalTable,
  Bar,
  BusyIndicator,
  Button,
  Dialog,
  FlexBox,
  Input,
  InputDomRef,
  Label,
  MessageStrip,
  MultiComboBox,
  MultiComboBoxDomRef,
  MultiComboBoxItem,
  Option,
  Select,
  SelectDomRef,
  SplitterElement,
  SplitterLayout,
  Text,
  Ui5CustomEvent,
  Wizard,
  WizardStep,
} from '@ui5/webcomponents-react';
import { AnalyticalTableCellInstance, AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { stringify } from 'yaml';
import { useFrontendConfig } from '../../context/FrontendConfigContext.tsx';
import { projectnameToNamespace } from '../../utils/index.ts';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';

const YamlViewer = lazy(() => import('../Yaml/YamlViewer.tsx').then((m) => ({ default: m.YamlViewer })));

type Step = 'installation' | 'waiting' | 'repository' | 'propagate';
type InstallationStatus = 'ready' | 'pending' | 'none';

interface AppInstallation {
  id: string;
  name: string;
  installationId: string;
  status: InstallationStatus;
}

interface GitRepository {
  id: string;
  name: string;
  url: string;
  branch: string;
  path: string;
  scopeKeys: string[];
  appInstallationId: string;
}

interface ScopeItem {
  key: string;
  label: string;
  namespace: string;
}

interface PropagateEntry {
  kind: 'ControlPlane';
  name?: string;
  matchLabels?: Record<string, string>;
}

// Mock — replace with real queries when CRDs exist
const MOCK_WORKSPACES = ['workspace-dev', 'workspace-staging', 'workspace-prod'];
const MOCK_CONTROL_PLANES = ['mcp-dev', 'mcp-staging', 'mcp-prod', 'mcp-infra'];
const PROJECT_SCOPE_KEY = '__project__';
const ONBOARDING_CLUSTER_KEY = '__onboarding__';
const INITIAL_INSTALLATIONS: AppInstallation[] = [
  { id: '1', name: 'github-cloud', installationId: '87654321', status: 'ready' },
];

interface ConnectGitHubDialogProps {
  isOpen: boolean;
  projectName: string;
  onClose: () => void;
}

function statusLabel(status: InstallationStatus, t: (k: string) => string): string {
  if (status === 'ready') return t('ConnectGitHubDialog.statusReady');
  if (status === 'pending') return t('ConnectGitHubDialog.statusPending');
  return t('ConnectGitHubDialog.statusUnknown');
}

function buildAppInstallationYaml(name: string, ns: string, installationId: string): string {
  return stringify({
    apiVersion: 'github.gitops.open-control-plane.io/v1alpha1',
    kind: 'AppInstallation',
    metadata: { name: name || '<name>', namespace: ns || '<project-namespace>' },
    spec: { appInstallationID: installationId || '<app-installation-id>' },
  });
}

function buildGitRepositoryYaml(
  repo: Partial<GitRepository>,
  appInstallationName: string,
  namespace: string,
  propagateEntries: PropagateEntry[],
): string {
  const spec: Record<string, unknown> = {
    url: repo.url || '<https://github.com/org/repo>',
    ref: { branch: repo.branch || 'main' },
    path: repo.path || './',
    credentialRef: {
      name: appInstallationName || '<app-installation-name>',
      kind: 'AppInstallation',
      group: 'github.gitops.open-control-plane.io',
    },
  };
  if (propagateEntries.length > 0) spec.propagateTo = propagateEntries;
  return stringify({
    apiVersion: 'gitops.open-control-plane.io/v1alpha1',
    kind: 'GitRepository',
    metadata: { name: repo.name || '<name>', namespace: namespace || '<namespace>' },
    spec,
  });
}

let nextId = 10;
function genId() {
  return String(nextId++);
}

function inputValue(e: Ui5CustomEvent<InputDomRef>): string {
  const detail = e.detail as { value?: string } | undefined;
  return typeof detail?.value === 'string' ? detail.value : ((e.target as InputDomRef).value ?? '');
}

const SPLITTER_HEIGHT = 'calc(100vh - 16rem)';

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  height: '100%',
  overflow: 'auto',
  padding: '1rem',
  width: '100%',
};

export function ConnectGitHubDialog({ isOpen, projectName, onClose }: ConnectGitHubDialogProps) {
  const { t } = useTranslation();
  const { githubBaseUrl } = useFrontendConfig();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  const [step, setStep] = useState<Step>('installation');

  // App Installations
  const [installations, setInstallations] = useState<AppInstallation[]>(INITIAL_INSTALLATIONS);
  const [selectedInstId, setSelectedInstId] = useState<string>(INITIAL_INSTALLATIONS[0]?.id ?? '');
  const [addingInstallation, setAddingInstallation] = useState(false);
  const [newInstName, setNewInstName] = useState('');
  const [newInstId, setNewInstId] = useState('');
  const [editingInstId, setEditingInstId] = useState<string | null>(null);
  const [editInstName, setEditInstName] = useState('');
  const [editInstInstallationId, setEditInstInstallationId] = useState('');
  const [pendingInstallationId, setPendingInstallationId] = useState<string | null>(null);

  // Git Repositories
  const [repos, setRepos] = useState<GitRepository[]>([]);
  const [addingRepo, setAddingRepo] = useState(false);
  const [newRepo, setNewRepo] = useState<Partial<GitRepository>>({
    branch: 'main',
    path: './',
    scopeKeys: [PROJECT_SCOPE_KEY],
    appInstallationId: INITIAL_INSTALLATIONS[0]?.id ?? '',
  });
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);

  // Propagate
  const [selectedControlPlanes, setSelectedControlPlanes] = useState<string[]>([]);
  const [labelPairs, setLabelPairs] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);

  const allCpsSelected = selectedControlPlanes.length === MOCK_CONTROL_PLANES.length;
  const projectNamespace = projectnameToNamespace(projectName);

  const scopeItems: ScopeItem[] = [
    {
      key: PROJECT_SCOPE_KEY,
      label: t('ConnectGitHubDialog.repoScopeProject', { project: projectName }),
      namespace: projectNamespace,
    },
    ...MOCK_WORKSPACES.map((ws) => ({ key: ws, label: ws, namespace: projectnameToNamespace(ws) })),
  ];

  const hasReadyInstallation = installations.some((i) => i.status === 'ready');
  const hasRepos = repos.length > 0;
  const readyInstallations = installations.filter((i) => i.status === 'ready');
  const selectedInst = installations.find((i) => i.id === selectedInstId) ?? installations[0];
  const selectedRepo = repos.find((r) => r.id === selectedRepoId) ?? repos[0];

  const repoNamespace =
    !selectedRepo || selectedRepo.scopeKeys.includes(PROJECT_SCOPE_KEY) || selectedRepo.scopeKeys.length === 0
      ? projectNamespace
      : projectnameToNamespace(selectedRepo.scopeKeys[0] ?? '');

  const propagateEntries: PropagateEntry[] = [
    ...selectedControlPlanes.map((name) => ({ kind: 'ControlPlane' as const, name })),
    ...labelPairs
      .filter((p) => p.key.trim() && p.value.trim())
      .map((p) => ({ kind: 'ControlPlane' as const, matchLabels: { [p.key.trim()]: p.value.trim() } })),
  ];

  // Step 1 YAML: adding → template; 1 inst → show it; multiple → empty
  const instPreviewYaml = (() => {
    if (addingInstallation) return buildAppInstallationYaml(newInstName, projectNamespace, newInstId);
    if (installations.length === 1)
      return buildAppInstallationYaml(installations[0]!.name, projectNamespace, installations[0]!.installationId);
    if (selectedInst) return buildAppInstallationYaml(selectedInst.name, projectNamespace, selectedInst.installationId);
    return '';
  })();

  const repoPreviewAppInstName =
    readyInstallations.find((i) => i.id === (addingRepo ? newRepo.appInstallationId : selectedRepo?.appInstallationId))
      ?.name ??
    readyInstallations[0]?.name ??
    '';

  const repoPreviewYaml = buildGitRepositoryYaml(
    addingRepo ? newRepo : (selectedRepo ?? {}),
    repoPreviewAppInstName,
    repoNamespace,
    propagateEntries,
  );

  useEffect(() => {
    if (!pendingInstallationId) return;
    const timer = setTimeout(() => {
      setInstallations((prev) =>
        prev.map((inst) => (inst.id === pendingInstallationId ? { ...inst, status: 'ready' } : inst)),
      );
      setPendingInstallationId(null);
      setStep('repository');
    }, 3000);
    return () => clearTimeout(timer);
  }, [pendingInstallationId]);

  const handleClose = () => {
    setStep('installation');
    setAddingInstallation(false);
    setNewInstName('');
    setNewInstId('');
    setEditingInstId(null);
    setAddingRepo(false);
    setNewRepo({
      branch: 'main',
      path: './',
      scopeKeys: [PROJECT_SCOPE_KEY],
      appInstallationId: installations[0]?.id ?? '',
    });
    setSelectedRepoId(null);
    setSelectedControlPlanes([]);
    setLabelPairs([{ key: '', value: '' }]);
    onClose();
  };

  const handleStepChange = (e: { detail: WizardStepChangeEventDetail }) => {
    const s = e.detail.step.dataset.step as Step | undefined;
    if (s) setStep(s);
  };

  const handleConfirmInstallation = () => {
    const id = genId();
    window.open(
      `${githubBaseUrl}/apps/openmcp/installations/new?state=${encodeURIComponent(projectName)}`,
      '_blank',
      'noopener,noreferrer',
    );
    setInstallations((prev) => [...prev, { id, name: newInstName, installationId: newInstId, status: 'pending' }]);
    setAddingInstallation(false);
    setNewInstName('');
    setNewInstId('');
    setPendingInstallationId(id);
    setSelectedInstId(id);
    setStep('waiting');
  };

  const handleSaveEdit = (instId: string) => {
    setInstallations((prev) =>
      prev.map((i) => (i.id === instId ? { ...i, name: editInstName, installationId: editInstInstallationId } : i)),
    );
    setEditingInstId(null);
  };

  const handleDeleteInstallation = (instId: string) => {
    setInstallations((prev) => {
      const next = prev.filter((i) => i.id !== instId);
      if (selectedInstId === instId) setSelectedInstId(next[0]?.id ?? '');
      return next;
    });
  };

  const handleConfirmRepo = () => {
    const id = genId();
    setRepos((prev) => [
      ...prev,
      {
        id,
        name: newRepo.name ?? '',
        url: newRepo.url ?? '',
        branch: newRepo.branch ?? 'main',
        path: newRepo.path ?? './',
        scopeKeys: newRepo.scopeKeys ?? [PROJECT_SCOPE_KEY],
        appInstallationId: newRepo.appInstallationId ?? readyInstallations[0]?.id ?? '',
      },
    ]);
    setSelectedRepoId(id);
    setAddingRepo(false);
    setNewRepo({
      branch: 'main',
      path: './',
      scopeKeys: [PROJECT_SCOPE_KEY],
      appInstallationId: readyInstallations[0]?.id ?? '',
    });
  };

  // ── Column definitions ──

  const instColumns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('ConnectGitHubDialog.nameLabel'),
      accessor: 'name',
    },
    {
      Header: t('ConnectGitHubDialog.installationIdLabel'),
      accessor: 'installationId',
    },
    {
      Header: t('ConnectGitHubDialog.statusLabel'),
      accessor: 'status',
      width: 90,
      Cell: (instance: AnalyticalTableCellInstance) => {
        const inst = instance.cell.row.original as AppInstallation;
        const color =
          inst.status === 'ready'
            ? 'var(--sapPositiveColor)'
            : inst.status === 'pending'
              ? 'var(--sapCriticalColor)'
              : 'var(--sapNeutralColor)';
        return <span style={{ color, fontSize: '0.875rem', fontWeight: 500 }}>{statusLabel(inst.status, t)}</span>;
      },
    },
    {
      Header: '',
      id: 'actions',
      width: 90,
      Cell: (instance: AnalyticalTableCellInstance) => {
        const inst = instance.cell.row.original as AppInstallation;
        return (
          <FlexBox gap="0.25rem">
            <Button
              design="Transparent"
              icon="edit"
              tooltip={t('ConnectGitHubDialog.editInstallation')}
              onClick={() => {
                setSelectedInstId(inst.id);
                setEditingInstId(inst.id);
                setEditInstName(inst.name);
                setEditInstInstallationId(inst.installationId);
              }}
            />
            <Button
              design="Transparent"
              icon="delete"
              tooltip={t('ConnectGitHubDialog.deleteInstallation')}
              onClick={() => handleDeleteInstallation(inst.id)}
            />
          </FlexBox>
        );
      },
    },
  ];

  const repoColumns: AnalyticalTableColumnDefinition[] = [
    { Header: t('ConnectGitHubDialog.repoNameLabel'), accessor: 'name' },
    { Header: t('ConnectGitHubDialog.repoUrlLabel'), accessor: 'url' },
    { Header: t('ConnectGitHubDialog.repoBranchLabel'), accessor: 'branch', width: 100 },
    {
      Header: t('ConnectGitHubDialog.repoAppInstallationLabel'),
      accessor: 'appInstallationId',
      Cell: (instance: AnalyticalTableCellInstance) => {
        const repo = instance.cell.row.original as GitRepository;
        const inst = installations.find((i) => i.id === repo.appInstallationId);
        return <span>{inst?.name ?? '—'}</span>;
      },
    },
    {
      Header: '',
      id: 'actions',
      width: 60,
      Cell: (instance: AnalyticalTableCellInstance) => {
        const repo = instance.cell.row.original as GitRepository;
        return (
          <Button
            design="Transparent"
            icon="delete"
            tooltip={t('ConnectGitHubDialog.deleteRepo')}
            onClick={() => {
              setRepos((prev) => prev.filter((r) => r.id !== repo.id));
              if (selectedRepoId === repo.id) setSelectedRepoId(null);
            }}
          />
        );
      },
    },
  ];

  const footer = (
    <Bar
      design="Footer"
      endContent={
        <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
          <Button design="Transparent" onClick={handleClose}>
            {t('buttons.cancel')}
          </Button>
          {step === 'installation' && (
            <Button
              design="Emphasized"
              disabled={!hasReadyInstallation}
              icon="source-code"
              onClick={() => setStep('repository')}
            >
              {t('buttons.next')}
            </Button>
          )}
          {step === 'waiting' && (
            <Button design="Default" disabled>
              {t('ConnectGitHubDialog.waitingButton')}
            </Button>
          )}
          {step === 'repository' && (
            <>
              <Button onClick={() => setStep('installation')}>{t('buttons.back')}</Button>
              <Button design="Emphasized" disabled={!hasRepos} icon="connected" onClick={() => setStep('propagate')}>
                {t('buttons.next')}
              </Button>
            </>
          )}
          {step === 'propagate' && (
            <>
              <Button onClick={() => setStep('repository')}>{t('buttons.back')}</Button>
              <Button design="Emphasized" disabled={!hasRepos} icon="add" onClick={handleClose}>
                {t('ConnectGitHubDialog.finishButton')}
              </Button>
            </>
          )}
        </div>
      }
    />
  );

  return (
    <>
      <Dialog stretch footer={footer} headerText={t('ConnectGitHubDialog.title')} open={isOpen} onClose={handleClose}>
        <Wizard contentLayout="SingleStep" style={{ height: '100%' }} onStepChange={handleStepChange}>
          {/* ── Step 1 — App Installations ── */}
          <WizardStep
            data-step="installation"
            icon="chain-link"
            selected={step === 'installation'}
            titleText={t('ConnectGitHubDialog.stepInstallTitle')}
          >
            <SplitterLayout style={{ height: SPLITTER_HEIGHT }}>
              <SplitterElement size="50%">
                <div style={panelStyle}>
                  {!hasReadyInstallation && (
                    <MessageStrip design="Information" hideCloseButton>
                      {t('ConnectGitHubDialog.installInfoStrip')}
                    </MessageStrip>
                  )}
                  <Button
                    design="Transparent"
                    icon="world"
                    onClick={() =>
                      window.open(
                        'https://docs.github.com/en/apps/creating-github-apps/writing-code-for-a-github-app/quickstart',
                        '_blank',
                        'noopener,noreferrer',
                      )
                    }
                  >
                    {t('ConnectGitHubDialog.quickstartDocsButton')}
                  </Button>

                  {/* Installations table */}
                  {installations.length > 0 && editingInstId === null && (
                    <AnalyticalTable
                      columns={instColumns}
                      data={installations}
                      minRows={1}
                      scaleWidthMode="Smart"
                      onRowClick={(e) => {
                        const inst = e.detail.row?.original as AppInstallation | undefined;
                        if (inst) setSelectedInstId(inst.id);
                      }}
                    />
                  )}

                  {/* Inline edit form */}
                  {editingInstId !== null && (
                    <div
                      style={{
                        border: '1px solid var(--sapList_BorderColor)',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        padding: '0.75rem',
                      }}
                    >
                      <Label style={{ fontWeight: 'bold' }}>{t('ConnectGitHubDialog.editInstallation')}</Label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <Label required>{t('ConnectGitHubDialog.nameLabel')}</Label>
                        <Input
                          style={{ width: '100%' }}
                          placeholder={t('ConnectGitHubDialog.namePlaceholder')}
                          value={editInstName}
                          onInput={(e: Ui5CustomEvent<InputDomRef>) => setEditInstName(inputValue(e))}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <Label>{t('ConnectGitHubDialog.installationIdLabel')}</Label>
                        <Input
                          style={{ width: '100%' }}
                          placeholder={t('ConnectGitHubDialog.installationIdPlaceholder')}
                          value={editInstInstallationId}
                          onInput={(e: Ui5CustomEvent<InputDomRef>) => setEditInstInstallationId(inputValue(e))}
                        />
                      </div>
                      <FlexBox justifyContent="End" style={{ gap: '0.5rem' }}>
                        <Button onClick={() => setEditingInstId(null)}>{t('buttons.cancel')}</Button>
                        <Button
                          design="Emphasized"
                          disabled={!editInstName.trim()}
                          onClick={() => handleSaveEdit(editingInstId)}
                        >
                          {t('ConnectGitHubDialog.saveInstallation')}
                        </Button>
                      </FlexBox>
                    </div>
                  )}

                  {/* Add new installation form */}
                  {addingInstallation ? (
                    <div
                      style={{
                        border: '1px dashed var(--sapList_BorderColor)',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        padding: '0.75rem',
                      }}
                    >
                      <Label style={{ fontWeight: 'bold' }}>{t('ConnectGitHubDialog.newInstallationHeader')}</Label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <Label required>{t('ConnectGitHubDialog.nameLabel')}</Label>
                        <Input
                          style={{ width: '100%' }}
                          id="new-inst-name"
                          placeholder={t('ConnectGitHubDialog.namePlaceholder')}
                          value={newInstName}
                          onInput={(e: Ui5CustomEvent<InputDomRef>) => setNewInstName(inputValue(e))}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <Label>{t('ConnectGitHubDialog.installationIdLabel')}</Label>
                        <Input
                          style={{ width: '100%' }}
                          id="new-inst-id"
                          placeholder={t('ConnectGitHubDialog.installationIdPlaceholder')}
                          value={newInstId}
                          onInput={(e: Ui5CustomEvent<InputDomRef>) => setNewInstId(inputValue(e))}
                        />
                      </div>
                      <FlexBox justifyContent="End" style={{ gap: '0.5rem' }}>
                        <Button
                          onClick={() => {
                            setAddingInstallation(false);
                            setNewInstName('');
                            setNewInstId('');
                          }}
                        >
                          {t('buttons.cancel')}
                        </Button>
                        <Button
                          design="Emphasized"
                          disabled={!newInstName.trim()}
                          icon="chain-link"
                          onClick={handleConfirmInstallation}
                        >
                          {t('ConnectGitHubDialog.installButton')}
                        </Button>
                      </FlexBox>
                    </div>
                  ) : (
                    editingInstId === null && (
                      <Button design="Transparent" icon="add" onClick={() => setAddingInstallation(true)}>
                        {t('ConnectGitHubDialog.addInstallationButton')}
                      </Button>
                    )
                  )}
                </div>
              </SplitterElement>
              <SplitterElement size="50%" style={{ overflow: 'hidden' }}>
                {instPreviewYaml ? (
                  <Suspense fallback={<BusyIndicator active size="M" style={{ margin: 'auto' }} />}>
                    <YamlViewer
                      filename={`app-installation-${(addingInstallation ? newInstName : selectedInst?.name) || 'new'}`}
                      isEdit={false}
                      yamlString={instPreviewYaml}
                    />
                  </Suspense>
                ) : (
                  <div
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      height: '100%',
                      justifyContent: 'center',
                      padding: '2rem',
                    }}
                  >
                    <Text style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {t('ConnectGitHubDialog.multipleInstallationsHint')}
                    </Text>
                  </div>
                )}
              </SplitterElement>
            </SplitterLayout>
          </WizardStep>

          {/* ── Step 2 — Waiting ── */}
          <WizardStep
            data-step="waiting"
            disabled={step === 'installation'}
            icon="connected"
            selected={step === 'waiting'}
            titleText={t('ConnectGitHubDialog.stepWaitingTitle')}
          >
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                height: '100%',
                justifyContent: 'center',
                padding: '3rem',
                textAlign: 'center',
              }}
            >
              <BusyIndicator active size="L" text={t('ConnectGitHubDialog.waitingIndicatorText')} />
              <Text>{t('ConnectGitHubDialog.waitingBody')}</Text>
            </div>
          </WizardStep>

          {/* ── Step 3 — Repositories ── */}
          <WizardStep
            data-step="repository"
            disabled={!hasReadyInstallation}
            icon="source-code"
            selected={step === 'repository'}
            titleText={t('ConnectGitHubDialog.stepRepositoryTitle')}
          >
            <SplitterLayout style={{ height: SPLITTER_HEIGHT }}>
              <SplitterElement size="50%">
                <div style={panelStyle}>
                  {repos.length === 0 && !addingRepo && (
                    <MessageStrip design="Information" hideCloseButton>
                      {t('ConnectGitHubDialog.repoInfoStrip')}
                    </MessageStrip>
                  )}

                  {repos.length > 0 && !addingRepo && (
                    <AnalyticalTable
                      columns={repoColumns}
                      data={repos}
                      minRows={1}
                      scaleWidthMode="Smart"
                      onRowClick={(e) => {
                        const repo = e.detail.row?.original as GitRepository | undefined;
                        if (repo) setSelectedRepoId(repo.id);
                      }}
                    />
                  )}

                  {!addingRepo && (
                    <Button design="Transparent" icon="add" onClick={() => setAddingRepo(true)}>
                      {t('ConnectGitHubDialog.addAnotherRepoButton')}
                    </Button>
                  )}

                  {addingRepo && (
                    <div
                      style={{
                        border: '1px dashed var(--sapList_BorderColor)',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        width: '100%',
                      }}
                    >
                      <Label style={{ fontWeight: 'bold' }}>{t('ConnectGitHubDialog.newRepoHeader')}</Label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <Label required>{t('ConnectGitHubDialog.repoAppInstallationLabel')}</Label>
                        <Select
                          style={{ width: '100%' }}
                          onChange={(e: Ui5CustomEvent<SelectDomRef, SelectChangeEventDetail>) => {
                            setNewRepo((r) => ({ ...r, appInstallationId: e.detail.selectedOption.value ?? '' }));
                          }}
                        >
                          {readyInstallations.map((inst) => (
                            <Option key={inst.id} value={inst.id}>
                              {inst.name}
                            </Option>
                          ))}
                        </Select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <Label required>{t('ConnectGitHubDialog.repoNameLabel')}</Label>
                        <Input
                          style={{ width: '100%' }}
                          placeholder={t('ConnectGitHubDialog.repoNamePlaceholder')}
                          value={newRepo.name ?? ''}
                          onInput={(e: Ui5CustomEvent<InputDomRef>) =>
                            setNewRepo((r) => ({ ...r, name: inputValue(e) }))
                          }
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <Label required>{t('ConnectGitHubDialog.repoUrlLabel')}</Label>
                        <Input
                          style={{ width: '100%' }}
                          placeholder="https://github.com/my-org/my-repo"
                          value={newRepo.url ?? ''}
                          onInput={(e: Ui5CustomEvent<InputDomRef>) =>
                            setNewRepo((r) => ({ ...r, url: inputValue(e) }))
                          }
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <Label>{t('ConnectGitHubDialog.repoBranchLabel')}</Label>
                        <Input
                          style={{ width: '100%' }}
                          placeholder="main"
                          value={newRepo.branch ?? 'main'}
                          onInput={(e: Ui5CustomEvent<InputDomRef>) =>
                            setNewRepo((r) => ({ ...r, branch: inputValue(e) }))
                          }
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <Label>{t('ConnectGitHubDialog.repoPathLabel')}</Label>
                        <Input
                          style={{ width: '100%' }}
                          placeholder="./"
                          value={newRepo.path ?? './'}
                          onInput={(e: Ui5CustomEvent<InputDomRef>) =>
                            setNewRepo((r) => ({ ...r, path: inputValue(e) }))
                          }
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <Label>{t('ConnectGitHubDialog.repoScopeLabel')}</Label>
                        <MultiComboBox
                          style={{ width: '100%' }}
                          selectedValues={[ONBOARDING_CLUSTER_KEY, ...(newRepo.scopeKeys ?? [PROJECT_SCOPE_KEY])]}
                          onSelectionChange={(
                            e: Ui5CustomEvent<MultiComboBoxDomRef, MultiComboBoxSelectionChangeEventDetail>,
                          ) => {
                            setNewRepo((r) => ({
                              ...r,
                              scopeKeys: e.detail.items
                                .map((i) => i.value ?? '')
                                .filter((v) => Boolean(v) && v !== ONBOARDING_CLUSTER_KEY),
                            }));
                          }}
                        >
                          {scopeItems.map((item) => (
                            <MultiComboBoxItem key={item.key} text={item.label} value={item.key} />
                          ))}
                          <MultiComboBoxItem
                            key={ONBOARDING_CLUSTER_KEY}
                            style={{ color: 'var(--sapContent_LabelColor)', pointerEvents: 'none' }}
                            text={t('ConnectGitHubDialog.onboardingCluster')}
                            value={ONBOARDING_CLUSTER_KEY}
                          />
                        </MultiComboBox>
                      </div>
                      <FlexBox justifyContent="End" style={{ gap: '0.5rem' }}>
                        <Button
                          onClick={() => {
                            setAddingRepo(false);
                            setNewRepo({
                              branch: 'main',
                              path: './',
                              scopeKeys: [PROJECT_SCOPE_KEY],
                              appInstallationId: readyInstallations[0]?.id ?? '',
                            });
                          }}
                        >
                          {t('buttons.cancel')}
                        </Button>
                        <Button
                          design="Emphasized"
                          disabled={!newRepo.name?.trim() || !newRepo.url?.trim()}
                          icon="add"
                          onClick={handleConfirmRepo}
                        >
                          {t('ConnectGitHubDialog.addRepositoryButton')}
                        </Button>
                      </FlexBox>
                    </div>
                  )}
                </div>
              </SplitterElement>
              <SplitterElement size="50%" style={{ overflow: 'hidden' }}>
                <Suspense fallback={<BusyIndicator active size="M" style={{ margin: 'auto' }} />}>
                  <YamlViewer
                    filename={`git-repository-${(addingRepo ? newRepo.name : selectedRepo?.name) || 'new'}`}
                    isEdit={false}
                    yamlString={repoPreviewYaml}
                  />
                </Suspense>
              </SplitterElement>
            </SplitterLayout>
          </WizardStep>

          {/* ── Step 4 — Propagate ── */}
          <WizardStep
            data-step="propagate"
            disabled={!hasRepos}
            icon="connected"
            selected={step === 'propagate'}
            titleText={t('ConnectGitHubDialog.stepPropagateTitle')}
          >
            <SplitterLayout style={{ height: SPLITTER_HEIGHT }}>
              <SplitterElement size="50%">
                <div style={panelStyle}>
                  <MessageStrip design="Information" hideCloseButton>
                    {t('ConnectGitHubDialog.propagateInfoStrip')}
                  </MessageStrip>
                  {/* Repository selector — required before selecting control planes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <Label required>{t('ConnectGitHubDialog.propagateRepoLabel')}</Label>
                    <Select
                      style={{ width: '100%' }}
                      onChange={(e: Ui5CustomEvent<SelectDomRef, SelectChangeEventDetail>) => {
                        setSelectedRepoId(e.detail.selectedOption.value ?? null);
                      }}
                    >
                      {repos.map((repo) => (
                        <Option key={repo.id} value={repo.id}>
                          {repo.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <Label>{t('ConnectGitHubDialog.propagateControlPlanesLabel')}</Label>
                    <div style={{ alignItems: 'center', display: 'flex', gap: '0.5rem' }}>
                      <MultiComboBox
                        selectedValues={selectedControlPlanes}
                        style={{ flex: 1 }}
                        onSelectionChange={(
                          e: Ui5CustomEvent<MultiComboBoxDomRef, MultiComboBoxSelectionChangeEventDetail>,
                        ) => {
                          setSelectedControlPlanes(e.detail.items.map((i) => i.value ?? '').filter(Boolean));
                        }}
                      >
                        {MOCK_CONTROL_PLANES.map((cp) => (
                          <MultiComboBoxItem key={cp} text={cp} value={cp} />
                        ))}
                      </MultiComboBox>
                      <Button
                        design={allCpsSelected ? 'Default' : 'Transparent'}
                        onClick={() => setSelectedControlPlanes(allCpsSelected ? [] : [...MOCK_CONTROL_PLANES])}
                      >
                        {t('ConnectGitHubDialog.propagateSelectAll')}
                      </Button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <Label>{t('ConnectGitHubDialog.propagateLabelSelectorLabel')}</Label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                      {labelPairs.map((pair, idx) => (
                        <div key={idx} style={{ alignItems: 'center', display: 'flex', gap: '0.5rem' }}>
                          <Input
                            placeholder={t('ConnectGitHubDialog.propagateLabelKey')}
                            style={{ flex: 1 }}
                            value={pair.key}
                            onInput={(e: Ui5CustomEvent<InputDomRef>) => {
                              const val = inputValue(e);
                              setLabelPairs((prev) => prev.map((p, i) => (i === idx ? { ...p, key: val } : p)));
                            }}
                          />
                          <span style={{ color: 'var(--sapContent_LabelColor)' }}>=</span>
                          <Input
                            placeholder={t('ConnectGitHubDialog.propagateLabelValue')}
                            style={{ flex: 1 }}
                            value={pair.value}
                            onInput={(e: Ui5CustomEvent<InputDomRef>) => {
                              const val = inputValue(e);
                              setLabelPairs((prev) => prev.map((p, i) => (i === idx ? { ...p, value: val } : p)));
                            }}
                          />
                          {labelPairs.length > 1 && (
                            <Button
                              design="Transparent"
                              icon="delete"
                              onClick={() => setLabelPairs((prev) => prev.filter((_, i) => i !== idx))}
                            />
                          )}
                        </div>
                      ))}
                      <Button
                        design="Transparent"
                        icon="add"
                        onClick={() => setLabelPairs((prev) => [...prev, { key: '', value: '' }])}
                      >
                        {t('ConnectGitHubDialog.propagateAddLabel')}
                      </Button>
                    </div>
                  </div>
                </div>
              </SplitterElement>
              <SplitterElement size="50%" style={{ overflow: 'hidden' }}>
                <Suspense fallback={<BusyIndicator active size="M" style={{ margin: 'auto' }} />}>
                  <YamlViewer
                    filename={`git-repository-${selectedRepo?.name || 'new'}`}
                    isEdit={false}
                    yamlString={repoPreviewYaml}
                  />
                </Suspense>
              </SplitterElement>
            </SplitterLayout>
          </WizardStep>
        </Wizard>
      </Dialog>
      <ErrorDialog ref={errorDialogRef} />
    </>
  );
}
