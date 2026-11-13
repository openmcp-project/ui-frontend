import { Button, FlexBox } from '@ui5/webcomponents-react';
import { clsx } from 'clsx';
import { TFunction } from 'i18next';
import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext.tsx';
import { mapMemberRoleToClusterRole } from '../../lib/api/types/shared/clusterRoles.ts';
import { areMembersEqual, Member } from '../../lib/api/types/shared/members';
import { useLink } from '../../lib/shared/useLink.ts';
import {
  useClusterRoles as _useClusterRoles,
  type ClusterRolesLookup,
} from '../../spaces/controlPlaneV2/hooks/useClusterRoles.ts';
import { RadioButtonsSelectOption } from '../Ui/RadioButtonsSelect/RadioButtonsSelect.tsx';
import { AddEditMemberDialog } from './AddEditMemberDialog.tsx';
import { ImportMembersDialog } from './ImportMembersDialog.tsx';
import { resolveExistingClusterRoles } from './memberRoles.ts';
import styles from './Members.module.css';
import { MemberTable } from './MemberTable.tsx';

export interface EditMembersProps {
  members: Member[];
  onMemberChanged: (members: Member[]) => void;
  isValidationError?: boolean;
  requireAtLeastOneMember?: boolean;
  projectName?: string;
  workspaceName?: string;
  type: 'workspace' | 'project' | 'mcp';
  isV2?: boolean;
  showImportButton?: boolean;
  fitContentAddButton?: boolean;
  // V2-only: stamped onto saved members (undefined = default provider).
  providerName?: string;
  // Scopes data-testid so multiple instances can be mounted at once.
  testIdPrefix?: string;
  // V2-only: ClusterRoles that exist in the control plane (undefined while unknown/loading).
  existingClusterRoles?: string[];
  // Injectable for tests (CLAUDE.md "Injectable hooks"); defaults to the real lookup.
  useClusterRoles?: () => ClusterRolesLookup;
}

export const ACCOUNT_TYPES: RadioButtonsSelectOption[] = [
  { value: 'User', label: 'User', icon: 'employee' },
  { value: 'Group', label: 'Group', icon: 'group' },
  { value: 'ServiceAccount', label: 'Service Account', icon: 'machine' },
];

export const V1_ACCOUNT_TYPES: RadioButtonsSelectOption[] = ACCOUNT_TYPES.filter(({ value }) =>
  ['User', 'ServiceAccount'].includes(value),
);

export const V2_ACCOUNT_TYPES: RadioButtonsSelectOption[] = ACCOUNT_TYPES.filter(({ value }) =>
  ['User', 'Group'].includes(value),
);

export type AccountType = 'User' | 'Group' | 'ServiceAccount';

const PROJECT_PREFIX = 'project-';
const removeProjectPrefix = (name?: string) =>
  name?.startsWith(PROJECT_PREFIX) ? name.slice(PROJECT_PREFIX.length) : name;

