import {
  CheckBox,
  FlexBox,
  Panel,
  Title,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
} from '@ui5/webcomponents-react';

import { useTranslation } from 'react-i18next';
import { YamlViewer } from './YamlViewer.tsx';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { useMemo, useState } from 'react';
import { stringify } from 'yaml';
import { removeManagedFieldsAndFilterData, Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import styles from './YamlSidePanel.module.css';

export const SHOW_DOWNLOAD_BUTTON = false; // Download button is hidden now due to stakeholder request

export interface YamlSidePanelProps {
  resource: Resource;
  filename: string;
}
export function YamlSidePanel({ resource, filename }: YamlSidePanelProps) {
  const [showOnlyImportantData, setShowOnlyImportantData] = useState(false);
  const { closeAside } = useSplitter();
  const { t } = useTranslation();

  const yamlStringToDisplay = useMemo(() => {
    return stringify(removeManagedFieldsAndFilterData(resource, showOnlyImportantData));
  }, [resource, showOnlyImportantData]);
  const yamlStringToCopy = useMemo(() => {
    return stringify(removeManagedFieldsAndFilterData(resource, false));
  }, [resource]);

  const { copyToClipboard } = useCopyToClipboard();
  const handleDownloadClick = () => {
    const blob = new Blob([yamlStringToCopy], { type: 'text/yaml' });
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
    <Panel
      className={styles.panel}
      fixed
      header={
        <Toolbar>
          <Title>YAML</Title>
          <ToolbarSpacer />
          <FlexBox>
            <CheckBox
              text={t('yaml.showOnlyImportant')}
              checked={showOnlyImportantData}
              onChange={() => setShowOnlyImportantData(!showOnlyImportantData)}
            />
          </FlexBox>
          <ToolbarButton
            design="Transparent"
            icon="copy"
            text={t('buttons.copy')}
            onClick={() => copyToClipboard(yamlStringToCopy)}
          />
          {SHOW_DOWNLOAD_BUTTON ? (
            <ToolbarButton
              design="Transparent"
              icon="download"
              text={t('buttons.download')}
              onClick={handleDownloadClick}
            />
          ) : null}
          <ToolbarSeparator />
          <ToolbarButton
            overflowPriority="NeverOverflow"
            design="Transparent"
            icon="sap-icon://navigation-right-arrow"
            onClick={closeAside}
          />
        </Toolbar>
      }
    >
      <div className={styles.content}>
        <YamlViewer yamlString={yamlStringToDisplay} />
      </div>
    </Panel>
  );
}
