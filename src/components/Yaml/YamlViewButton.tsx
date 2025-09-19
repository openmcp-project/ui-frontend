import { Button } from '@ui5/webcomponents-react';
import { FC, useMemo, useState } from 'react';
import styles from './YamlViewer.module.css';
import { useTranslation } from 'react-i18next';
import YamlViewer from './YamlViewer.tsx';
import { stringify } from 'yaml';
import { removeManagedFieldsProperty, Resource } from '../../utils/removeManagedFieldsProperty.ts';
import { YamlIcon } from './YamlIcon.tsx';
import { YamlViewDialog } from './YamlViewDialog.tsx';
import { useSplitter } from '../../spaces/mcp/pages/SplitterContext.tsx';

export type YamlViewButtonProps = {
  resourceObject: unknown;
};

export const YamlViewButton: FC<YamlViewButtonProps> = ({ resourceObject }) => {
  const [isOpen, setIsOpen] = useState(false);
  const splitter = useSplitter();
  const { t } = useTranslation();
  const resource = resourceObject as Resource;

  const yamlString = useMemo(() => {
    return stringify(removeManagedFieldsProperty(resource));
  }, [resource]);
  return (
    <span>
      <YamlViewDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        dialogContent={
          <YamlViewer
            yamlString={yamlString}
            filename={`${resource?.kind ?? ''}${resource?.metadata?.name ? '_' : ''}${resource?.metadata?.name ?? ''}`}
          />
        }
      />

      <Button
        className={styles.button}
        design={'Transparent'}
        aria-label={t('buttons.viewResource')}
        title={t('buttons.viewResource')}
        onClick={() => {
          //setIsOpen(true);
          splitter.open(
            <YamlViewer
              yamlString={yamlString}
              filename={`${resource?.kind ?? ''}${resource?.metadata?.name ? '_' : ''}${resource?.metadata?.name ?? ''}`}
            />,
          );
        }}
      >
        <YamlIcon />
      </Button>
    </span>
  );
};
