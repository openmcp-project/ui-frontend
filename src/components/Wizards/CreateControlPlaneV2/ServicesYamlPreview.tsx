import { Button, FlexBox, Tab, TabContainer } from '@ui5/webcomponents-react';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { stringify } from 'yaml';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard.ts';
import {
  buildServiceResource,
  ControlPlaneV2ServiceDef,
  ServiceKey,
} from '../../../spaces/controlPlaneV2/helpers/controlPlaneV2Services.ts';
import { ServiceSelection } from '../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import { buildYamlFilename } from '../../Yaml/buildYamlFilename.ts';
import { YamlViewer } from '../../Yaml/YamlViewer.tsx';
import { YamlDiffEditor } from '../../YamlEditor/YamlDiffEditor.tsx';
import { IllustratedBanner } from '../../Ui/IllustratedBanner/IllustratedBanner.tsx';
import styles from './ServicesYamlPreview.module.css';

interface ServicesYamlPreviewProps {
  services: ServiceSelection;
  visibleServices: ControlPlaneV2ServiceDef[];
  activeService: ServiceKey;
  resourceName: string;
  resourceNamespace: string;
  isEditMode?: boolean;
  /** Edit mode: service selection as it was when the wizard opened; drives the diff baseline. */
  initialServices?: ServiceSelection;
  onActiveServiceChange: (key: ServiceKey) => void;
}

export function ServicesYamlPreview({
  services,
  visibleServices,
  activeService,
  resourceName,
  resourceNamespace,
  isEditMode = false,
  initialServices,
  onActiveServiceChange,
}: ServicesYamlPreviewProps) {
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyToClipboard();
  const activeDef = visibleServices.find((s) => s.key === activeService) ?? visibleServices[0];

  const { yamlString, originalYamlString } = useMemo(() => {
    if (!activeDef) return { yamlString: '', originalYamlString: '' };
    const entry = services[activeDef.key];
    const initialEntry = initialServices?.[activeDef.key];
    return {
      yamlString: entry?.selected
        ? stringify(buildServiceResource(activeDef.key, entry, resourceName, resourceNamespace))
        : '',
      originalYamlString: initialEntry?.selected
        ? stringify(buildServiceResource(activeDef.key, initialEntry, resourceName, resourceNamespace))
        : '',
    };
  }, [activeDef, services, initialServices, resourceName, resourceNamespace]);

  if (!activeDef) return null;

  const filename = buildYamlFilename(activeDef.kind, resourceName);
  const showDiff = isEditMode && (!!yamlString || !!originalYamlString);

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
    <div className={styles.container} data-testid="services-yaml-preview">
      <TabContainer
        collapsed
        className={styles.tabs}
        data-testid="services-yaml-tabs"
        onTabSelect={(e) => {
          const key = e.detail.tab.dataset.serviceKey as ServiceKey | undefined;
          if (key) onActiveServiceChange(key);
        }}
      >
        {visibleServices.map(({ key, labelKey }) => (
          <Tab
            key={key}
            text={t(labelKey)}
            selected={key === activeDef.key}
            data-service-key={key}
            data-testid={`services-yaml-tab-${key}`}
          />
        ))}
      </TabContainer>
      {yamlString && (
        <FlexBox justifyContent="End" gap={8} className={styles.actions}>
          <Button icon="copy" design="Transparent" onClick={() => copyToClipboard(yamlString)}>
            {t('buttons.copy')}
          </Button>
          <Button icon="download" design="Transparent" onClick={downloadYaml}>
            {t('buttons.download')}
          </Button>
        </FlexBox>
      )}
      <div className={styles.editor} data-testid={`services-yaml-content-${activeDef.key}`}>
        {showDiff ? (
          <YamlDiffEditor original={originalYamlString} modified={yamlString} />
        ) : yamlString ? (
          <YamlViewer yamlString={yamlString} filename={filename} height="100%" />
        ) : (
          <IllustratedBanner
            compact
            illustrationName={IllustrationMessageType.NoData}
            title={t('ServiceSelectionStep.yamlPreviewNotSelectedTitle', { service: t(activeDef.labelKey) })}
            subtitle={t('ServiceSelectionStep.yamlPreviewNotSelectedSubtitle')}
          />
        )}
      </div>
    </div>
  );
}
