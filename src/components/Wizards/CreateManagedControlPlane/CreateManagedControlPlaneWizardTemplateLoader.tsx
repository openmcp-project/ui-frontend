import { FC } from 'react';
import {
  CreateManagedControlPlaneWizardContainer,
  CreateManagedControlPlaneWizardContainerProps,
} from './CreateManagedControlPlaneWizardContainer.tsx';
import { managedControlPlaneTemplate } from '../../../lib/api/types/mcp/mcpTemplate.ts';

export const CreateManagedControlPlaneWizardTemplateLoader: FC<
  CreateManagedControlPlaneWizardContainerProps
> = (props) => {
  const template = managedControlPlaneTemplate.items[0];
  return (
    <CreateManagedControlPlaneWizardContainer
      {...props}
      managedControlPlaneTemplate={template}
    />
  );
};
