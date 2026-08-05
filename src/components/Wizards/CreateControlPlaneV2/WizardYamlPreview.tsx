import { FC } from 'react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard.ts';
import { YamlViewer } from '../../Yaml/YamlViewer.tsx';
import styles from './WizardYamlPreview.module.css';
import '@ui5/webcomponents-icons/dist/copy';
import { Button, FlexBox } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';

interface WizardYamlPreviewProps {
  yamlString: string;
  filename: string;
}

export const WizardYamlPreview: FC<WizardYamlPreviewProps> = ({ yamlString, filename }) => {
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyToClipboard();

  return (
    <FlexBox direction="Column" gap={8} className={styles.container}>
      <FlexBox justifyContent="End">
        <Button icon="copy" design="Transparent" onClick={() => copyToClipboard(yamlString)}>
          {t('buttons.copy')}
        </Button>
      </FlexBox>
      <div className={styles.viewer}>
        <YamlViewer yamlString={yamlString} filename={filename} height="100%" />
      </div>
    </FlexBox>
  );
};
