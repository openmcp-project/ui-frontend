import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bar,
  Button,
  CheckBox,
  Dialog,
  Form,
  FormGroup,
  Input,
  InputDomRef,
  Label,
  MessageStrip,
  Panel,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { FC, useEffect, useId, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { oidcIssuerUrlSchema, oidcProviderNameRegex } from '../../../../lib/api/validations/regex.ts';
import {
  ExtraProviderMetadata,
  OIDC_PROVIDER_NAME_MAX_LENGTH,
  OIDC_RESERVED_PROVIDER_NAMES,
} from '../../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import styles from './IdentityProviders.module.css';
import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/add';

interface AddEditProviderDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (provider: ExtraProviderMetadata, isEdit: boolean, previousName?: string) => void;
  existingProviders: ExtraProviderMetadata[];
  providerToEdit?: ExtraProviderMetadata;
  memberCountForEditedProvider?: number;
}

type ProviderFormData = {
  name: string;
  issuer: string;
  clientID: string;
  usernameClaim: string;
  usernamePrefix: string;
  disableUsernamePrefix: boolean;
  groupsClaim: string;
  groupsPrefix: string;
  disableGroupsPrefix: boolean;
  extraScopes: { value: string }[];
};

const emptyFormValues: ProviderFormData = {
  name: '',
  issuer: '',
  clientID: '',
  usernameClaim: '',
  usernamePrefix: '',
  disableUsernamePrefix: false,
  groupsClaim: '',
  groupsPrefix: '',
  disableGroupsPrefix: false,
  extraScopes: [],
};

