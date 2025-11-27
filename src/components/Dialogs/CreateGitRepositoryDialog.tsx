import { Dialog, Bar, Label, Input, Button, Form, FormGroup } from '@ui5/webcomponents-react';
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

  const validationSchema = z.object({
    namespace: z.string().min(1, { message: t('validationErrors.required') }),
    name: z.string().min(1, { message: t('validationErrors.required') }),
    interval: z.string().min(1, { message: t('validationErrors.required') }),
    url: z
      .string()
      .min(1, { message: t('validationErrors.required') })
      .url({ message: t('validationErrors.urlFormat') })
      .startsWith('https://', { message: t('validationErrors.urlFormat') }),
    branch: z.string().min(1, { message: t('validationErrors.required') }),
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
      branch: 'main',
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
            <Label required>{t('CreateGitRepositoryDialog.nameTitle')}</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="name"
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
            <Label required>{t('CreateGitRepositoryDialog.intervalTitle')}</Label>
            <Controller
              name="interval"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="interval"
                  valueState={errors.interval ? 'Negative' : 'None'}
                  valueStateMessage={<span>{errors.interval?.message}</span>}
                  placeholder="1m0s"
                  className={styles.input}
                />
              )}
            />
          </div>

          <div className={styles.formField}>
            <Label required>{t('CreateGitRepositoryDialog.urlTitle')}</Label>
            <Controller
              name="url"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="url"
                  valueState={errors.url ? 'Negative' : 'None'}
                  valueStateMessage={<span>{errors.url?.message}</span>}
                  placeholder="https://github.com/owner/repo"
                  className={styles.input}
                />
              )}
            />
          </div>

          <div className={styles.formField}>
            <Label required>{t('CreateGitRepositoryDialog.branchTitle')}</Label>
            <Controller
              name="branch"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="branch"
                  valueState={errors.branch ? 'Negative' : 'None'}
                  valueStateMessage={<span>{errors.branch?.message}</span>}
                  placeholder="main"
                  className={styles.input}
                />
              )}
            />
          </div>

          <div className={styles.formField}>
            <Label>{t('CreateGitRepositoryDialog.secretRefTitle', 'SecretRef')}</Label>
            <Controller
              name="secretRef"
              control={control}
              render={({ field }) => <Input {...field} id="secretRef" className={styles.input} />}
            />
          </div>
        </FormGroup>
      </Form>
    </Dialog>
  );
}
