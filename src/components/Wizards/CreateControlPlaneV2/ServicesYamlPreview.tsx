import { Tab, TabContainer } from '@ui5/webcomponents-react';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { stringify } from 'yaml';
import {
  buildServiceResource,
  ControlPlaneV2ServiceDef,
  ServiceKey,
} from '../../../spaces/controlPlaneV2/helpers/controlPlaneV2Services.ts';
import { ServiceSelection } from '../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import { buildYamlFilename } from '../../Yaml/buildYamlFilename.ts';
import { YamlBlock } from '../../Yaml/YamlBlock.tsx';
import { IllustratedBanner } from '../../Ui/IllustratedBanner/IllustratedBanner.tsx';
import styles from './ServicesYamlPreview.module.css';

interface ServicesYamlPreviewProps {
  services: ServiceSelection;
  visibleServices: ControlPlaneV2ServiceDef[];
  activeService: ServiceKey;
  resourceName: string;
  resourceNamespace: string;
  onActiveServiceChange: (key: ServiceKey) => void;
}

export function ServicesYamlPreview({
  services,
  visibleServices,
  activeService,
  resourceName,
  resourceNamespace,
  onActiveServiceChange,
}: ServicesYamlPreviewProps) {
  const { t } = useTranslation();
  const activeDef = visibleServices.find((s) => s.key === activeService) ?? visibleServices[0];

  // Always render the current selection as a plain YAML document — no diff against the installed state.
  const yamlString = useMemo(() => {
    if (!activeDef) return '';
    const entry = services[activeDef.key];
    return entry?.selected
      ? stringify(buildServiceResource(activeDef.key, entry, resourceName, resourceNamespace))
      : '';
  }, [activeDef, services, resourceName, resourceNamespace]);

  if (!activeDef) return null;

  const filename = buildYamlFilename(activeDef.kind, resourceName);

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
      <div className={styles.editor} data-testid={`services-yaml-content-${activeDef.key}`}>
        {yamlString ? (
          <YamlBlock value={yamlString} filename={filename} size="fill" />
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
