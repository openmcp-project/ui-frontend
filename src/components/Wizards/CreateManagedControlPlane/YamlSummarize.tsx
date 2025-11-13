import { FC } from 'react';
import { Button, FlexBox } from '@ui5/webcomponents-react';
import styles from './YamlSummarize.module.css';
import { useTranslation } from 'react-i18next';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard.ts';
import { SHOW_DOWNLOAD_BUTTON } from '../../Yaml/YamlSidePanel.tsx';
import { YamlViewerSchemaLoader } from '../../Yaml/YamlViewerSchemaLoader.tsx';

type YamlPanelProps = {
  yamlString: string;
  filename: string;
  apiGroupName: string;
  apiVersion: string;
};

const YamlSummarize: FC<YamlPanelProps> = ({ yamlString, filename, apiVersion, apiGroupName }) => {
  const { t } = useTranslation();
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
        {SHOW_DOWNLOAD_BUTTON && (
          <Button icon="download" onClick={downloadYaml}>
            {t('buttons.download')}
          </Button>
        )}
      </FlexBox>
      <YamlViewerSchemaLoader
        apiGroupName={apiGroupName}
        apiVersion={apiVersion}
        yamlString={yamlString}
        filename={filename}
        isEdit={false}
      />
    </div>
  );
};

export default YamlSummarize;
