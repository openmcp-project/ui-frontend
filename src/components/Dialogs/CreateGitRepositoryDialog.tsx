import { Dialog, Bar, Label, Input, Button, Form, FormGroup } from '@ui5/webcomponents-react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  useCreateGitRepository as defaultUseCreateGitRepository,
  CreateGitRepositoryParams,
} from '../../hooks/useCreateGitRepository';
import { useEffect } from 'react';
import styles from './CreateGitRepositoryDialog.module.css';

interface CreateGitRepositoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  namespace?: string;
  useCreateGitRepository?: typeof defaultUseCreateGitRepository;
}

export function CreateGitRepositoryDialog({
  isOpen,
  onClose,
  namespace = 'default',
  useCreateGitRepository = defaultUseCreateGitRepository,
}: CreateGitRepositoryDialogProps) {
  const { t } = useTranslation();
  const { createGitRepository, isLoading } = useCreateGitRepository(namespace);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGitRepositoryParams>({
    defaultValues: {
      namespace,
      name: '',
      interval: '1m0s',
      url: '',
      branch: 'main',
      secretRef: '',
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset({
        namespace,
        name: '',
        interval: '1m0s',
        url: '',
        branch: 'main',
        secretRef: '',
      });
    }
  }, [isOpen, namespace, reset]);

  const handleClose = () => {
    reset({
      namespace,
      name: '',
      interval: '1m0s',
      url: '',
      branch: 'main',
      secretRef: '',
    });
    onClose();
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
              <Button
                design="Emphasized"
                disabled={isLoading}
                onClick={() => {
                  void handleSubmit(async (data) => {
                    try {
                      await createGitRepository(data);
                      reset({
                        namespace,
                        name: '',
                        interval: '1m0s',
                        url: '',
                        branch: 'main',
                        secretRef: '',
                      });
                      onClose();
                    } catch {
                      // Error handled by hook
                    }
                  })();
                }}
              >
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
            <Label required>{t('common.namespace', 'Namespace')}</Label>
            <Controller
              name="namespace"
              control={control}
              rules={{ required: t('validationErrors.required') }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="namespace"
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
              rules={{ required: t('validationErrors.required') }}
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
              rules={{ required: t('validationErrors.required') }}
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
              rules={{
                required: t('validationErrors.required'),
                validate: (value: string) => {
                  try {
                    const url = new URL(value);
                    return url.protocol === 'https:' || t('validationErrors.urlFormat');
                  } catch {
                    return t('validationErrors.urlFormat');
                  }
                },
              }}
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
              rules={{ required: t('validationErrors.required') }}
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
              render={({ field }) => (
                <Input
                  {...field}
                  id="secretRef"
                  placeholder={t('CreateGitRepositoryDialog.secretRefOptionalTitle')}
                  className={styles.input}
                />
              )}
            />
          </div>
        </FormGroup>
      </Form>
    </Dialog>
  );
}
