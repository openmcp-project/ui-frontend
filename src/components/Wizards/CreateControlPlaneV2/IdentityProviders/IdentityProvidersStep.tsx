import { Button, FlexBox, Link, MessageStrip, Text } from '@ui5/webcomponents-react';
import { FC, useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { stringify } from 'yaml';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard.ts';
import { Member } from '../../../../lib/api/types/shared/members.ts';
import { useLink } from '../../../../lib/shared/useLink.ts';
import { buildRoleBindingsForProviderMembers } from '../../../../spaces/controlPlaneV2/helpers/buildRoleBindingsForProviderMembers.ts';
import { buildMcpV2GraphQLInput } from '../../../../spaces/controlPlaneV2/helpers/controlPlaneV2GraphQLInput.ts';
import { hasAssignedIamMember } from '../../../../spaces/controlPlaneV2/helpers/hasAssignedIamMember.ts';
import { ExtraProviderMetadata } from '../../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import { EditMembers } from '../../../Members/EditMembers.tsx';
import { YamlViewer } from '../../../Yaml/YamlViewer.tsx';
import { AddEditProviderDialog } from './AddEditProviderDialog.tsx';
import { DeleteProviderConfirmationDialog } from './DeleteProviderConfirmationDialog.tsx';
import styles from './IdentityProviders.module.css';
import { ProviderGroup } from './ProviderGroup.tsx';

export interface IdentityProvidersStepProps {
  members: Member[];
  onMembersChange: (members: Member[]) => void;
  providers: ExtraProviderMetadata[];
  onProvidersChange: (providers: ExtraProviderMetadata[]) => void;
  isValidationError?: boolean;
  workspaceName?: string;
  projectName?: string;
}

export const IdentityProvidersStep: FC<IdentityProvidersStepProps> = ({
  members,
  onMembersChange,
  providers,
  onProvidersChange,
  isValidationError = false,
  workspaceName,
  projectName,
}) => {
  const { t } = useTranslation();
  const { identityProviderGuide } = useLink();
  const { copyToClipboard } = useCopyToClipboard();

  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState<ExtraProviderMetadata | undefined>(undefined);
  const [providerToDelete, setProviderToDelete] = useState<ExtraProviderMetadata | undefined>(undefined);

  const membersByProvider = useMemo(() => {
    const grouped = new Map<string, Member[]>();
    for (const member of members) {
      const key = member.provider ?? '';
      grouped.set(key, [...(grouped.get(key) ?? []), member]);
    }
    return grouped;
  }, [members]);

  const defaultProviderMembers = useMemo(() => membersByProvider.get('') ?? [], [membersByProvider]);
  const hasNoAssignedMembers = useMemo(() => !hasAssignedIamMember(members, providers), [members, providers]);

  const oidcYaml = useMemo(() => {
    const roleBindings = buildRoleBindingsForProviderMembers(defaultProviderMembers);
    const extraProvidersInput = providers.map((provider) => ({
      ...provider,
      roleBindings: buildRoleBindingsForProviderMembers(membersByProvider.get(provider.name) ?? []),
    }));
    const { spec } = buildMcpV2GraphQLInput({
      name: '',
      namespace: '',
      roleBindings,
      extraProviders: extraProvidersInput,
    });
    return stringify(spec?.iam?.oidc ?? {});
  }, [defaultProviderMembers, membersByProvider, providers]);

  const handleDefaultMembersChange = useCallback(
    (updatedSlice: Member[]) => {
      onMembersChange([...updatedSlice, ...members.filter((m) => !!m.provider)]);
    },
    [members, onMembersChange],
  );

  const handleProviderMembersChange = useCallback(
    (providerName: string, updatedSlice: Member[]) => {
      onMembersChange([...members.filter((m) => m.provider !== providerName), ...updatedSlice]);
    },
    [members, onMembersChange],
  );

  const handleOpenAddProviderDialog = useCallback(() => {
    setProviderToEdit(undefined);
    setIsProviderDialogOpen(true);
  }, []);

  const handleOpenEditProviderDialog = useCallback((provider: ExtraProviderMetadata) => {
    setProviderToEdit(provider);
    setIsProviderDialogOpen(true);
  }, []);

  const handleCloseProviderDialog = useCallback(() => {
    setIsProviderDialogOpen(false);
  }, []);

  const handleSaveProvider = useCallback(
    (provider: ExtraProviderMetadata, isEdit: boolean, previousName?: string) => {
      if (isEdit && previousName) {
        onProvidersChange(providers.map((p) => (p.name === previousName ? provider : p)));
        if (previousName !== provider.name) {
          onMembersChange(members.map((m) => (m.provider === previousName ? { ...m, provider: provider.name } : m)));
        }
      } else {
        onProvidersChange([...providers, provider]);
      }
    },
    [providers, members, onProvidersChange, onMembersChange],
  );

  const handleOpenDeleteDialog = useCallback((provider: ExtraProviderMetadata) => {
    setProviderToDelete(provider);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setProviderToDelete(undefined);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!providerToDelete) return;
    onProvidersChange(providers.filter((p) => p.name !== providerToDelete.name));
    onMembersChange(members.filter((m) => m.provider !== providerToDelete.name));
    setProviderToDelete(undefined);
  }, [providerToDelete, providers, members, onProvidersChange, onMembersChange]);

  const providerToDeleteMemberCount = providerToDelete
    ? (membersByProvider.get(providerToDelete.name)?.length ?? 0)
    : 0;

  const providerToEditMemberCount = providerToEdit ? (membersByProvider.get(providerToEdit.name)?.length ?? 0) : 0;

  return (
    <>
      {hasNoAssignedMembers && (
        <MessageStrip
          design="Negative"
          hideCloseButton
          className={styles.noMembersError}
          data-testid="no-members-error"
        >
          {t('IdentityProviders.noMembersError')}
        </MessageStrip>
      )}
      <div className={styles.layout}>
        <FlexBox direction="Column" gap={16} className={styles.providerGroupsColumn}>
          <ProviderGroup headerText={t('IdentityProviders.defaultProviderGroupTitle')}>
            <EditMembers
              members={defaultProviderMembers}
              isValidationError={isValidationError}
              requireAtLeastOneMember={false}
              workspaceName={workspaceName}
              projectName={projectName}
              type="mcp"
              isV2
              fitContentAddButton
              testIdPrefix="default-provider"
              onMemberChanged={handleDefaultMembersChange}
            />
          </ProviderGroup>

          {providers.map((provider) => (
            <ProviderGroup
              key={provider.name}
              headerText={provider.name}
              headerActions={
                <>
                  <Button
                    icon="edit"
                    design="Transparent"
                    accessibleName={t('IdentityProviders.editProviderButtonTooltip')}
                    data-testid={`edit-provider-${provider.name}`}
                    onClick={() => handleOpenEditProviderDialog(provider)}
                  />
                  <Button
                    icon="delete"
                    design="Transparent"
                    accessibleName={t('IdentityProviders.deleteProviderButtonTooltip')}
                    data-testid={`delete-provider-${provider.name}`}
                    onClick={() => handleOpenDeleteDialog(provider)}
                  />
                </>
              }
            >
              <EditMembers
                members={membersByProvider.get(provider.name) ?? []}
                isValidationError={isValidationError}
                requireAtLeastOneMember={false}
                type="mcp"
                isV2
                showImportButton={false}
                fitContentAddButton
                providerName={provider.name}
                testIdPrefix={`provider-${provider.name}`}
                onMemberChanged={(updatedSlice) => handleProviderMembersChange(provider.name, updatedSlice)}
              />
            </ProviderGroup>
          ))}
          <Text>
            <Trans
              i18nKey="IdentityProviders.docsLinkInfo"
              components={{ link1: <Link href={identityProviderGuide} target="_blank" /> }}
            />
          </Text>
          <Button
            icon="add"
            design={'Transparent'}
            className={styles.addProviderButton}
            data-testid="add-provider-button"
            onClick={handleOpenAddProviderDialog}
          >
            {t('IdentityProviders.addProviderButton')}
          </Button>
        </FlexBox>

        <FlexBox direction="Column" gap={16} className={styles.yaml}>
          <FlexBox direction="Row" justifyContent="SpaceBetween" alignItems="Center">
            <Text className={styles.yamlPreviewTitle}>{t('IdentityProviders.yamlPreviewTitle')}</Text>
            <Button icon="copy" design="Transparent" onClick={() => copyToClipboard(oidcYaml)}>
              {t('buttons.copy')}
            </Button>
          </FlexBox>
          <YamlViewer yamlString={oidcYaml} filename="identity-providers" />
        </FlexBox>
      </div>

      <AddEditProviderDialog
        open={isProviderDialogOpen}
        existingProviders={providers}
        providerToEdit={providerToEdit}
        memberCountForEditedProvider={providerToEditMemberCount}
        onClose={handleCloseProviderDialog}
        onSave={handleSaveProvider}
      />

      <DeleteProviderConfirmationDialog
        open={!!providerToDelete}
        providerName={providerToDelete?.name ?? ''}
        memberCount={providerToDeleteMemberCount}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
