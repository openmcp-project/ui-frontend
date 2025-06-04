import { FC, useCallback, useEffect, useRef } from 'react';
import {
  useApiResourceMutation,
  useRevalidateApiResource,
} from '../../lib/api/useApiResource';
import { ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import { APIError } from '../../lib/api/error';

import {
  CreateWorkspace,
  CreateWorkspaceResource,
  CreateWorkspaceType,
} from '../../lib/api/types/crate/createWorkspace';
import { projectnameToNamespace } from '../../utils';
import { ListWorkspaces } from '../../lib/api/types/crate/listWorkspaces';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuth } from '../../spaces/onboarding/auth/AuthContext.tsx';
import { Member, MemberRoles } from '../../lib/api/types/shared/members.ts';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { validationSchemaProjectWorkspace } from '../../lib/api/validations/schemas.ts';
import {
  CreateProjectWorkspaceDialog,
  OnCreatePayload,
} from '../Dialogs/CreateProjectWorkspaceDialog.tsx';
import { Bar, Button, Dialog } from '@ui5/webcomponents-react';
import { KubectlInfoButton } from '../Dialogs/KubectlCommandInfo/KubectlInfoButton.tsx';

export type CreateDialogProps = {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  members: Member[];
};

type CreateManagedControlPlaneWizardContainerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  project?: string;
};

export const CreateManagedControlPlaneWizardContainer: FC<
  CreateManagedControlPlaneWizardContainerProps
> = ({ isOpen, setIsOpen, project = '' }) => {
  const {
    register,
    handleSubmit,
    resetField,
    setValue,
    formState: { errors },
    watch,
  } = useForm<CreateDialogProps>({
    resolver: zodResolver(validationSchemaProjectWorkspace),
    defaultValues: {
      name: '',
      displayName: '',
      chargingTarget: '',
      members: [],
    },
  });
  const { t } = useTranslation();
  const { user } = useAuth();

  const username = user?.email;

  const clearForm = useCallback(() => {
    resetField('name');
    resetField('chargingTarget');
    resetField('displayName');
  }, [resetField]);

  useEffect(() => {
    if (username) {
      setValue('members', [
        { name: username, roles: [MemberRoles.admin], kind: 'User' },
      ]);
    }
    if (!isOpen) {
      clearForm();
    }
  }, [resetField, setValue, username, isOpen, clearForm]);
  const namespace = projectnameToNamespace(project);
  const toast = useToast();

  const { trigger } = useApiResourceMutation<CreateWorkspaceType>(
    CreateWorkspaceResource(namespace),
  );
  const revalidate = useRevalidateApiResource(ListWorkspaces(project));
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  return (
    <Dialog
      stretch={true}
      headerText={'Create Managed Control Plane'}
      open={isOpen}
      initialFocus="project-name-input"
      footer={
        <Bar
          design="Footer"
          endContent={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button design="Emphasized" onClick={() => {}}>
                {t('CreateProjectWorkspaceDialog.createButton')}
              </Button>
            </div>
          }
        />
      }
      onClose={() => setIsOpen(false)}
    ></Dialog>
  );
};