export const EditMembers: FC<EditMembersProps> = ({
  members,
  onMemberChanged,
  isValidationError = false,
  requireAtLeastOneMember = true,
  workspaceName,
  projectName,
  type,
  isV2 = false,
  showImportButton = true,
  fitContentAddButton = false,
  providerName,
  testIdPrefix,
  existingClusterRoles,
  useClusterRoles = _useClusterRoles,
}) => {
  const { t } = useTranslation();
  const { mcpOnboardingAuthDocs } = useLink();
  // Runs a request only inside a control-plane context (mcpConfig set); 'unknown' everywhere else,
  // which skips the lookup without triggering a login. See useClusterRoles.
  const lookup = useClusterRoles();
  const clusterRolesActive = isV2;
  // `existingClusterRoles` passed from above wins (e.g. a precomputed value); otherwise use the
  // lookup, and only once it is 'ready' — an empty array would wrongly flag every role.
  const effectiveExistingClusterRoles = resolveExistingClusterRoles(
    isV2,
    lookup.state,
    lookup.all,
    existingClusterRoles,
  );
  const accountTypeOptions = useMemo(() => (isV2 ? V2_ACCOUNT_TYPES : V1_ACCOUNT_TYPES), [isV2]);
  const usesUserGroupAccountTypes = useMemo(
    () =>
      accountTypeOptions.some(({ value }) => value === 'Group') &&
      !accountTypeOptions.some(({ value }) => value === 'ServiceAccount'),
    [accountTypeOptions],
  );

  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | undefined>(undefined);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const handleRemoveMember = useCallback(
    (email: string) => {
      onMemberChanged(members.filter((m) => m.name !== email));
    },
    [members, onMemberChanged],
  );

  const handleOpenMemberFormDialog = useCallback(() => {
    setMemberToEdit(undefined);
    setIsMemberDialogOpen(true);
  }, []);

  const handleEditMember = useCallback((member: Member) => {
    setMemberToEdit(member);
    setIsMemberDialogOpen(true);
  }, []);

  const handleCloseMemberFormDialog = useCallback(() => {
    setIsMemberDialogOpen(false);
  }, []);

  const handleOpenImportDialog = useCallback(() => {
    setIsImportDialogOpen(true);
  }, []);

  const handleCloseImportDialog = useCallback(() => {
    setIsImportDialogOpen(false);
  }, []);

  const toast = useToast();

  const handleImportMembers = useCallback(
    (imported: Member[]) => {
      let numberOfAddedMembers = 0;
      let numberOfChangedMembers = 0;

      const allowedKinds = new Set(accountTypeOptions.map(({ value }) => value));

      const membersByName = new Map<string, Member>(members.map((member) => [member.name, member]));
      imported.forEach((importedMember) => {
        if (!allowedKinds.has(importedMember.kind)) {
          return;
        }

        const normalized = isV2
          ? {
              ...importedMember,
              // Project/workspace members carry `admin` / `view`; translate them to ClusterRoles.
              roles: [mapMemberRoleToClusterRole(importedMember.roles?.[0])],
              namespace: importedMember.kind === 'ServiceAccount' ? importedMember.namespace : undefined,
            }
          : importedMember;
        const existingMember = membersByName.get(normalized.name);
        if (!existingMember) {
          numberOfAddedMembers++;
        } else if (!areMembersEqual(normalized, existingMember)) {
          numberOfChangedMembers++;
        }
        membersByName.set(normalized.name, normalized);
      });
      const updatedMembers = Array.from(membersByName.values());

      toast.show(buildToastMessage(numberOfAddedMembers, numberOfChangedMembers, t));
      onMemberChanged(updatedMembers);
    },
    [members, onMemberChanged, t, toast, isV2, accountTypeOptions],
  );

  const handleSaveMember = useCallback(
    (member: Member, isEdit: boolean) => {
      const normalizedMember: Member = {
        ...member,
        provider: providerName,
        namespace: member.kind === 'ServiceAccount' ? member.namespace?.trim() : undefined,
      };
      let updatedMembers: Member[];
      if (isEdit) {
        updatedMembers = members.map((m) => (m.name === memberToEdit?.name ? normalizedMember : m));
      } else {
        updatedMembers = [...members, normalizedMember];
      }
      onMemberChanged(updatedMembers);
      setIsMemberDialogOpen(false);
    },
    [members, onMemberChanged, memberToEdit, providerName],
  );

  const computedProjectName = useMemo(
    () => (type === 'mcp' ? removeProjectPrefix(projectName) : projectName),
    [type, projectName],
  );

  const withTestId = useCallback(
    (testId: string) => (testIdPrefix ? `${testIdPrefix}-${testId}` : testId),
    [testIdPrefix],
  );

  return (
    <FlexBox direction="Column" gap={8}>
      <FlexBox gap={8} justifyContent="SpaceBetween">
        <Button
          className={clsx(styles.addButton, fitContentAddButton && styles.addButtonFitContent)}
          data-testid={withTestId('add-member-button')}
          design="Emphasized"
          icon={'sap-icon://add-employee'}
          onClick={handleOpenMemberFormDialog}
        >
          {t(usesUserGroupAccountTypes ? 'EditMembers.addButtonUserGroup' : 'EditMembers.addButton')}
        </Button>
        {type !== 'project' && showImportButton && (
          <Button
            className={styles.narrowButton}
            data-testid={withTestId('import-members-button')}
            icon={'cause'}
            onClick={handleOpenImportDialog}
          >
            {t('EditMembers.reuseMembersButton')}
          </Button>
        )}
      </FlexBox>
      <AddEditMemberDialog
        open={isMemberDialogOpen}
        existingMembers={members}
        memberToEdit={memberToEdit}
        accountTypeOptions={accountTypeOptions}
        testIdPrefix={testIdPrefix}
        clusterRoles={isV2}
        availableCustomRoles={clusterRolesActive ? lookup.selectable : undefined}
        customRolesState={clusterRolesActive ? lookup.state : undefined}
        platformDocsUrl={clusterRolesActive ? mcpOnboardingAuthDocs : undefined}
        aggregatedRoles={clusterRolesActive ? lookup.aggregated : undefined}
        canManageRoles={clusterRolesActive && (lookup.state === 'ready' || lookup.state === 'error')}
        onRoleApplied={lookup.refresh}
        onClose={handleCloseMemberFormDialog}
        onSave={handleSaveMember}
      />

      {computedProjectName && showImportButton && (
        <ImportMembersDialog
          isOpen={isImportDialogOpen}
          workspaceName={workspaceName}
          projectName={computedProjectName}
          accountTypeOptions={accountTypeOptions}
          onClose={handleCloseImportDialog}
          onImport={handleImportMembers}
        />
      )}

      <MemberTable
        requireAtLeastOneMember={requireAtLeastOneMember}
        members={members}
        clusterRoles={isV2}
        existingClusterRoles={effectiveExistingClusterRoles}
        isValidationError={isValidationError}
        onDeleteMember={handleRemoveMember}
        onEditMember={handleEditMember}
      />
    </FlexBox>
  );
};

function buildToastMessage(addedCount: number, changedCount: number, t: TFunction) {
  const messages: string[] = [];

  if (addedCount === 0 && changedCount === 0) {
    return t('EditMembers.membersToastNoChanges');
  }

  if (addedCount > 0) {
    messages.push(
      addedCount === 1
        ? t('EditMembers.membersToastAdded1')
        : t('EditMembers.membersToastAddedN', { count: addedCount }),
    );
  }

  if (changedCount > 0) {
    messages.push(
      changedCount === 1
        ? t('EditMembers.membersToastChanged1')
        : t('EditMembers.membersToastChangedN', { count: changedCount }),
    );
  }

  return messages.join(' ');
}
