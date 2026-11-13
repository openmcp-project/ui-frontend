import '@ui5/webcomponents-icons/dist/badge';
import '@ui5/webcomponents-icons/dist/edit';
import '@ui5/webcomponents-icons/dist/role';
import '@ui5/webcomponents-icons/dist/shield';
import '@ui5/webcomponents-icons/dist/show';
import {
  FlexBox,
  Label,
  Link,
  MultiInput,
  MultiInputDomRef,
  Text,
  ToggleButton,
  Token,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import type { MultiInputTokenDeleteEventDetail } from '@ui5/webcomponents/dist/MultiInput.js';
import { FC, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  CLUSTER_ROLE_PRESETS,
  formatRoleRef,
  isNamespacedRole,
  isPresetClusterRole,
  isValidClusterRoleName,
} from '../../lib/api/types/shared/clusterRoles.ts';
import styles from './Members.module.css';

export const KUBERNETES_RBAC_DOCS_URL =
  'https://kubernetes.io/docs/reference/access-authn-authz/rbac/#user-facing-roles';

export interface ClusterRolesSelectProps {
  /** Encoded role refs (see clusterRoles.ts). */
  roles: string[];
  onChange: (roles: string[]) => void;
  /** Reports whether the custom-role input currently holds text that could not be turned into a role. */
  onInvalidInputChange?: (hasInvalidInput: boolean) => void;
  errorMessage?: string;
  testIdPrefix?: string;
}

const splitNames = (value: string): string[] => value.split(/[\s,]+/).filter((s) => s.length > 0);

/**
 * Role picker for ControlPlane (v2) members: toggles for the ClusterRoles every Kubernetes cluster
 * ships with, plus a token input for any other ClusterRole that exists in the ControlPlane.
 * A member can hold several roles — Kubernetes RBAC is purely additive.
 */
export const ClusterRolesSelect: FC<ClusterRolesSelectProps> = ({
  roles,
  onChange,
  onInvalidInputChange,
  errorMessage,
  testIdPrefix,
}) => {
  const { t } = useTranslation();
  const [hasInvalidInput, setHasInvalidInput] = useState(false);
  const withTestId = (testId: string) => (testIdPrefix ? `${testIdPrefix}-${testId}` : testId);

  const customRoles = roles.filter((role) => !isPresetClusterRole(role));

  const updateInvalidInput = (invalid: boolean) => {
    if (invalid === hasInvalidInput) return;
    setHasInvalidInput(invalid);
    onInvalidInputChange?.(invalid);
  };

  const togglePreset = (name: string) => {
    onChange(roles.includes(name) ? roles.filter((role) => role !== name) : [...roles, name]);
  };

  const handleAddCustomRoles = (event: Ui5CustomEvent<MultiInputDomRef>) => {
    const target = event.target as MultiInputDomRef & { value: string };
    const names = splitNames(target.value ?? '');
    if (names.length === 0) {
      updateInvalidInput(false);
      return;
    }
    if (!names.every(isValidClusterRoleName)) {
      // Keep the text so the user can correct it; the dialog refuses to save meanwhile.
      updateInvalidInput(true);
      return;
    }
    const merged = [...roles];
    names.forEach((name) => {
      if (!merged.includes(name)) merged.push(name);
    });
    onChange(merged);
    updateInvalidInput(false);
    // MultiInput does not clear its editable input on Enter by default.
    target.value = '';
  };

  const handleDeleteCustomRoles = (event: Ui5CustomEvent<MultiInputDomRef, MultiInputTokenDeleteEventDetail>) => {
    const removed = new Set((event.detail.tokens ?? []).map((token) => token.dataset.role ?? ''));
    onChange(roles.filter((role) => !removed.has(role)));
  };

  const customInputError = hasInvalidInput ? t('ClusterRoles.invalidName') : undefined;

  return (
    <FlexBox direction="Column" gap={8} data-testid={withTestId('cluster-roles-select')}>
      <FlexBox direction="Column">
        <Label>{t('ClusterRoles.label')}</Label>
        <FlexBox role="group" aria-label={t('ClusterRoles.label')} gap={4} wrap="Wrap">
          {CLUSTER_ROLE_PRESETS.map(({ name, icon, descriptionKey }) => (
            <ToggleButton
              key={name}
              icon={icon}
              pressed={roles.includes(name)}
              tooltip={t(descriptionKey)}
              data-testid={withTestId(`cluster-role-${name}`)}
              onClick={() => togglePreset(name)}
            >
              {name}
            </ToggleButton>
          ))}
        </FlexBox>
        {errorMessage && (
          <Text className={styles.errorText} data-testid={withTestId('cluster-roles-error')}>
            {errorMessage}
          </Text>
        )}
      </FlexBox>

      <FlexBox direction="Column">
        <Label for={withTestId('custom-cluster-roles-input')}>{t('ClusterRoles.customLabel')}</Label>
        <MultiInput
          className={styles.input}
          id={withTestId('custom-cluster-roles-input')}
          data-testid={withTestId('custom-cluster-roles-input')}
          placeholder={t('ClusterRoles.customPlaceholder')}
          valueState={customInputError ? 'Negative' : 'None'}
          valueStateMessage={<span>{customInputError}</span>}
          tokens={
            <>
              {customRoles.map((role) => (
                <Token
                  key={role}
                  data-role={role}
                  text={
                    isNamespacedRole(role)
                      ? t('ClusterRoles.namespacedRoleToken', { role: formatRoleRef(role) })
                      : formatRoleRef(role)
                  }
                />
              ))}
            </>
          }
          onChange={handleAddCustomRoles}
          onInput={() => updateInvalidInput(false)}
          onTokenDelete={handleDeleteCustomRoles}
        />
      </FlexBox>

      <Text className={styles.hint}>
        <Trans
          i18nKey="ClusterRoles.hint"
          components={{ link1: <Link href={KUBERNETES_RBAC_DOCS_URL} target="_blank" /> }}
        />
      </Text>
    </FlexBox>
  );
};
