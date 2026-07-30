import '@ui5/webcomponents-icons/dist/add';
import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/edit';
import { Button, CheckBox, FlexBox, Link, Text } from '@ui5/webcomponents-react';
import { FC, useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/ToastContext.tsx';
import { Member } from '../../../../lib/api/types/shared/members.ts';
import { useLink } from '../../../../lib/shared/useLink.ts';
import { ExtraProviderMetadata } from '../../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import { EditMembers } from '../../../Members/EditMembers.tsx';
import { AddEditProviderDialog } from './AddEditProviderDialog.tsx';
import { DeleteProviderConfirmationDialog } from './DeleteProviderConfirmationDialog.tsx';
import styles from './IdentityProviders.module.css';
import { ProviderGroup } from './ProviderGroup.tsx';

export interface IdentityProvidersStepProps {
  members: Member[];
  onMembersChange: (members: Member[]) => void;
  providers: ExtraProviderMetadata[];
  onProvidersChange: (providers: ExtraProviderMetadata[]) => void;
  isDefaultProviderEnabled: boolean;
  onDefaultProviderEnabledChange: (enabled: boolean) => void;
  isValidationError?: boolean;
  workspaceName?: string;
  projectName?: string;
}

export const IdentityProvidersStep: FC<IdentityProvidersStepProps> = ({
  members,
  onMembersChange,
  providers,
  onProvidersChange,
  isDefaultProviderEnabled,
  onDefaultProviderEnabledChange,
  isValidationError = false,
  workspaceName,
  projectName,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { identityProviderGuide } = useLink();

  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState<ExtraProviderMetadata | undefined>(undefined);
  const [providerToDelete, setProviderToDelete] = useState<ExtraProviderMetadata | undefined>(undefined);

  const defaultProviderMembers = useMemo(() => members.filter((m) => !m.provider), [members]);
  const isDefaultCheckboxDisabled = providers.length === 0;

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
    const remainingProviders = providers.filter((p) => p.name !== providerToDelete.name);
    onProvidersChange(remainingProviders);
    onMembersChange(members.filter((m) => m.provider !== providerToDelete.name));
    if (remainingProviders.length === 0 && !isDefaultProviderEnabled) {
      onDefaultProviderEnabledChange(true);
      toast.show(t('IdentityProviders.defaultProviderReenabledToast'));
    }
    setProviderToDelete(undefined);
  }, [
    providerToDelete,
    providers,
    members,
    isDefaultProviderEnabled,
    onProvidersChange,
    onMembersChange,
    onDefaultProviderEnabledChange,
    toast,
    t,
  ]);

  const providerToDeleteMemberCount = useMemo(
    () => (providerToDelete ? members.filter((m) => m.provider === providerToDelete.name).length : 0),
    [providerToDelete, members],
  );

  const providerToEditMemberCount = useMemo(
    () => (providerToEdit ? members.filter((m) => m.provider === providerToEdit.name).length : 0),
    [providerToEdit, members],
  );

  return (
    <>
      <div className={styles.layout}>
        <FlexBox direction="Column" gap={16} className={styles.providerGroupsColumn}>
          <ProviderGroup
            headerText={t('IdentityProviders.defaultProviderGroupTitle')}
            headerActions={
              <CheckBox
                checked={isDefaultProviderEnabled}
                disabled={isDefaultCheckboxDisabled}
                text={t('IdentityProviders.enableDefaultProviderCheckbox')}
                data-testid="default-provider-enabled-checkbox"
                onChange={(e) => onDefaultProviderEnabledChange(e.target.checked)}
              />
            }
          >
            {isDefaultProviderEnabled ? (
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
            ) : (
              <Text className={styles.hiddenProviderHint}>{t('IdentityProviders.defaultProviderDisabledHint')}</Text>
            )}
            {isDefaultCheckboxDisabled && (
              <Text className={styles.hiddenProviderHint}>{t('IdentityProviders.defaultProviderLockedHint')}</Text>
            )}
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
                members={members.filter((m) => m.provider === provider.name)}
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
        </FlexBox>

        <FlexBox direction="Column" gap={16} className={styles.addProviderColumn}>
          <Text>
            <Trans
              i18nKey="IdentityProviders.docsLinkInfo"
              components={{ link1: <Link href={identityProviderGuide} target="_blank" /> }}
            />
          </Text>
          <Button
            icon="add"
            design="Emphasized"
            className={styles.addProviderButton}
            data-testid="add-provider-button"
            onClick={handleOpenAddProviderDialog}
          >
            {t('IdentityProviders.addProviderButton')}
          </Button>
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
