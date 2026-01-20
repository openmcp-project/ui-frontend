import { Dialog, Bar, Label, Input, Button, Form, FormGroup, Select, Option } from '@ui5/webcomponents-react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useId } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateGitRepository as _useCreateGitRepository } from '../../hooks/useCreateGitRepository';
import styles from './CreateGitRepositoryDialog.module.css';

interface CreateGitRepositoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  useCreateGitRepository?: typeof _useCreateGitRepository;
}

export function CreateGitRepositoryDialog({
  isOpen,
  onClose,
  useCreateGitRepository = _useCreateGitRepository,
}: CreateGitRepositoryDialogProps) {
  const { t } = useTranslation();
  const { createGitRepository, isLoading } = useCreateGitRepository();
  const namespaceId = useId();
  const nameId = useId();
  const intervalId = useId();
  const urlId = useId();
  const refTypeId = useId();
  const refValueId = useId();
  const secretRefId = useId();

  const validationSchema = z.object({
    namespace: z.string().min(1, { message: t('validationErrors.required') }),
    name: z.string().min(1, { message: t('validationErrors.required') }),
    interval: z.string().min(1, { message: t('validationErrors.required') }),
    url: z.url({ protocol: /^https$/, message: t('validationErrors.urlFormat') }),
    refType: z.enum(['tag', 'commit', 'semver', 'branch', 'name'], {
      message: t('validationErrors.required'),
    }),
    refValue: z.string().min(1, { message: t('validationErrors.required') }),
    secretRef: z.string().optional(),
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
      url: '',
      refType: 'branch',
      refValue: 'main',
      secretRef: '',
    },
    resolver: zodResolver(validationSchema),
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = () => {
    void handleSubmit(async (data) => {
      try {
        await createGitRepository(data);
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
      headerText={t('CreateGitRepositoryDialog.dialogTitle')}
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
      <Form className={styles.form}>
        <FormGroup headerText={t('CreateGitRepositoryDialog.metadataTitle')}>
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
              {t('CreateGitRepositoryDialog.nameTitle')}
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

        <FormGroup headerText={t('CreateGitRepositoryDialog.specTitle')}>
          <div className={styles.formField}>
            <Label required for={urlId}>
              {t('CreateGitRepositoryDialog.urlTitle')}
            </Label>
            <Controller
              name="url"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={urlId}
                  valueState={errors.url ? 'Negative' : 'None'}
                  valueStateMessage={<span>{errors.url?.message}</span>}
                  placeholder="https://github.com/owner/repo"
                  className={styles.input}
                />
              )}
            />
          </div>

          <div className={styles.formField}>
            <Label required for={refTypeId}>
              {t('CreateGitRepositoryDialog.refTypeTitle', 'Type')}
            </Label>
            <Controller
              name="refType"
              control={control}
              render={({ field }) => (
                <Select
                  id={refTypeId}
                  name={field.name}
                  valueState={errors.refType ? 'Negative' : 'None'}
                  valueStateMessage={<span>{errors.refType?.message}</span>}
                  className={styles.input}
                  data-testid="git-ref-type"
                  onChange={(event) => {
                    const selectedValue = (event.detail.selectedOption as HTMLElement | undefined)?.dataset?.value;
                    field.onChange(selectedValue ?? '');
                  }}
                >
                  <Option data-value="tag" selected={field.value === 'tag'}>
                    {t('CreateGitRepositoryDialog.refTypeTag', 'Tag')}
                  </Option>
                  <Option data-value="commit" selected={field.value === 'commit'}>
                    {t('CreateGitRepositoryDialog.refTypeCommit', 'Commit')}
                  </Option>
                  <Option data-value="semver" selected={field.value === 'semver'}>
                    {t('CreateGitRepositoryDialog.refTypeSemver', 'Semver')}
                  </Option>
                  <Option data-value="branch" selected={field.value === 'branch'}>
                    {t('CreateGitRepositoryDialog.refTypeBranch', 'Branch')}
                  </Option>
                  <Option data-value="name" selected={field.value === 'name'}>
                    {t('CreateGitRepositoryDialog.refTypeName', 'Name')}
                  </Option>
                </Select>
              )}
            />
          </div>

          <div className={styles.formField}>
            <Label required for={refValueId}>
              {t('CreateGitRepositoryDialog.refValueTitle', 'Reference')}
            </Label>
            <Controller
              name="refValue"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={refValueId}
                  valueState={errors.refValue ? 'Negative' : 'None'}
                  valueStateMessage={<span>{errors.refValue?.message}</span>}
                  placeholder="main"
                  className={styles.input}
                />
              )}
            />
          </div>

          <div className={styles.formField}>
            <Label required for={intervalId}>
              {t('CreateGitRepositoryDialog.intervalTitle')}
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
            <Label for={secretRefId}>{t('CreateGitRepositoryDialog.secretRefTitle', 'SecretRef')}</Label>
            <Controller
              name="secretRef"
              control={control}
              render={({ field }) => <Input {...field} id={secretRefId} className={styles.input} />}
            />
          </div>
        </FormGroup>
      </Form>
    </Dialog>
  );
}
