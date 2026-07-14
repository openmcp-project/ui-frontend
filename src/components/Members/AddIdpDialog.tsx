import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Dialog, FlexBox, Input, Label, MessageStrip } from '@ui5/webcomponents-react';
import { FC, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ControlPlaneIdp, DEFAULT_IDP_NAME } from '../../lib/api/types/shared/members.ts';
import styles from './Members.module.css';

interface AddIdpDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (idp: ControlPlaneIdp) => void;
  existingIdps: ControlPlaneIdp[];
}

type IdpFormData = {
  name: string;
  issuer: string;
  clientID: string;
  usernameClaim?: string;
  usernamePrefix?: string;
  groupsClaim?: string;
  groupsPrefix?: string;
  extraScopes?: string;
};

export const AddIdpDialog: FC<AddIdpDialogProps> = ({ open, onClose, onSave, existingIdps }) => {
  const { t } = useTranslation();

  const idpFormSchema = useMemo(
    () =>
      z
        .object({
          name: z.string(),
          issuer: z.string(),
          clientID: z.string(),
          usernameClaim: z.string().optional(),
          usernamePrefix: z.string().optional(),
          groupsClaim: z.string().optional(),
          groupsPrefix: z.string().optional(),
          extraScopes: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          const name = data.name.trim();
          if (!name) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: t('validationErrors.required') });
          } else if (name.toLowerCase() === DEFAULT_IDP_NAME) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: t('AddIdpDialog.reservedName') });
          } else if (existingIdps.some((idp) => idp.name === name)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: t('AddIdpDialog.duplicateName') });
          }
          if (!data.issuer.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['issuer'], message: t('validationErrors.required') });
          }
          if (!data.clientID.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['clientID'], message: t('validationErrors.required') });
          }
        }),
    [t, existingIdps],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IdpFormData>({
    resolver: zodResolver(idpFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      issuer: '',
      clientID: '',
      usernameClaim: '',
      usernamePrefix: '',
      groupsClaim: '',
      groupsPrefix: '',
      extraScopes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        issuer: '',
        clientID: '',
        usernameClaim: '',
        usernamePrefix: '',
        groupsClaim: '',
        groupsPrefix: '',
        extraScopes: '',
      });
    }
  }, [open, reset]);

  const onFormSubmit = (data: IdpFormData) => {
    const idp: ControlPlaneIdp = {
      name: data.name.trim(),
      issuer: data.issuer.trim(),
      clientID: data.clientID.trim(),
      ...(data.usernameClaim?.trim() && { usernameClaim: data.usernameClaim.trim() }),
      ...(data.usernamePrefix?.trim() && { usernamePrefix: data.usernamePrefix.trim() }),
      ...(data.groupsClaim?.trim() && { groupsClaim: data.groupsClaim.trim() }),
      ...(data.groupsPrefix?.trim() && { groupsPrefix: data.groupsPrefix.trim() }),
      ...(data.extraScopes?.trim() && {
        extraScopes: data.extraScopes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    };
    onSave(idp);
    onClose();
  };

  const field = (id: keyof IdpFormData, label: string, opts: { type?: 'Text' | 'URL'; placeholder?: string } = {}) => (
    <FlexBox direction="Column" alignItems="Stretch" className={styles.wrapper}>
      <Label for={`idp-${id}`}>{label}</Label>
      <Input
        id={`idp-${id}`}
        type={opts.type ?? 'Text'}
        placeholder={opts.placeholder}
        className={styles.input}
        data-testid={`idp-${id}-input`}
        {...register(id)}
        valueState={errors[id] ? 'Negative' : 'None'}
        valueStateMessage={<span>{errors[id]?.message}</span>}
      />
    </FlexBox>
  );

  return (
    <Dialog open={open} headerText={t('AddIdpDialog.title')} onClose={onClose}>
      <div className={styles.container}>
        <MessageStrip className={styles.info} design="Information" hideCloseButton>
          {t('AddIdpDialog.intro')}
        </MessageStrip>
        {field('name', t('AddIdpDialog.nameLabel'), { placeholder: t('AddIdpDialog.namePlaceholder') })}
        {field('issuer', t('AddIdpDialog.issuerLabel'), { type: 'URL', placeholder: 'https://oidc.example.com' })}
        {field('clientID', t('AddIdpDialog.clientIdLabel'))}
        <Label>{t('AddIdpDialog.advancedSection')}</Label>
        {field('usernameClaim', t('AddIdpDialog.usernameClaimLabel'), { placeholder: 'sub' })}
        {field('usernamePrefix', t('AddIdpDialog.usernamePrefixLabel'))}
        {field('groupsClaim', t('AddIdpDialog.groupsClaimLabel'))}
        {field('groupsPrefix', t('AddIdpDialog.groupsPrefixLabel'))}
        {field('extraScopes', t('AddIdpDialog.extraScopesLabel'), {
          placeholder: t('AddIdpDialog.extraScopesPlaceholder'),
        })}
        <Button
          className={styles.addButton}
          data-testid="add-idp-submit"
          design="Emphasized"
          icon="add"
          onClick={() => handleSubmit(onFormSubmit)()}
        >
          {t('AddIdpDialog.saveButton')}
        </Button>
        <Button className={styles.wrapper} onClick={onClose}>
          {t('buttons.cancel')}
        </Button>
      </div>
    </Dialog>
  );
};
