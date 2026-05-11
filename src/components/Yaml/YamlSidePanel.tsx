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
import { useAnalyticsOptional } from '../../lib/analytics';

export const SHOW_DOWNLOAD_BUTTON = false; // Download button is hidden now due to stakeholder request

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
  const analytics = useAnalyticsOptional();

  const originalYaml = useMemo(
    () =>
      isEdit
        ? stringify(convertToResourceConfig(resource))
        : stringify(removeManagedFieldsAndFilterData(resource, showOnlyImportantData)),
    [isEdit, resource, showOnlyImportantData],
  );
  const yamlStringToDisplay = useMemo(() => editedYaml ?? originalYaml, [editedYaml, originalYaml]);
  const yamlStringToCopy = useMemo(() => originalYaml, [originalYaml]);
  const { copyToClipboard } = useCopyToClipboard();

  const handleDownloadClick = () => {
    analytics?.trackEvent('YAML Downloaded', {
      resourceKind: resource.kind,
      resourceApiVersion: resource.apiVersion,
      isEdit,
      filename,
    });

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

  const handleApplyFromEditor = useCallback(
    async (parsed: unknown, yaml: string) => {
      analytics?.trackEvent('YAML Editor Apply Clicked', {
        resourceKind: resource.kind,
        resourceApiVersion: resource.apiVersion,
        hasChanges: yaml !== originalYaml,
      });

      setParsedObject(parsed);
      setEditedYaml(yaml);
      setMode('review');
    },
    [analytics, resource.kind, resource.apiVersion, originalYaml],
  );

  const handleConfirmPatch = useCallback(async () => {
    if (!onApply || !editedYaml) return;

    analytics?.trackEvent('YAML Patch Confirmed', {
      resourceKind: resource.kind,
      resourceApiVersion: resource.apiVersion,
    });

    const result = await onApply(parsedObject, editedYaml);
    if (result === true) {
      setMode('success');
      analytics?.trackEvent('YAML Patch Applied Successfully', {
        resourceKind: resource.kind,
        resourceApiVersion: resource.apiVersion,
      });
    }
  }, [onApply, editedYaml, parsedObject, analytics, resource.kind, resource.apiVersion]);

  const handleGoBack = () => {
    analytics?.trackEvent('YAML Patch Cancelled', {
      resourceKind: resource.kind,
      resourceApiVersion: resource.apiVersion,
    });
    setMode('edit');
  };

  const { apiGroupName, apiVersion, kind } = parseResourceApiInfo(resource);

  return (
    <Panel
      className={styles.panel}
      fixed
      header={
        <Toolbar>
          {toolbarContent ?? <Title>{t('yaml.panelTitle')}</Title>}
          <ToolbarSpacer />
          <FlexBox>
            {!isEdit && (
              <CheckBox
                text={t('yaml.showOnlyImportant')}
                checked={showOnlyImportantData}
                onChange={() => {
                  const newValue = !showOnlyImportantData;
                  analytics?.trackEvent('YAML Filter Toggled', {
                    resourceKind: resource.kind,
                    showOnlyImportant: newValue,
                  });
                  setShowOnlyImportantData(newValue);
                }}
              />
            )}
          </FlexBox>
          <ToolbarButton
            design="Transparent"
            icon="copy"
            text={t('buttons.copy')}
            onClick={() => {
              analytics?.trackEvent('YAML Copied', {
                resourceKind: resource.kind,
                resourceApiVersion: resource.apiVersion,
                isEdit,
                showOnlyImportantData,
              });
              copyToClipboard(yamlStringToDisplay);
            }}
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
            data-testid="yaml-close-button"
            onClick={() => {
              analytics?.trackEvent('YAML Panel Closed', {
                resourceKind: resource.kind,
                mode,
                isEdit,
              });
              closeAside();
            }}
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
            <Button
              design="Emphasized"
              data-testid="yaml-success-close-button"
              onClick={() => {
                analytics?.trackEvent('YAML Success Panel Closed', {
                  resourceKind: resource.kind,
                });
                closeAside();
              }}
            >
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
  );
}
