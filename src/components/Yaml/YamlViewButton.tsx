import { Bar, Button, Dialog } from '@ui5/webcomponents-react';
import { FC, useState } from 'react';

import { useTranslation } from 'react-i18next';
import YamlViewer from './YamlViewer.tsx';
import { stringify } from 'yaml';
import {
  removeManagedFieldsProperty,
  Resource,
} from '../../utils/removeManagedFieldsProperty.ts';

export type YamlViewButtonProps = {
  resourceObject: unknown;
};

export const YamlViewButton: FC<YamlViewButtonProps> = ({ resourceObject }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <span>
      <Dialog
        open={isOpen}
        stretch
        footer={
          <Bar
            design="Footer"
            endContent={
              <Button design="Emphasized" onClick={() => setIsOpen(false)}>
                {t('common.close')}
              </Button>
            }
          />
        }
        onClose={() => {
          setIsOpen(false);
        }}
      >
        {isOpen && (
          <YamlViewer
            yamlString={stringify(
              removeManagedFieldsProperty(resourceObject as Resource),
            )}
            filename={`filename_here`}
          />
        )}
      </Dialog>
      <Button
        icon="document"
        aria-label={t('buttons.viewResource')}
        title={t('buttons.viewResource')}
        tooltip={t('buttons.viewResource')}
        onClick={() => {
          setIsOpen(true);
        }}
      />
    </span>
  );
};