export const AddEditProviderDialog: FC<AddEditProviderDialogProps> = ({
  open,
  onClose,
  onSave,
  existingProviders,
  providerToEdit,
  memberCountForEditedProvider = 0,
}) => {
  const { t } = useTranslation();
  const isEdit = !!providerToEdit;
  const [isAdvancedCollapsed, setIsAdvancedCollapsed] = useState(true);

  const nameId = useId();
  const issuerId = useId();
  const clientIdId = useId();
  const usernameClaimId = useId();
  const usernamePrefixId = useId();
  const groupsClaimId = useId();
  const groupsPrefixId = useId();

  const providerFormSchema = useMemo(
    () =>
      z
        .object({
          name: z.string(),
          issuer: z.string(),
          clientID: z.string(),
          usernameClaim: z.string(),
          usernamePrefix: z.string(),
          disableUsernamePrefix: z.boolean(),
          groupsClaim: z.string(),
          groupsPrefix: z.string(),
          disableGroupsPrefix: z.boolean(),
          extraScopes: z.array(z.object({ value: z.string() })),
        })
        .superRefine((data, ctx) => {
          const trimmedName = data.name.trim();
          if (!trimmedName) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: t('validationErrors.required') });
          } else if ((OIDC_RESERVED_PROVIDER_NAMES as readonly string[]).includes(trimmedName)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['name'],
              message: t('validationErrors.reservedProviderName'),
            });
          } else if (!oidcProviderNameRegex.test(trimmedName) || trimmedName.length > OIDC_PROVIDER_NAME_MAX_LENGTH) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['name'],
              message: t('validationErrors.invalidProviderName'),
            });
          } else if (
            existingProviders.some(
              (p) => p.name === trimmedName && (!providerToEdit || trimmedName !== providerToEdit.name),
            )
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['name'],
              message: t('validationErrors.duplicateProviderName'),
            });
          }

          const trimmedIssuer = data.issuer.trim();
          if (!trimmedIssuer) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['issuer'], message: t('validationErrors.required') });
          } else if (!oidcIssuerUrlSchema.safeParse(trimmedIssuer).success) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['issuer'],
              message: t('validationErrors.issuerUrlFormat'),
            });
          }

          if (!data.clientID.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['clientID'], message: t('validationErrors.required') });
          }
        }),
    [t, existingProviders, providerToEdit],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProviderFormData>({
    resolver: zodResolver(providerFormSchema),
    mode: 'onChange',
    defaultValues: emptyFormValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'extraScopes' });
  const name = useWatch({ control, name: 'name' });
  const disableUsernamePrefix = useWatch({ control, name: 'disableUsernamePrefix' });
  const disableGroupsPrefix = useWatch({ control, name: 'disableGroupsPrefix' });

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAdvancedCollapsed(true);
    if (providerToEdit) {
      reset({
        name: providerToEdit.name,
        issuer: providerToEdit.issuer,
        clientID: providerToEdit.clientID,
        usernameClaim: providerToEdit.usernameClaim ?? '',
        usernamePrefix: providerToEdit.usernamePrefix ?? '',
        disableUsernamePrefix: providerToEdit.usernamePrefix === '',
        groupsClaim: providerToEdit.groupsClaim ?? '',
        groupsPrefix: providerToEdit.groupsPrefix ?? '',
        disableGroupsPrefix: providerToEdit.groupsPrefix === '',
        extraScopes: (providerToEdit.extraScopes ?? []).map((value) => ({ value })),
      });
    } else {
      reset(emptyFormValues);
    }
  }, [open, providerToEdit, reset]);

  const onFormSubmit = (data: ProviderFormData) => {
    const trimmedName = data.name.trim();
    const provider: ExtraProviderMetadata = {
      name: trimmedName,
      issuer: data.issuer.trim(),
      clientID: data.clientID.trim(),
      usernameClaim: data.usernameClaim?.trim() || undefined,
      usernamePrefix: data.disableUsernamePrefix ? '' : data.usernamePrefix?.trim() || undefined,
      groupsClaim: data.groupsClaim?.trim() || undefined,
      groupsPrefix: data.disableGroupsPrefix ? '' : data.groupsPrefix?.trim() || undefined,
      extraScopes: data.extraScopes.map((s) => s.value.trim()).filter((v) => !!v),
    };
    onSave(provider, isEdit, providerToEdit?.name);
    onClose();
  };

  const showRenameWarning = isEdit && memberCountForEditedProvider > 0 && name?.trim() !== providerToEdit?.name;
  // Mirrors resolveExtraProviderUsernamePrefix/resolveExtraProviderGroupsPrefix's "unset" default.
  const defaultPrefixPlaceholder = `${name?.trim() || 'provider-name'}:`;

  return (
    <Dialog
      open={open}
      headerText={isEdit ? t('IdentityProviders.editDialogTitle') : t('IdentityProviders.addDialogTitle')}
      footer={
        <Bar
          design="Footer"
          endContent={
            <>
              <Button design="Transparent" onClick={onClose}>
                {t('buttons.cancel')}
              </Button>
              <Button
                design="Emphasized"
                data-testid="save-provider-button"
                onClick={() => handleSubmit(onFormSubmit)()}
              >
                {isEdit ? t('EditMembers.saveButton') : t('IdentityProviders.addProviderButton')}
              </Button>
            </>
          }
        />
      }
      onClose={onClose}
    >
      {showRenameWarning && (
        <MessageStrip design="Critical" hideCloseButton className={styles.advancedField}>
          {t('IdentityProviders.renameWarning', { count: memberCountForEditedProvider })}
        </MessageStrip>
      )}
      <Form>
        <FormGroup>
          <div className={styles.advancedField}>
            <Label required for={nameId}>
              {t('common.name')}
            </Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={nameId}
                  className={styles.input}
                  placeholder="corporate-idp"
                  valueState={errors.name ? 'Negative' : 'None'}
                  valueStateMessage={<span>{errors.name?.message}</span>}
                  data-testid="provider-name-input"
                  onInput={(e: Ui5CustomEvent<InputDomRef, never>) => field.onChange(e.target.value)}
                />
              )}
            />
          </div>

          <div className={styles.advancedField}>
            <Label required for={issuerId}>
              {t('IdentityProviders.issuerLabel')}
            </Label>
            <Controller
              name="issuer"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={issuerId}
                  className={styles.input}
                  placeholder="https://accounts.example.com"
                  valueState={errors.issuer ? 'Negative' : 'None'}
                  valueStateMessage={<span>{errors.issuer?.message}</span>}
                  data-testid="provider-issuer-input"
                />
              )}
            />
          </div>

          <div className={styles.advancedField}>
            <Label required for={clientIdId}>
              {t('IdentityProviders.clientIdLabel')}
            </Label>
            <Controller
              name="clientID"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={clientIdId}
                  className={styles.input}
                  placeholder="a1b2c3d4-e5f6-47a8-9b3c-1d2e3f4a5b6c"
                  valueState={errors.clientID ? 'Negative' : 'None'}
                  valueStateMessage={<span>{errors.clientID?.message}</span>}
                  data-testid="provider-client-id-input"
                />
              )}
            />
          </div>
        </FormGroup>
      </Form>

      <Panel
        headerText={t('IdentityProviders.advancedSettings')}
        collapsed={isAdvancedCollapsed}
        data-testid="advanced-settings-panel"
        onToggle={() => setIsAdvancedCollapsed((v) => !v)}
      >
        <div className={styles.advancedField}>
          <Label for={usernameClaimId}>{t('IdentityProviders.usernameClaimLabel')}</Label>
          <Controller
            name="usernameClaim"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={usernameClaimId}
                className={styles.input}
                placeholder="email"
                data-testid="provider-username-claim-input"
              />
            )}
          />
        </div>

        <div className={styles.advancedField}>
          <Label for={usernamePrefixId}>{t('IdentityProviders.usernamePrefixLabel')}</Label>
          <Controller
            name="usernamePrefix"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={usernamePrefixId}
                className={styles.input}
                disabled={disableUsernamePrefix}
                placeholder={defaultPrefixPlaceholder}
                data-testid="provider-username-prefix-input"
              />
            )}
          />
          <Controller
            name="disableUsernamePrefix"
            control={control}
            render={({ field }) => (
              <CheckBox
                name={field.name}
                checked={field.value}
                text={t('IdentityProviders.disableUsernamePrefixCheckbox')}
                data-testid="provider-disable-username-prefix-checkbox"
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>

        <div className={styles.advancedField}>
          <Label for={groupsClaimId}>{t('IdentityProviders.groupsClaimLabel')}</Label>
          <Controller
            name="groupsClaim"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={groupsClaimId}
                className={styles.input}
                placeholder="groups"
                data-testid="provider-groups-claim-input"
              />
            )}
          />
        </div>

        <div className={styles.advancedField}>
          <Label for={groupsPrefixId}>{t('IdentityProviders.groupsPrefixLabel')}</Label>
          <Controller
            name="groupsPrefix"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={groupsPrefixId}
                className={styles.input}
                disabled={disableGroupsPrefix}
                placeholder={defaultPrefixPlaceholder}
                data-testid="provider-groups-prefix-input"
              />
            )}
          />
          <Controller
            name="disableGroupsPrefix"
            control={control}
            render={({ field }) => (
              <CheckBox
                name={field.name}
                checked={field.value}
                text={t('IdentityProviders.disableGroupsPrefixCheckbox')}
                data-testid="provider-disable-groups-prefix-checkbox"
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>

        <div className={styles.advancedField}>
          <Label>{t('IdentityProviders.extraScopesLabel')}</Label>
          {fields.map((field, index) => (
            <div key={field.id} className={styles.extraScopeRow}>
              <Controller
                name={`extraScopes.${index}.value`}
                control={control}
                render={({ field }) => (
                  <Input {...field} className={styles.input} data-testid={`provider-extra-scope-input-${index}`} />
                )}
              />
              <Button
                icon="delete"
                design="Transparent"
                data-testid={`provider-remove-scope-button-${index}`}
                onClick={() => remove(index)}
              />
            </div>
          ))}
          <Button
            icon="add"
            design="Transparent"
            data-testid="provider-add-scope-button"
            onClick={() => append({ value: '' })}
          >
            {t('IdentityProviders.addScopeButton')}
          </Button>
        </div>
      </Panel>
    </Dialog>
  );
};
