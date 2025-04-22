import { Bar, Button, Dialog } from '@ui5/webcomponents-react';
import { FC, useState } from 'react';
import { YamlLoader } from './YamlLoader.tsx';
import { useTranslation } from 'react-i18next';

export type ResourceProps = {
  workspaceName?: string;
  resourceType: 'projects' | 'workspaces' | 'managedcontrolplanes';
  resourceName: string;
};

export const YamlViewButton: FC<ResourceProps> = ({
  workspaceName,
  resourceType,
  resourceName,
}) => {
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
      >
        <YamlLoader
          workspaceName={workspaceName}
          resourceName={resourceName}
          resourceType={resourceType}
        />
      </Dialog>
      <Button
        icon="document"
        aria-label={t('buttons.viewResource')}
        title={t('buttons.viewResource')}
        onClick={() => {
          setIsOpen(true);
        }}
      />
    </span>
  );
};
