import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useApiResourceMutation } from '../../lib/api/useApiResource';

import { useAuth } from '../../spaces/onboarding/auth/AuthContext.tsx';
import { Member, MemberRoles } from '../../lib/api/types/shared/members.ts';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { validationSchemaProjectWorkspace } from '../../lib/api/validations/schemas.ts';
import {
  MetadataAndMembersForm,
  OnCreatePayload,
} from '../Dialogs/CreateProjectWorkspaceDialog.tsx';
import {
  Bar,
  Button,
  Dialog,
  Grid,
  List,
  ListItemStandard,
  Wizard,
  WizardStep,
} from '@ui5/webcomponents-react';
import YamlViewer from '../Yaml/YamlViewer.tsx';
import { stringify } from 'yaml';
import { APIError } from '../../lib/api/error.ts';
import {
  CreateManagedControlPlane,
  CreateManagedControlPlaneResource,
  CreateManagedControlPlaneType,
} from '../../lib/api/types/crate/createManagedControlPlane.ts';
import { ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import { useToast } from '../../context/ToastContext.tsx';

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
    reset,
    getValues,
    formState: { errors, isValid },
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
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const resetFormAndClose = () => {
    reset();
    setSelectedStep(1);
    setIsOpen(false);
  };
  console.log(errors);
  // const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedStep, setSelectedStep] = useState(1);
  const username = user?.email;
  const toast = useToast();
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
  const { trigger } = useApiResourceMutation<CreateManagedControlPlaneType>(
    CreateManagedControlPlaneResource(namespace),
  );
  const handleCreateManagedControlPlane = async ({
    name,
    displayName,
    chargingTarget,
    members,
  }: OnCreatePayload): Promise<boolean> => {
    try {
      await trigger(
        CreateManagedControlPlane(name, namespace, {
          displayName: displayName,
          chargingTarget: chargingTarget,
          members: members,
        }),
      );
      // await revalidate();
      setIsOpen(false);
      toast.show('mcp created');
      return true;
    } catch (e) {
      console.error(e);
      if (e instanceof APIError) {
        if (errorDialogRef.current) {
          errorDialogRef.current.showErrorDialog(
            `${e.message}: ${JSON.stringify(e.info)}`,
          );
        }
      }
      return false;
    }
  };

  const onNextClick = () => {
    console.log('test');
    handleSubmit(
      () => {
        console.log('valid');
        setSelectedStep(2);
      },
      () => {
        console.log('not valid');
        console.log(errors);
      },
    )();
  };
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
              <Button design={'Negative'} onClick={resetFormAndClose}>
                Close
              </Button>
              <Button design="Emphasized" onClick={onNextClick}>
                Next
              </Button>
            </div>
          }
        />
      }
      onClose={() => setIsOpen(false)}
    >
      <Wizard contentLayout={'SingleStep'}>
        <WizardStep
          icon={'create-form'}
          titleText="Metadata"
          disabled={false}
          selected={selectedStep === 1}
          data-step={'1'}
          onClick={() => {
            setSelectedStep(1);
          }}
        >
          <MetadataAndMembersForm
            members={watch('members')}
            register={register}
            errors={errors}
            setValue={setValue}
          />
        </WizardStep>
        <WizardStep
          icon={'activities'}
          titleText="Summarize"
          disabled={!isValid}
          selected={selectedStep === 2}
          data-step={'2'}
          onClick={() => {
            setSelectedStep(1);
          }}
        >
          <h1>Summarize</h1>
          <Grid defaultSpan="XL6 L6 M6 S6">
            <div>
              <List headerText={'Metadata'}>
                <ListItemStandard
                  text={'Name:'}
                  additionalText={getValues('name')}
                />
                <ListItemStandard
                  title={'Metadata'}
                  text={'Display name:'}
                  additionalText={getValues('displayName')}
                />
                <ListItemStandard
                  text={'Charging target:'}
                  additionalText={getValues('chargingTarget')}
                />{' '}
                <ListItemStandard text={'Namespace:'} additionalText={''} />{' '}
                <ListItemStandard text={'Region:'} additionalText={''} />
              </List>
              <br />
              <List headerText={'Members'}>
                {getValues('members').map((member) => (
                  <ListItemStandard
                    key={member.name}
                    text={member.name}
                    additionalText={member.kind}
                  />
                ))}
              </List>
            </div>
            <div>
              <YamlViewer
                yamlString={stringify(getValues('members'))}
                filename={'test'}
              />
            </div>
          </Grid>
        </WizardStep>
      </Wizard>
    </Dialog>
  );
};
