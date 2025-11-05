import { Button } from '@ui5/webcomponents-react';
import styles from './YamlViewButton.module.css';
import { useTranslation } from 'react-i18next';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';

import { YamlIcon } from './YamlIcon.tsx';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { YamlSidePanel } from './YamlSidePanel.tsx';
import { YamlSidePanelWithLoader } from './YamlSidePanelWithLoader.tsx';
import { JSX } from 'react';
import { CustomResourceDefinitionName } from './YamlViewerSchemaLoader.tsx';

export interface YamlViewButtonResourceProps {
  variant: 'resource';
  resource: Resource;
  toolbarContent?: JSX.Element;
}
export interface YamlViewButtonLoaderProps {
  variant: 'loader';
  workspaceName?: string;
  resourceType: 'projects' | 'workspaces' | 'managedcontrolplanes';
  resourceName: string;
  customResourceDefinitionName?: CustomResourceDefinitionName;
}
export type YamlViewButtonProps = YamlViewButtonResourceProps | YamlViewButtonLoaderProps;

export function YamlViewButton({ variant, ...props }: YamlViewButtonProps) {
  const { t } = useTranslation();
  const { openInAside } = useSplitter();

  const openSplitterSidePanel = () => {
    switch (variant) {
      case 'resource': {
        const { resource, toolbarContent } = props as YamlViewButtonResourceProps;
        openInAside(
          <YamlSidePanel
            isEdit={true}
            resource={resource}
            filename={`${resource?.kind ?? ''}${resource?.metadata?.name ? '_' : ''}${resource?.metadata?.name ?? ''}`}
            toolbarContent={toolbarContent}
            customResourceDefinitionName={'workspaces.core.openmcp.cloud'}
          />,
        );
        break;
      }

      case 'loader': {
        const { workspaceName, resourceType, resourceName } = props as YamlViewButtonLoaderProps;
        openInAside(
          <YamlSidePanelWithLoader
            isEdit={true}
            workspaceName={workspaceName}
            resourceType={resourceType}
            resourceName={resourceName}
            customResourceDefinitionName={'workspaces.core.openmcp.cloud'}
          />,
        );
        break;
      }
    }
  };

  return (
    <span>
      <Button
        className={styles.button}
        design="Transparent"
        aria-label={t('buttons.viewResource')}
        title={t('buttons.viewResource')}
        onClick={openSplitterSidePanel}
      >
        <YamlIcon />
      </Button>
    </span>
  );
}
