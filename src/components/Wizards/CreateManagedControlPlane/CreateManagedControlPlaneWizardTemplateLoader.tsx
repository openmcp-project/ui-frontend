import { FC } from 'react';
import {
  CreateManagedControlPlaneWizardContainer,
  CreateManagedControlPlaneWizardContainerProps,
} from './CreateManagedControlPlaneWizardContainer.tsx';
import useApiResource from '../../../lib/api/useApiResource.ts';
import { GetMCPTemplate } from '../../../lib/api/types/crate/getMCPTemplate.ts';

export const CreateManagedControlPlaneWizardTemplateLoader: FC<CreateManagedControlPlaneWizardContainerProps> = (
  props,
) => {
  const { data, error, isLoading } = useApiResource(GetMCPTemplate());

  console.log(data);

  const template = data;
  return <CreateManagedControlPlaneWizardContainer {...props} managedControlPlaneTemplate={template} />;
};
