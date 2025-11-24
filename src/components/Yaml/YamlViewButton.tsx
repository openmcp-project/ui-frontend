import { Button } from '@ui5/webcomponents-react';
import styles from './YamlViewButton.module.css';
import { useTranslation } from 'react-i18next';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';

import { YamlIcon } from './YamlIcon.tsx';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { YamlSidePanel } from './YamlSidePanel.tsx';
import { YamlSidePanelWithLoader } from './YamlSidePanelWithLoader.tsx';
import { JSX, useContext } from 'react';

import { ApiConfigContext } from '../Shared/k8s';

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
}
export type YamlViewButtonProps = YamlViewButtonResourceProps | YamlViewButtonLoaderProps;

export function YamlViewButton({ variant, ...props }: YamlViewButtonProps) {
  const { t } = useTranslation();
  const { openInAsideWithApiConfig } = useSplitter();
  const apiConfig = useContext(ApiConfigContext);
  const openSplitterSidePanel = () => {
    switch (variant) {
      case 'resource': {
        const { resource, toolbarContent } = props as YamlViewButtonResourceProps;
        openInAsideWithApiConfig(
          <YamlSidePanel
            isEdit={false}
            resource={resource}
            filename={`${resource?.kind ?? ''}${resource?.metadata?.name ? '_' : ''}${resource?.metadata?.name ?? ''}`}
            toolbarContent={toolbarContent}
          />,
          apiConfig,
        );
        break;
      }

      case 'loader': {
        const { workspaceName, resourceType, resourceName } = props as YamlViewButtonLoaderProps;
        openInAsideWithApiConfig(
          <YamlSidePanelWithLoader
            isEdit={false}
            workspaceName={workspaceName}
            resourceType={resourceType}
            resourceName={resourceName}
          />,
          apiConfig,
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
