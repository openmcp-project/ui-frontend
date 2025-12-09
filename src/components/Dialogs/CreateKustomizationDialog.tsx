import { Dialog, Bar, Label, Input, Button, Form, FormGroup, CheckBox } from '@ui5/webcomponents-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useId } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useCreateKustomization as _useCreateKustomization,
  CreateKustomizationParams,
} from '../../hooks/useCreateKustomization';
import styles from './CreateKustomizationDialog.module.css';
import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/add';

interface CreateKustomizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  useCreateKustomization?: typeof _useCreateKustomization;
}

export function CreateKustomizationDialog({
  isOpen,
  onClose,
  useCreateKustomization = _useCreateKustomization,
}: CreateKustomizationDialogProps) {
  const { t } = useTranslation();
  const { createKustomization, isLoading } = useCreateKustomization();

  const namespaceId = useId();
  const nameId = useId();
  const intervalId = useId();
  const sourceRefNameId = useId();
  const pathId = useId();
  const pruneId = useId();
  const targetNamespaceId = useId();

  const validationSchema = z.object({
    namespace: z.string().min(1, { message: t('validationErrors.required') }),
    name: z.string().min(1, { message: t('validationErrors.required') }),
    interval: z.string().min(1, { message: t('validationErrors.required') }),
    sourceRefName: z.string().min(1, { message: t('validationErrors.required') }),
    path: z.string().min(1, { message: t('validationErrors.required') }),
    prune: z.boolean(),
    targetNamespace: z.string().optional(),
    substitutions: z
      .array(
        z.object({
          key: z.string().min(1, { message: t('validationErrors.required') }),
          value: z.string().min(1, { message: t('validationErrors.required') }),
        }),
      )
      .optional(),
  });

  type FormSchema = z.infer<typeof validationSchema>;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormSchema>({
    defaultValues: {
      namespace: 'default',
      name: '',
      interval: '1m0s',
      sourceRefName: '',
      path: './',
      prune: true,
      targetNamespace: '',
      substitutions: [],
    },
    resolver: zodResolver(validationSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'substitutions',
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = () => {
    void handleSubmit(async (data) => {
      try {
        await createKustomization(data as CreateKustomizationParams);
        reset();
        onClose();
      } catch {
        // Error handled by hook
      }
    })();
  };

  return (
    <Dialog
      open={isOpen}
      headerText={t('CreateKustomizationDialog.dialogTitle')}
      footer={
        <Bar
          endContent={
            <>
              <Button design="Transparent" onClick={handleClose}>
                {t('buttons.cancel', 'Cancel')}
              </Button>
              <Button design="Emphasized" disabled={isLoading} onClick={handleCreate}>
                {t('buttons.create', 'Create')}
              </Button>
            </>
          }
        />
      }
      onClose={handleClose}
    >
      <div className={styles.container}>
        <div className={styles.column}>
          <Form className={styles.form}>
            <FormGroup headerText={t('CreateKustomizationDialog.metadataTitle')}>
              <div className={styles.formField}>
                <Label required for={namespaceId}>
                  {t('common.namespace', 'Namespace')}
                </Label>
                <Controller
                  name="namespace"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id={namespaceId}
                      valueState={errors.namespace ? 'Negative' : 'None'}
                      valueStateMessage={<span>{errors.namespace?.message}</span>}
                      className={styles.input}
                    />
                  )}
                />
              </div>

              <div className={styles.formField}>
                <Label required for={nameId}>
                  {t('CreateKustomizationDialog.nameTitle')}
                </Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id={nameId}
                      valueState={errors.name ? 'Negative' : 'None'}
                      valueStateMessage={<span>{errors.name?.message}</span>}
                      className={styles.input}
                    />
                  )}
                />
              </div>
            </FormGroup>

            <FormGroup headerText={t('CreateKustomizationDialog.specTitle')}>
              <div className={styles.formField}>
                <Label required for={intervalId}>
                  {t('CreateKustomizationDialog.intervalTitle')}
                </Label>
                <Controller
                  name="interval"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id={intervalId}
                      valueState={errors.interval ? 'Negative' : 'None'}
                      valueStateMessage={<span>{errors.interval?.message}</span>}
                      placeholder="1m0s"
                      className={styles.input}
                    />
                  )}
                />
              </div>

              <div className={styles.formField}>
                <Label required for={pathId}>
                  {t('CreateKustomizationDialog.pathTitle')}
                </Label>
                <Controller
                  name="path"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id={pathId}
                      valueState={errors.path ? 'Negative' : 'None'}
                      valueStateMessage={<span>{errors.path?.message}</span>}
                      placeholder="./"
                      className={styles.input}
                    />
                  )}
                />
              </div>

              <div className={styles.formField}>
                <Label for={targetNamespaceId}>{t('CreateKustomizationDialog.targetNamespaceTitle')}</Label>
                <Controller
                  name="targetNamespace"
                  control={control}
                  render={({ field }) => <Input {...field} id={targetNamespaceId} className={styles.input} />}
                />
              </div>

              <div className={styles.formField}>
                <Label required for={sourceRefNameId}>
                  {t('CreateKustomizationDialog.gitRepositoryTitle')}
                </Label>
                <Controller
                  name="sourceRefName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id={sourceRefNameId}
                      placeholder={t('CreateKustomizationDialog.sourceRefNameTitle')}
                      valueState={errors.sourceRefName ? 'Negative' : 'None'}
                      valueStateMessage={<span>{errors.sourceRefName?.message}</span>}
                      className={styles.input}
                    />
                  )}
                />
              </div>

              <div className={styles.formField}>
                <Controller
                  name="prune"
                  control={control}
                  render={({ field }) => (
                    <CheckBox
                      name={field.name}
                      checked={field.value}
                      text={t('CreateKustomizationDialog.pruneTitle')}
                      id={pruneId}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              </div>
            </FormGroup>
          </Form>
        </div>

        <div className={styles.column}>
          <Form className={styles.form}>
            <FormGroup headerText={t('CreateKustomizationDialog.substitutionsTitle')}>
              <div className={styles.formField}>
                {fields.map((field, index) => (
                  <div key={field.id} className={styles.substitutionRow}>
                    <Controller
                      name={`substitutions.${index}.key`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder={t('CreateKustomizationDialog.keyPlaceholder')}
                          className={styles.substitutionInput}
                          valueState={errors.substitutions?.[index]?.key ? 'Negative' : 'None'}
                        />
                      )}
                    />
                    <Controller
                      name={`substitutions.${index}.value`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder={t('CreateKustomizationDialog.valuePlaceholder')}
                          className={styles.substitutionInput}
                          valueState={errors.substitutions?.[index]?.value ? 'Negative' : 'None'}
                        />
                      )}
                    />
                    <Button icon="delete" design="Transparent" onClick={() => remove(index)} />
                  </div>
                ))}
                <Button icon="add" design="Transparent" onClick={() => append({ key: '', value: '' })}>
                  {t('CreateKustomizationDialog.addSubstitutionButton')}
                </Button>
              </div>
            </FormGroup>
          </Form>
        </div>
      </div>
    </Dialog>
  );
}
