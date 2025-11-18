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
  onSuccess?: () => void;
  useCreateGitRepository?: typeof defaultUseCreateGitRepository;
}

export function CreateGitRepositoryDialog({
  isOpen,
  onClose,
  namespace = 'default',
  onSuccess,
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
      name: '',
      interval: '1m0s',
      url: '',
      branch: 'main',
      secretRef: '',
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      headerText={t('flux.createGitRepository', 'Create Git Repository')}
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
                      reset();
                      onClose();
                      onSuccess?.();
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
        <FormGroup headerText={t('flux.metadata', 'Metadata')}>
          <div className={styles.formField}>
            <Label required>{t('flux.name', 'Name')}</Label>
            <Controller
              name="name"
              control={control}
              rules={{ required: t('validation.required', 'This field is required') }}
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

        <FormGroup headerText={t('flux.spec', 'Spec')}>
          <div className={styles.formField}>
            <Label required>{t('flux.interval', 'Interval')}</Label>
            <Controller
              name="interval"
              control={control}
              rules={{ required: t('validation.required', 'This field is required') }}
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
            <Label required>{t('flux.url', 'URL')}</Label>
            <Controller
              name="url"
              control={control}
              rules={{
                required: t('validation.required', 'This field is required'),
                pattern: { value: /^https:\/\/.+/, message: t('validation.urlFormat', 'Must be a valid HTTPS URL') },
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
            <Label required>{t('flux.branch', 'Branch')}</Label>
            <Controller
              name="branch"
              control={control}
              rules={{ required: t('validation.required', 'This field is required') }}
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
            <Label>{t('flux.secretRef', 'SecretRef')}</Label>
            <Controller
              name="secretRef"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="secretRef"
                  placeholder={t('flux.secretRefOptional', 'SecretRef (Optional)')}
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
