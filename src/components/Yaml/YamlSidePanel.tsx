import {
  CheckBox,
  FlexBox,
  Panel,
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  Button,
  Title,
} from '@ui5/webcomponents-react';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { useTranslation } from 'react-i18next';
import { YamlResourceEditorSchemaLoader } from './YamlResourceEditorSchemaLoader.tsx';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { useMemo, useState, useCallback, JSX } from 'react';
import { stringify } from 'yaml';
import { convertToResourceConfig } from '../../utils/convertToResourceConfig.ts';
import { removeManagedFieldsAndFilterData, Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { parseResourceApiInfo } from '../../utils/parseResourceApiInfo.ts';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import styles from './YamlSidePanel.module.css';
import { IllustratedBanner } from '../Ui/IllustratedBanner/IllustratedBanner.tsx';
import { YamlDiff } from '../Wizards/CreateManagedControlPlane/YamlDiff.tsx';

export interface YamlSidePanelProps {
  resource: Resource;
  filename: string;
  onApply?: (parsed: unknown, yaml: string) => void | boolean | Promise<void | boolean>;
  isEdit?: boolean;
  toolbarContent?: JSX.Element;
}

export function YamlSidePanel({ resource, filename, onApply, isEdit, toolbarContent }: YamlSidePanelProps) {
  const [showOnlyImportantData, setShowOnlyImportantData] = useState(true);
  const [mode, setMode] = useState<'edit' | 'review' | 'success'>('edit');
  const [editedYaml, setEditedYaml] = useState<string | null>(null);
  const [parsedObject, setParsedObject] = useState<unknown>(null);

  const { closeAside } = useSplitter();
  const { t } = useTranslation();

  const originalYaml = useMemo(
    () =>
      isEdit
        ? stringify(convertToResourceConfig(resource))
        : stringify(removeManagedFieldsAndFilterData(resource, showOnlyImportantData)),
    [isEdit, resource, showOnlyImportantData],
  );
  const yamlStringToDisplay = useMemo(() => editedYaml ?? originalYaml, [editedYaml, originalYaml]);
  const { copyToClipboard } = useCopyToClipboard();

  const handleDownloadClick = () => {
    const blob = new Blob([originalYaml], { type: 'text/yaml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.yaml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleApplyFromEditor = useCallback(async (parsed: unknown, yaml: string) => {
    setParsedObject(parsed);
    setEditedYaml(yaml);
    setMode('review');
  }, []);

  const handleConfirmPatch = useCallback(async () => {
    if (!onApply || !editedYaml) return;

    const result = await onApply(parsedObject, editedYaml);
    if (result === true) {
      setMode('success');
    }
  }, [onApply, editedYaml, parsedObject]);

  const handleGoBack = () => setMode('edit');

  const { apiGroupName, apiVersion, kind } = parseResourceApiInfo(resource);

  return (
    <div className={styles.panelWrapper}>
      <Panel
        className={styles.panel}
        fixed
        header={
          <Toolbar>
            {toolbarContent}
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
              overflowPriority="NeverOverflow"
              design="Transparent"
              icon="decline"
              data-testid="yaml-close-button"
              onClick={closeAside}
            />
          </Toolbar>
        }
      >
        <div className={styles.content}>
          {mode === 'success' && (
            <FlexBox direction="Column" className={styles.successContainer}>
              <IllustratedBanner
                illustrationName={IllustrationMessageType.SuccessScreen}
                title={t('yaml.applySuccess')}
                subtitle={t('yaml.applySuccess2')}
              />
              <Button design="Emphasized" data-testid="yaml-success-close-button" onClick={closeAside}>
                {t('common.close')}
              </Button>
            </FlexBox>
          )}
          {mode === 'review' && (
            <FlexBox direction="Column" className={styles.reviewContainer}>
              <div className={styles.stickyHeader}>
                <div className={styles.stickyHeaderInner}>
                  <Title level="H5">{t('yaml.diffConfirmTitle')}</Title>
                  <p className={styles.diffConfirmMessage}>{t('yaml.diffConfirmMessage')}</p>
                </div>
                <FlexBox className={styles.reviewButtons}>
                  <Button design="Transparent" data-testid="yaml-cancel-confirmation-button" onClick={handleGoBack}>
                    {t('yaml.diffNo')}
                  </Button>
                  <Button design="Emphasized" data-testid="yaml-confirm-button" onClick={handleConfirmPatch}>
                    {t('yaml.diffYes', 'Yes')}
                  </Button>
                </FlexBox>
              </div>
              <div>
                <YamlDiff originalYaml={originalYaml} modifiedYaml={editedYaml ?? originalYaml} />
              </div>
            </FlexBox>
          )}
          {mode === 'edit' && (
            <YamlResourceEditorSchemaLoader
              yamlString={yamlStringToDisplay}
              filename={filename}
              isEdit={isEdit}
              apiGroupName={apiGroupName}
              apiVersion={apiVersion}
              kind={kind}
              onApply={handleApplyFromEditor}
            />
          )}
        </div>
      </Panel>
      <div className={styles.floatingActions}>
        <ToolbarButton
          design="Transparent"
          icon="copy"
          tooltip={t('buttons.copy')}
          data-testid="yaml-copy-button"
          onClick={() => copyToClipboard(yamlStringToDisplay)}
        />
        <ToolbarButton
          design="Transparent"
          icon="download"
          tooltip={t('buttons.download')}
          data-testid="yaml-download-button"
          onClick={handleDownloadClick}
        />
      </div>
    </div>
  );
}
