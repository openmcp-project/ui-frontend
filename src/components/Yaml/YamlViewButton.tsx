import { Button } from '@ui5/webcomponents-react';
import styles from './YamlViewButton.module.css';
import { useTranslation } from 'react-i18next';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';

import { YamlIcon } from './YamlIcon.tsx';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { YamlSidePanel } from './YamlSidePanel.tsx';
import { YamlSidePanelWithLoader } from './YamlSidePanelWithLoader.tsx';

export interface YamlViewButtonResourceProps {
  variant: 'resource';
  resource: Resource;
}
export interface YamlViewButtonLoaderProps {
  variant: 'loader';
  workspaceName?: string;
  resourceType: 'projects' | 'workspaces' | 'managedcontrolplanes';
  resourceName: string;
}
export type YamlViewButtonProps = YamlViewButtonResourceProps | YamlViewButtonLoaderProps;

export function YamlViewButton(props: YamlViewButtonProps) {
  const { t } = useTranslation();
  const { openInAside } = useSplitter();

  const openSplitterSidePanel = () => {
    switch (props.variant) {
      case 'resource': {
        const { resource } = props;
        openInAside(
          <YamlSidePanel
            isEdit={false}
            resource={props.resource}
            filename={`${resource?.kind ?? ''}${resource?.metadata?.name ? '_' : ''}${resource?.metadata?.name ?? ''}`}
          />,
        );
        break;
      }

      case 'loader': {
        const { workspaceName, resourceType, resourceName } = props;
        openInAside(
          <YamlSidePanelWithLoader
            isEdit={false}
            workspaceName={workspaceName}
            resourceType={resourceType}
            resourceName={resourceName}
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
