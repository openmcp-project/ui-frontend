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
  withoutApiConfig?: boolean;
}
export interface YamlViewButtonLoaderProps {
  variant: 'loader';
  workspaceName?: string;
  resourceType: 'projects' | 'workspaces' | 'managedcontrolplanes';
  resourceName: string;
  withoutApiConfig?: boolean;
}
export type YamlViewButtonProps = YamlViewButtonResourceProps | YamlViewButtonLoaderProps;

export function YamlViewButton({ variant, ...props }: YamlViewButtonProps) {
  const { t } = useTranslation();
  const { openInAsideWithApiConfig, openInAside } = useSplitter();
  const apiConfig = useContext(ApiConfigContext);
  const openSplitterSidePanel = () => {
    switch (variant) {
      case 'resource': {
        const { resource, toolbarContent, withoutApiConfig } = props as YamlViewButtonResourceProps;
        const content = (
          <YamlSidePanel
            isEdit={false}
            resource={resource}
            filename={`${resource?.kind ?? ''}${resource?.metadata?.name ? '_' : ''}${resource?.metadata?.name ?? ''}`}
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
