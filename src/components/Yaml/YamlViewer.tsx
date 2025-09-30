import { FC } from 'react';
import { Button, FlexBox } from '@ui5/webcomponents-react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import { useTranslation } from 'react-i18next';
import { Editor } from '@monaco-editor/react';

import styles from './YamlViewer.module.css';

type YamlViewerProps = { yamlString: string; filename: string };
const YamlViewer: FC<YamlViewerProps> = ({ yamlString, filename }) => {
  const { t } = useTranslation();
  // const { isDarkTheme } = useTheme();
  const { copyToClipboard } = useCopyToClipboard();
  const downloadYaml = () => {
    const blob = new Blob([yamlString], { type: 'text/yaml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.yaml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <FlexBox className={styles.buttons} direction="Row" justifyContent="End" alignItems="Baseline" gap={16}>
        <Button icon="copy" onClick={() => copyToClipboard(yamlString)}>
          {t('buttons.copy')}
        </Button>
        <Button icon="download" onClick={downloadYaml}>
          {t('buttons.download')}
        </Button>
      </FlexBox>
      <Editor height="90vh" defaultLanguage="yaml" defaultValue={yamlString} />
    </div>
  );
};

export default YamlViewer;
