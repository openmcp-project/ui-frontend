import { Bar, Button, Dialog } from '@ui5/webcomponents-react';
import { FC, useState } from 'react';
import { YamlLoader } from './YamlLoader.tsx';

export type ResourceProps = {
  projectName: string;
  workspaceName: string;
  resourceType: string;
  resourceName: string;
};

export const YamlViewButton: FC<ResourceProps> = ({
  projectName,
  workspaceName,
  resourceType,
  resourceName,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Dialog
        open={isOpen}
        stretch
        footer={
          <Bar
            design="Footer"
            endContent={
              <Button design="Emphasized" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            }
          />
        }
      >
        <YamlLoader
          workspaceName={workspaceName}
          projectName={projectName}
          resourceName={resourceName}
          resourceType={resourceType}
        />
      </Dialog>
      <Button
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Yaml
      </Button>
    </>
  );
};
