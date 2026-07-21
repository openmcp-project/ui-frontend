import { Button } from '@ui5/webcomponents-react';
import styles from './YamlViewButton.module.css';
import { useTranslation } from 'react-i18next';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';

import { buildYamlFilename } from './buildYamlFilename.ts';
import { YamlIcon } from './YamlIcon.tsx';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { YamlSidePanel } from './YamlSidePanel.tsx';
import { YamlSidePanelWithLoader } from './YamlSidePanelWithLoader.tsx';
import { YamlSidePanelWithGraphqlLoader } from './YamlSidePanelWithGraphqlLoader.tsx';
import { JSX, useContext } from 'react';

import { ApiConfigContext } from '../Shared/k8s';
import { ResourceType } from '../../lib/api/types/crate/resourceObject.ts';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';

export type McpComponentKind = 'crossplane' | 'flux' | 'landscaper' | 'eso';

export interface YamlViewButtonResourceProps {
  variant: 'resource';
  resource: Resource;
  toolbarContent?: JSX.Element;
  withoutApiConfig?: boolean;
}
export interface YamlViewButtonLoaderProps {
  variant: 'loader';
  workspaceName?: string;
  resourceType: ResourceType;
  resourceName: string;
  withoutApiConfig?: boolean;
}
export interface YamlViewButtonMcpComponentProps {
  variant: 'mcp-component';
  component: McpComponentKind;
  mcpName: string;
  mcpNamespace: string;
  withoutApiConfig?: boolean;
  // When set, the panel renders this data directly instead of fetching it on click.
  preloadedResource?: Resource | null;
}
export type YamlViewButtonProps =
  YamlViewButtonResourceProps | YamlViewButtonLoaderProps | YamlViewButtonMcpComponentProps;

export function YamlViewButton({ variant, ...props }: YamlViewButtonProps) {
  const { t } = useTranslation();
  const { openInAsideWithApiConfig, openInAside } = useSplitter();
  const apiConfig = useContext(ApiConfigContext);
  const telemetry = useTelemetry();
  const openSplitterSidePanel = () => {
    const resourceType =
      variant === 'loader'
        ? (props as YamlViewButtonLoaderProps).resourceType
        : variant === 'mcp-component'
          ? (props as YamlViewButtonMcpComponentProps).component
          : 'resource';
    telemetry.track({ name: 'yaml.viewed', resourceType: String(resourceType) });
    switch (variant) {
      case 'resource': {
        const { resource, toolbarContent, withoutApiConfig } = props as YamlViewButtonResourceProps;
        const content = (
          <YamlSidePanel
            isEdit={false}
            resource={resource}
            filename={buildYamlFilename(resource?.kind, resource?.metadata?.name)}
            toolbarContent={toolbarContent}
          />
        );
        if (withoutApiConfig) {
          openInAside(content);
        } else {
          openInAsideWithApiConfig(content, apiConfig);
        }
        break;
      }

      case 'loader': {
        const { workspaceName, resourceType, resourceName, withoutApiConfig } = props as YamlViewButtonLoaderProps;
        const content = (
          <YamlSidePanelWithLoader
            isEdit={false}
            workspaceName={workspaceName}
            resourceType={resourceType}
            resourceName={resourceName}
          />
        );
        if (withoutApiConfig) {
          openInAside(content);
        } else {
          openInAsideWithApiConfig(content, apiConfig);
        }
        break;
      }

      case 'mcp-component': {
        const { component, mcpName, mcpNamespace, withoutApiConfig, preloadedResource } =
          props as YamlViewButtonMcpComponentProps;
        const content = preloadedResource ? (
          <YamlSidePanel
            isEdit={false}
            resource={preloadedResource}
            filename={buildYamlFilename(
              preloadedResource.kind ?? component,
              preloadedResource.metadata?.name ?? mcpName,
            )}
          />
        ) : (
          <YamlSidePanelWithGraphqlLoader component={component} mcpName={mcpName} mcpNamespace={mcpNamespace} />
        );
        if (withoutApiConfig) {
          openInAside(content);
        } else {
          openInAsideWithApiConfig(content, apiConfig);
        }
        break;
      }
    }
  };

  return (
    <span>
      <Button
        className={styles.button}
        design={'Transparent'}
        aria-label={t('buttons.viewResource')}
        title={t('buttons.viewResource')}
        onClick={openSplitterSidePanel}
      >
        <YamlIcon />
      </Button>
    </span>
  );
}
