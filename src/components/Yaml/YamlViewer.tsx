import { FC } from 'react';
import { Button, FlexBox } from '@ui5/webcomponents-react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import { useTranslation } from 'react-i18next';
import { YamlEditor } from '../YamlEditor/YamlEditor';

import styles from './YamlViewer.module.css';

type YamlViewerProps = {
  yamlString: string;
  yamlStringToCopy?: string;
  filename: string;
  showOnlyImportantData?: boolean;
  setShowOnlyImportantData?: (showOnlyImportantData: boolean) => void;
};

// Download button is hidden now due to stakeholder request
const SHOW_DOWNLOAD_BUTTON = false;

export const YamlViewer: FC<YamlViewerProps> = ({ yamlString, filename, yamlStringToCopy }) => {
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
  console.log(yamlString);
  return (
    <div className={styles.container}>
      <FlexBox className={styles.buttons} direction="Row" justifyContent="End" alignItems="Baseline" gap={16}>
        <Button icon="copy" onClick={() => copyToClipboard(yamlStringToCopy ?? yamlString)}>
          {t('buttons.copy')}
        </Button>
        {SHOW_DOWNLOAD_BUTTON && (
          <Button icon="download" onClick={downloadYaml}>
            {t('buttons.download')}
          </Button>
        )}
      </FlexBox>

      {/* Use controlled value with a stable model path to update content without remounting */}
      <YamlEditor height="90vh" value={yamlString} path={`${filename}.yaml`} options={{ readOnly: true }} />
    </div>
  );
};
