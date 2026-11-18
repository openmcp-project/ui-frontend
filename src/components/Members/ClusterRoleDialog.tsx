import '@ui5/webcomponents-icons/dist/edit';
import { Bar, BusyIndicator, Button, Dialog, FlexBox, MessageStrip } from '@ui5/webcomponents-react';
import { FC, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { stringify } from 'yaml';
import { useToast } from '../../context/ToastContext.tsx';
import { fetchApiServerJson } from '../../lib/api/fetch.ts';
import { isForbiddenError, type APIError } from '../../lib/api/error.ts';
import type { ApiConfig } from '../../lib/api/types/apiConfig.ts';
import { ListClusterRoles } from '../../lib/api/types/k8s/listClusterRoles.ts';
import { applyCpResource, type ParsedResource } from '../../hooks/useYamlApplyResource.ts';
import { ApiConfigContext } from '../Shared/k8s';
import { YamlViewer } from '../Yaml/YamlViewer.tsx';
import {
  clusterRoleTemplate,
  isReadOnlyClusterRole,
  stripServerFields,
  validateClusterRoleYaml,
} from './clusterRoleDialog.ts';

export type ClusterRoleDialogMode = 'view' | 'edit' | 'create';

export interface ClusterRoleDialogProps {
  mode: ClusterRoleDialogMode;
  /** The role to view/edit, or the prefilled name for create (may be empty). */
  roleName: string;
  /** Prefilled YAML for create (e.g. an uploaded file); falls back to the template. */
  initialYaml?: string;
  /** Names of ClusterRoles carrying an aggregationRule — those cannot be edited. */
  aggregatedRoles: string[];
  onClose: () => void;
  /** Refresh the ClusterRoles lookup after a successful apply. */
  onApplied: (roleName: string) => void;
  testIdPrefix?: string;
}

const CLUSTER_ROLES_PLURAL = 'clusterroles';

export const ClusterRoleDialog: FC<ClusterRoleDialogProps> = ({
  mode: initialMode,
  roleName,
  initialYaml,
  aggregatedRoles,
  onClose,
  onApplied,
  testIdPrefix,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const apiConfig = useContext<ApiConfig>(ApiConfigContext);
  const withTestId = (testId: string) => (testIdPrefix ? `${testIdPrefix}-${testId}` : testId);

  const [mode, setMode] = useState<ClusterRoleDialogMode>(initialMode);
  const [yaml, setYaml] = useState<string>(
    initialMode === 'create' ? (initialYaml ?? clusterRoleTemplate(roleName)) : '',
  );
  const [loading, setLoading] = useState(initialMode !== 'create');
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [validity, setValidity] = useState<{ parseOk: boolean; schemaErrorCount: number; schemaStale?: boolean }>({
    parseOk: true,
    schemaErrorCount: 0,
    schemaStale: false,
  });
  const [aggregated, setAggregated] = useState(aggregatedRoles.includes(roleName));

  const messages = useMemo(
    () => ({
      wrongType: t('ClusterRoleDialog.errorWrongType'),
      multiDoc: t('ClusterRoleDialog.errorMultiDoc'),
      invalidName: t('ClusterRoleDialog.errorInvalidName'),
      renamed: (expected: string) => t('ClusterRoleDialog.errorRenamed', { name: expected }),
      parseError: (detail: string) => t('ClusterRoleDialog.errorParse', { detail }),
    }),
    [t],
  );

  // View/Edit fetch the role once (the dialog is mounted fresh per open, so initial state is clean);
  // Create starts from the template.
  useEffect(() => {
    if (initialMode === 'create') return;
    let cancelled = false;
    const path = `${ListClusterRoles.path}/${roleName}`;
    fetchApiServerJson<ParsedResource>(path, apiConfig)
      .then((resource) => {
        if (cancelled) return;
        const stripped = stripServerFields(resource);
        setYaml(stringify(stripped));
        setAggregated(
          (resource as { aggregationRule?: unknown }).aggregationRule != null || aggregatedRoles.includes(roleName),
        );
      })
      .catch((e: APIError) => {
        if (cancelled) return;
        setError(isForbiddenError(e) ? t('ClusterRoleDialog.loadForbidden') : t('ClusterRoleDialog.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode, roleName]);

  const readOnly = mode !== 'edit';
  const canEdit = mode === 'view' && !isReadOnlyClusterRole(roleName, aggregated);
  const readOnlyReason = isReadOnlyClusterRole(roleName, aggregated) ? t('ClusterRoleDialog.readOnlyReason') : '';

  const applyDisabled = applying || !validity.parseOk || validity.schemaErrorCount > 0 || !!validity.schemaStale;

  const handleApply = async () => {
    const validation = validateClusterRoleYaml(yaml, messages, mode === 'edit' ? roleName : undefined);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    const resource = stripServerFields(validation.resource);
    setApplying(true);
    setError('');
    try {
      // Dry run first, then the real apply, exactly like YamlApplyDialog.
      await applyCpResource(resource, CLUSTER_ROLES_PLURAL, apiConfig, true);
      await applyCpResource(resource, CLUSTER_ROLES_PLURAL, apiConfig, false);
      toast.show(t('ClusterRoleDialog.applied', { name: resource.metadata.name }));
      onApplied(resource.metadata.name);
      onClose();
    } catch (e) {
      // 403 is expected (not allowed to manage roles, or the role grants more than the user holds).
      // Show the server message and keep the dialog open; do not report (routine request failure).
      const message = e instanceof Error ? e.message : String(e);
      const info = (e as APIError).info;
      const detail = typeof info === 'object' && info && 'message' in info ? String(info.message) : message;
      setError(detail);
    } finally {
      setApplying(false);
    }
  };

  const title =
    mode === 'create'
      ? t('ClusterRoleDialog.titleCreate')
      : mode === 'edit'
        ? t('ClusterRoleDialog.titleEdit', { name: roleName })
        : t('ClusterRoleDialog.titleView', { name: roleName });

  const footer = (
    <Bar
      design="Footer"
      endContent={
        <>
          <Button design="Transparent" data-testid={withTestId('cluster-role-close')} onClick={onClose}>
            {t(mode === 'view' ? 'buttons.close' : 'buttons.cancel')}
          </Button>
          {canEdit && (
            <Button
              design="Default"
              icon="edit"
              data-testid={withTestId('cluster-role-edit')}
              onClick={() => setMode('edit')}
            >
              {t('ClusterRoleDialog.edit')}
            </Button>
          )}
          {mode !== 'view' && (
            <Button
              design="Emphasized"
              disabled={applyDisabled}
              data-testid={withTestId('cluster-role-apply')}
              onClick={handleApply}
            >
              {t(mode === 'create' ? 'ClusterRoleDialog.create' : 'ClusterRoleDialog.save')}
            </Button>
          )}
        </>
      }
    />
  );

  return (
    <Dialog
      open
      stretch
      headerText={title}
      footer={footer}
      data-testid={withTestId('cluster-role-dialog')}
      onClose={onClose}
    >
      <FlexBox direction="Column" gap={8} style={{ height: '100%' }}>
        <MessageStrip design="Information" hideCloseButton>
          {t('ClusterRoleDialog.immediate')}
        </MessageStrip>
        {readOnlyReason && mode === 'view' && (
          <MessageStrip design="Information" hideCloseButton data-testid={withTestId('cluster-role-readonly')}>
            {readOnlyReason}
          </MessageStrip>
        )}
        {error && (
          <MessageStrip design="Negative" data-testid={withTestId('cluster-role-error')} onClose={() => setError('')}>
            {error}
          </MessageStrip>
        )}
        {loading ? (
          <FlexBox justifyContent="Center" style={{ flex: 1 }}>
            <BusyIndicator active delay={0} />
          </FlexBox>
        ) : (
          <div style={{ flex: 1, minHeight: 0 }}>
            <YamlViewer
              key={mode}
              yamlString={yaml}
              filename={`clusterrole-${roleName || 'new'}`}
              isEdit={!readOnly}
              hideToolbar
              height="100%"
              onContentChange={setYaml}
              onValidityChange={setValidity}
            />
          </div>
        )}
      </FlexBox>
    </Dialog>
  );
};
