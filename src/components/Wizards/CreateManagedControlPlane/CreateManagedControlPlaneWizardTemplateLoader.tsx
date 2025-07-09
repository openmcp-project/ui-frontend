import { FC } from 'react';
import {
  CreateManagedControlPlaneWizardContainer,
  CreateManagedControlPlaneWizardContainerProps,
} from './CreateManagedControlPlaneWizardContainer.tsx';

export const CreateManagedControlPlaneWizardTemplateLoader: FC<
  CreateManagedControlPlaneWizardContainerProps
> = (props) => {
  return <CreateManagedControlPlaneWizardContainer {...props} />;
};
