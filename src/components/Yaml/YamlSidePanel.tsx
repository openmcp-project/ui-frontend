import {
  CheckBox,
  FlexBox,
  Panel,
  Title,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  Button,
} from '@ui5/webcomponents-react';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { useTranslation } from 'react-i18next';
import { YamlViewer } from './YamlViewer.tsx';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { useMemo, useState, useCallback } from 'react';
import { stringify } from 'yaml';
import { convertToResourceConfig } from '../../utils/convertToResourceConfig.ts';
import { removeManagedFieldsAndFilterData, Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import styles from './YamlSidePanel.module.css';
import { IllustratedBanner } from '../Ui/IllustratedBanner/IllustratedBanner.tsx';

export const SHOW_DOWNLOAD_BUTTON = false; // Download button is hidden now due to stakeholder request

export interface YamlSidePanelProps {
  resource: Resource;
  filename: string;
  onApply?: (parsed: unknown, yaml: string) => void | boolean | Promise<void | boolean>; // optional apply handler when in edit mode
}
export function YamlSidePanel({ resource, filename, onApply }: YamlSidePanelProps) {
  const [showOnlyImportantData, setShowOnlyImportantData] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const isEdit = true; // Currently always editing YAML (YamlViewer receives isEdit=true)
  const { closeAside } = useSplitter();
  const { t } = useTranslation();

  const yamlStringToDisplay = useMemo(() => {
    if (isEdit) {
      return stringify(convertToResourceConfig(resource));
    }
    return stringify(removeManagedFieldsAndFilterData(resource, showOnlyImportantData));
  }, [resource, showOnlyImportantData, isEdit]);
  const yamlStringToCopy = useMemo(() => {
    if (isEdit) {
      return stringify(convertToResourceConfig(resource));
    }
    return stringify(removeManagedFieldsAndFilterData(resource, false));
  }, [resource, isEdit]);

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

  const handleApplyWrapper = useCallback(
    async (parsed: unknown, yaml: string) => {
      if (!onApply) return;
      try {
        const result = await onApply(parsed, yaml);
        if (result === true) {
          setIsSuccess(true);
        }
      } catch (_) {
        // onApply handles its own error display (toast/dialog)
      }
    },
    [onApply],
  );

  return (
    <Panel
      className={styles.panel}
      fixed
      header={
        <Toolbar>
          <Title>{t('yaml.panelTitle')}</Title>
          <ToolbarSpacer />
          <FlexBox>
            {!isEdit && (
              <CheckBox
                text={t('yaml.showOnlyImportant')}
                checked={showOnlyImportantData}
                onChange={() => setShowOnlyImportantData(!showOnlyImportantData)}
              />
            )}
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
        {isSuccess ? (
          <FlexBox direction="Column" style={{ gap: '1rem', padding: '1rem', alignItems: 'center' }}>
            <IllustratedBanner
              illustrationName={IllustrationMessageType.SuccessScreen}
              title={t('yaml.applySuccess')}
              subtitle={t('yaml.applySuccess2')}
            />
            <Button design="Emphasized" onClick={closeAside}>
              {t('common.close')}
            </Button>
          </FlexBox>
        ) : (
          <YamlViewer
            yamlString={yamlStringToDisplay}
            filename={filename}
            isEdit={isEdit}
            onApply={handleApplyWrapper}
          />
        )}
      </div>
    </Panel>
  );
}
