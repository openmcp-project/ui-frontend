import '@ui5/webcomponents-icons/dist/connected.js';
import {
  Bar,
  Button,
  Dialog,
  FlexBox,
  Input,
  Label,
  Link,
  MessageStrip,
  Option,
  Select,
} from '@ui5/webcomponents-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFrontendConfig } from '../../context/FrontendConfigContext.tsx';
import { projectnameToNamespace } from '../../utils/index.ts';
import { useCreateAppInstallation } from '../../spaces/onboarding/hooks/useCreateAppInstallation.ts';
import styles from './ConnectGitHubDialog.module.css';

interface ConnectGitHubDialogProps {
  isOpen: boolean;
  projectName: string;
  onClose: () => void;
}

export function ConnectGitHubDialog({ isOpen, projectName, onClose }: ConnectGitHubDialogProps) {
  const { t } = useTranslation();
  const { githubApps } = useFrontendConfig();
  const { createAppInstallation, isLoading } = useCreateAppInstallation();

  const [selectedInstance, setSelectedInstance] = useState(githubApps[0]?.instanceRefName ?? '');
  const [org, setOrg] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const currentApp = githubApps.find((a) => a.instanceRefName === selectedInstance);
  const projectNamespace = projectnameToNamespace(projectName);

  const handleClose = () => {
    setOrg('');
    setName('');
    setError('');
    setSelectedInstance(githubApps[0]?.instanceRefName ?? '');
    onClose();
  };

  const handleCreate = async () => {
    if (!org.trim()) {
      setError(t('ConnectGitHubDialog.orgRequired'));
      return;
    }
    if (!selectedInstance) {
      setError(t('ConnectGitHubDialog.instanceRequired'));
      return;
    }
    try {
      setError('');
      await createAppInstallation({
        name: name.trim() || `${selectedInstance}-${org.trim()}`,
        namespace: projectNamespace,
        instanceRefName: selectedInstance,
        org: org.trim(),
      });
      handleClose();
    } catch {
      // toast already shown by hook
    }
  };

  if (githubApps.length === 0) {
    return (
      <Dialog open={isOpen} headerText={t('ConnectGitHubDialog.title')} onClose={handleClose}>
        <div className={styles.container}>
          <MessageStrip design="Critical" hideCloseButton>
            {t('ConnectGitHubDialog.noAppsConfigured')}
          </MessageStrip>
        </div>
        <Bar slot="footer" endContent={<Button onClick={handleClose}>{t('buttons.close')}</Button>} />
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} headerText={t('ConnectGitHubDialog.title')} onClose={handleClose}>
      <div className={styles.container}>
        <MessageStrip design="Information" hideCloseButton className={styles.info}>
          {t('ConnectGitHubDialog.intro')}
        </MessageStrip>

        {githubApps.length > 1 && (
          <div className={styles.field}>
            <Label required for="github-instance">
              {t('ConnectGitHubDialog.instanceLabel')}
            </Label>
            <Select
              id="github-instance"
              className={styles.input}
              onChange={(e) => {
                const val = (e.detail.selectedOption as HTMLElement).dataset.value ?? '';
                setSelectedInstance(val);
              }}
            >
              {githubApps.map((app) => (
                <Option
                  key={app.instanceRefName}
                  data-value={app.instanceRefName}
                  selected={selectedInstance === app.instanceRefName}
                >
                  {app.name}
                </Option>
              ))}
            </Select>
          </div>
        )}

        {currentApp && (
          <div className={styles.field}>
            <Label>{t('ConnectGitHubDialog.installStepLabel')}</Label>
            <Link href={currentApp.installationLink} target="_blank">
              {t('ConnectGitHubDialog.installLink', { name: currentApp.name })}
            </Link>
          </div>
        )}

        <div className={styles.field}>
          <Label required for="github-org">
            {t('ConnectGitHubDialog.orgLabel')}
          </Label>
          <Input
            id="github-org"
            className={styles.input}
            placeholder={t('ConnectGitHubDialog.orgPlaceholder')}
            value={org}
            valueState={error && !org.trim() ? 'Negative' : 'None'}
            valueStateMessage={<span>{error}</span>}
            onInput={(e) => setOrg((e.target as unknown as { value: string }).value)}
          />
        </div>

        <div className={styles.field}>
          <Label for="github-name">{t('ConnectGitHubDialog.nameLabel')}</Label>
          <Input
            id="github-name"
            className={styles.input}
            placeholder={`${selectedInstance}-${org.trim() || 'my-org'}`}
            value={name}
            onInput={(e) => setName((e.target as unknown as { value: string }).value)}
          />
        </div>

        {error && (
          <MessageStrip design="Negative" hideCloseButton>
            {error}
          </MessageStrip>
        )}
      </div>

      <Bar
        slot="footer"
        endContent={
          <FlexBox gap={8}>
            <Button onClick={handleClose}>{t('buttons.cancel')}</Button>
            <Button design="Emphasized" disabled={isLoading} onClick={handleCreate}>
              {t('ConnectGitHubDialog.connectButton')}
            </Button>
          </FlexBox>
        }
      />
    </Dialog>
  );
}
