import '@ui5/webcomponents-icons/dist/add';
import '@ui5/webcomponents-icons/dist/upload';
import {
  BusyIndicator,
  Button,
  CheckBox,
  FlexBox,
  Label,
  Link,
  MessageStrip,
  MultiInput,
  MultiInputDomRef,
  SuggestionItem,
  Text,
  Title,
  Token,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import type { MultiInputTokenDeleteEventDetail } from '@ui5/webcomponents/dist/MultiInput.js';
import { FC, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_CLUSTER_ROLE,
  formatRoleRef,
  isNamespacedRole,
  isValidClusterRoleName,
  uniqueRoles,
} from '../../lib/api/types/shared/clusterRoles.ts';
import styles from './Members.module.css';

export const KUBERNETES_RBAC_DOCS_URL =
  'https://kubernetes.io/docs/reference/access-authn-authz/rbac/#user-facing-roles';

type StandardRole = typeof DEFAULT_CLUSTER_ROLE | 'admin' | 'view';
const STANDARD_ROLES: readonly string[] = [DEFAULT_CLUSTER_ROLE, 'admin', 'view'];

// Whether the control plane's ClusterRoles are known:
//   'unknown' – no lookup possible (control plane not created yet, or no session for it). Names are
//               accepted as typed and nothing is flagged.
//   'ready'   – `availableCustomRoles` is the full list; other names are flagged as "not found".
// A role that does not exist (yet) is never an error: the platform accepts such bindings, they just
// grant nothing until the role is created.
export type CustomRolesState = 'unknown' | 'loading' | 'ready' | 'error';

export interface MemberAccessSelectProps {
  /** Encoded role refs (see clusterRoles.ts). */
  roles: string[];
  onChange: (roles: string[]) => void;
  /** ClusterRoles that exist in the control plane (without Kubernetes' internal `system:` roles). */
  availableCustomRoles?: string[];
  customRolesState?: CustomRolesState;
  platformDocsUrl?: string;
  onCreateRole?: () => void;
  onUploadRole?: () => void;
  errorMessage?: string;
  testIdPrefix?: string;
}

export const MemberAccessSelect: FC<MemberAccessSelectProps> = ({
  roles,
  onChange,
  availableCustomRoles = [],
  customRolesState = 'unknown',
  platformDocsUrl,
  onCreateRole,
  onUploadRole,
  errorMessage,
  testIdPrefix,
}) => {
  const { t } = useTranslation();
  const withTestId = (testId: string) => (testIdPrefix ? `${testIdPrefix}-${testId}` : testId);
  // Kubernetes permissions only ever add up, so any combination is valid — but a role that is fully
  // covered by a broader one changes nothing. Say so instead of forbidding it: such combinations can
  // be created through the API anyway and must stay editable here.
  const coveredBy = (role: StandardRole | 'custom'): string | undefined => {
    if (role !== DEFAULT_CLUSTER_ROLE && roles.includes(DEFAULT_CLUSTER_ROLE)) {
      return t('MemberAccess.roles.clusterAdmin.title');
    }
    if (role === 'view' && roles.includes('admin')) return t('MemberAccess.roles.admin.title');
    return undefined;
  };

  const customSelected = roles.filter((role) => !STANDARD_ROLES.includes(role));
  const suggestions = availableCustomRoles.filter((role) => !roles.includes(role) && !STANDARD_ROLES.includes(role));

  const toggle = (role: StandardRole) =>
    onChange(roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]);

  const [hasInvalidInput, setHasInvalidInput] = useState(false);

  // Enter, blur or picking a suggestion commits the typed text. Any valid name is accepted — the
  // role does not have to exist.
  const handleAddCustomRoles = (event: Ui5CustomEvent<MultiInputDomRef>) => {
    const target = event.target as MultiInputDomRef & { value: string };
    const names = (target.value ?? '').split(/[\s,]+/).filter((name) => name.length > 0);
    if (names.length === 0) {
      setHasInvalidInput(false);
      return;
    }
    if (!names.every(isValidClusterRoleName)) {
      setHasInvalidInput(true);
      return;
    }
    onChange(uniqueRoles([...roles, ...names]));
    setHasInvalidInput(false);
    target.value = '';
  };

  const handleDeleteCustomRoles = (event: Ui5CustomEvent<MultiInputDomRef, MultiInputTokenDeleteEventDetail>) => {
    const removed = new Set((event.detail.tokens ?? []).map((token) => token.dataset.role ?? ''));
    onChange(roles.filter((role) => !removed.has(role)));
  };

  const isNotFound = (role: string) =>
    customRolesState === 'ready' && !isNamespacedRole(role) && !availableCustomRoles.includes(role);

  // Bullet lists are string arrays in the locale file; fall back to a single line if a locale
  // provides a plain string (or the key is missing).
  const bullets = (key: string): string[] => {
    const value: unknown = t(key, { returnObjects: true });
    return Array.isArray(value) ? value.map(String) : [String(value)];
  };

  const redundancyNote = (role: StandardRole | 'custom') => {
    const broader = coveredBy(role);
    return broader ? (
      <Text className={styles.accessCovered} data-testid={withTestId(`access-${role}-covered`)}>
        {t('MemberAccess.coveredBy', { role: broader })}
      </Text>
    ) : null;
  };

  const option = (role: StandardRole, title: string, points: string[]) => (
    <div className={styles.accessOption}>
      <CheckBox
        text={title}
        checked={roles.includes(role)}
        data-testid={withTestId(`access-${role}`)}
        onChange={() => toggle(role)}
      />
      <div className={styles.accessOptionBody}>
        <ul className={styles.accessBullets}>
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        {roles.includes(role) && redundancyNote(role)}
      </div>
    </div>
  );

  const group = (title: string, description: string, docsUrl: string | undefined, children: ReactNode) => (
    <section className={styles.accessGroup}>
      <FlexBox alignItems="Baseline" justifyContent="SpaceBetween" gap={8}>
        <Title level="H6" size="H6">
          {title}
        </Title>
        {docsUrl && (
          <Link href={docsUrl} target="_blank">
            {t('MemberAccess.learnMore')}
          </Link>
        )}
      </FlexBox>
      <Text className={styles.accessGroupDescription}>{description}</Text>
      {children}
    </section>
  );

  return (
    <FlexBox direction="Column" gap={12} data-testid={withTestId('member-access-select')}>
      <FlexBox direction="Column">
        <Label>{t('MemberAccess.label')}</Label>
        <Text className={styles.accessGroupDescription}>{t('MemberAccess.hint')}</Text>
        {errorMessage && (
          <Text className={styles.errorText} data-testid={withTestId('member-access-error')}>
            {errorMessage}
          </Text>
        )}
      </FlexBox>

      {group(
        t('MemberAccess.platform.title'),
        t('MemberAccess.platform.description'),
        platformDocsUrl,
        option(
          DEFAULT_CLUSTER_ROLE,
          t('MemberAccess.roles.clusterAdmin.title'),
          bullets('MemberAccess.roles.clusterAdmin.bullets'),
        ),
      )}

      {group(
        t('MemberAccess.kubernetes.title'),
        t('MemberAccess.kubernetes.description'),
        KUBERNETES_RBAC_DOCS_URL,
        <>
          {option('admin', t('MemberAccess.roles.admin.title'), bullets('MemberAccess.roles.admin.bullets'))}
          {option('view', t('MemberAccess.roles.view.title'), bullets('MemberAccess.roles.view.bullets'))}
        </>,
      )}

      {group(
        t('MemberAccess.custom.title'),
        t('MemberAccess.custom.description'),
        undefined,
        <FlexBox direction="Column" gap={8} className={styles.accessCustom}>
          {customSelected.length > 0 && redundancyNote('custom')}
          <MultiInput
            className={styles.input}
            data-testid={withTestId('custom-roles-input')}
            placeholder={t('MemberAccess.custom.placeholder')}
            valueState={hasInvalidInput ? 'Negative' : 'None'}
            valueStateMessage={<span>{hasInvalidInput ? t('MemberAccess.custom.invalidName') : ''}</span>}
            showSuggestions
            tokens={
              <>
                {customSelected.map((role) => (
                  <Token
                    key={role}
                    data-role={role}
                    text={
                      isNotFound(role)
                        ? t('MemberAccess.custom.notFoundSuffix', { role: formatRoleRef(role) })
                        : formatRoleRef(role)
                    }
                  />
                ))}
              </>
            }
            onChange={handleAddCustomRoles}
            onInput={() => setHasInvalidInput(false)}
            onTokenDelete={handleDeleteCustomRoles}
          >
            {suggestions.map((role) => (
              <SuggestionItem key={role} text={role} />
            ))}
          </MultiInput>
          {customRolesState === 'loading' && <BusyIndicator active delay={0} size="S" />}
          {customRolesState === 'unknown' && (
            <Text className={styles.accessGroupDescription}>{t('MemberAccess.custom.unknown')}</Text>
          )}
          {customRolesState === 'error' && (
            <Text className={styles.accessGroupDescription}>{t('MemberAccess.custom.loadError')}</Text>
          )}
          {customRolesState === 'ready' && customSelected.some(isNotFound) && (
            <MessageStrip design="Critical" data-testid={withTestId('custom-roles-not-found')} hideCloseButton>
              {t('MemberAccess.custom.notFoundHint')}
            </MessageStrip>
          )}
          {(onCreateRole || onUploadRole) && (
            <FlexBox gap={8}>
              {onCreateRole && (
                <Button
                  design="Transparent"
                  icon="add"
                  data-testid={withTestId('create-custom-role')}
                  onClick={onCreateRole}
                >
                  {t('MemberAccess.custom.create')}
                </Button>
              )}
              {onUploadRole && (
                <Button
                  design="Transparent"
                  icon="upload"
                  data-testid={withTestId('upload-custom-role')}
                  onClick={onUploadRole}
                >
                  {t('MemberAccess.custom.upload')}
                </Button>
              )}
            </FlexBox>
          )}
        </FlexBox>,
      )}
    </FlexBox>
  );
};
