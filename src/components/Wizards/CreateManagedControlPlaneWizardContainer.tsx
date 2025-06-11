import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApiResourceMutation } from '../../lib/api/useApiResource';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { useAuth } from '../../spaces/onboarding/auth/AuthContext.tsx';
import { Member, MemberRoles } from '../../lib/api/types/shared/members.ts';
import type { WizardStepChangeEventDetail } from '@ui5/webcomponents-fiori/dist/Wizard.js';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { validationSchemaProjectWorkspace } from '../../lib/api/validations/schemas.ts';
import { OnCreatePayload } from '../Dialogs/CreateProjectWorkspaceDialog.tsx';
import {
  Bar,
  Button,
  Dialog,
  Form,
  FormGroup,
  Grid,
  List,
  ListItemStandard,
  Ui5CustomEvent,
  Wizard,
  WizardDomRef,
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
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';

import { EditMembers } from '../Members/EditMembers.tsx';
import { useTranslation } from 'react-i18next';
import { MetadataForm } from '../Dialogs/MetadataForm.tsx';
import { IllustratedBanner } from '../Ui/IllustratedBanner/IllustratedBanner.tsx';

export type CreateDialogProps = {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  members: Member[];
};

type CreateManagedControlPlaneWizardContainerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  projectName?: string;
  workspaceName?: string;
};

type WizardStep = 'metadata' | 'members' | 'summarize' | 'success';

export const CreateManagedControlPlaneWizardContainer: FC<
  CreateManagedControlPlaneWizardContainerProps
> = ({ isOpen, setIsOpen, projectName = '', workspaceName = '' }) => {
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
  const { t } = useTranslation();
  const nextBtText = useMemo(
    () => ({
      metadata: t('buttons.next'),
      members: t('buttons.next'),
      summarize: t('buttons.create'),
      success: t('buttons.close'),
    }),
    [],
  );
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const resetFormAndClose = () => {
    reset();
    setSelectedStep('metadata');
    setIsOpen(false);
  };
  console.log(errors);
  // const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedStep, setSelectedStep] = useState<WizardStep>('metadata');
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
  const { trigger } = useApiResourceMutation<CreateManagedControlPlaneType>(
    CreateManagedControlPlaneResource(projectName, workspaceName),
  );

  const handleCreateManagedControlPlane = async ({
    name,
    displayName,
    chargingTarget,
    members,
  }: OnCreatePayload): Promise<boolean> => {
    try {
      await trigger(
        CreateManagedControlPlane(name, `${projectName}--ws-${workspaceName}`, {
          displayName: displayName,
          chargingTarget: chargingTarget,
          members: members,
        }),
      );

      setSelectedStep('success');
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
  const handleStepChange = (
    e: Ui5CustomEvent<WizardDomRef, WizardStepChangeEventDetail>,
  ) => {
    setSelectedStep((e.detail.step.dataset.step ?? '') as WizardStep);
  };
  const onNextClick = () => {
    if (selectedStep === 'metadata') {
      handleSubmit(
        () => {
          setSelectedStep('members');
        },
        () => {
          console.log(errors);
        },
      )();
    }
    if (selectedStep === 'members') {
      setSelectedStep('summarize');
    }
    if (selectedStep === 'summarize') {
      handleCreateManagedControlPlane(getValues());
    }
    if (selectedStep === 'success') {
      setIsOpen(false);
      clearForm();
      setSelectedStep('metadata');
    }
  };
  const setMembers = (members: Member[]) => {
    setValue('members', members);
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
              {selectedStep !== 'success' && (
                <Button design={'Negative'} onClick={resetFormAndClose}>
                  {t('buttons.close')}
                </Button>
              )}
              <Button design="Emphasized" onClick={onNextClick}>
                {nextBtText[selectedStep]}
              </Button>
            </div>
          }
        />
      }
      onClose={() => setIsOpen(false)}
    >
      <Wizard contentLayout={'SingleStep'} onStepChange={handleStepChange}>
        <WizardStep
          icon={'create-form'}
          titleText={t('common.metadata')}
          disabled={false}
          selected={selectedStep === 'metadata'}
          data-step={'metadata'}
        >
          <MetadataForm register={register} errors={errors} />
        </WizardStep>
        <WizardStep
          titleText={t('common.members')}
          selected={selectedStep === 'members'}
          data-step={'members'}
          disabled={selectedStep === 'metadata' || !isValid}
        >
          <Form>
            <FormGroup
              headerText={t('CreateProjectWorkspaceDialog.membersHeader')}
            >
              <EditMembers
                members={watch('members')}
                isValidationError={!!errors.members}
                onMemberChanged={setMembers}
              />
            </FormGroup>
          </Form>
        </WizardStep>
        <WizardStep
          icon={'activities'}
          titleText={t('common.summarize')}
          disabled={
            selectedStep === 'metadata' ||
            selectedStep === 'members' ||
            !isValid
          }
          selected={selectedStep === 'summarize'}
          data-step={'summarize'}
        >
          <h1>{t('common.summarize')}</h1>
          <Grid defaultSpan="XL6 L6 M6 S6">
            <div>
              <List headerText={t('common.members')}>
                <ListItemStandard
                  text={'Name:'}
                  additionalText={getValues('name')}
                />
                <ListItemStandard
                  title={t('common.metadata')}
                  text={'Display name:'}
                  additionalText={getValues('displayName')}
                />
                <ListItemStandard
                  text={t('CreateProjectWorkspaceDialog.chargingTargetLabel')}
                  additionalText={getValues('chargingTarget')}
                />
                <ListItemStandard
                  text={t('common.namespace')}
                  additionalText={''}
                />
                <ListItemStandard
                  text={t('common.region')}
                  additionalText={''}
                />
              </List>
              <br />
              <List headerText={t('common.members')}>
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
                yamlString={stringify(
                  CreateManagedControlPlane(
                    getValues('name'),
                    `${projectName}--ws-${workspaceName}`,
                    {
                      displayName: getValues('displayName'),
                      chargingTarget: getValues('chargingTarget'),
                      members: getValues('members'),
                    },
                  ),
                )}
                filename={`mcp_${projectName}--ws-${workspaceName}`}
              />
            </div>
          </Grid>
        </WizardStep>
        <WizardStep
          icon={'activities'}
          titleText={t('common.success')}
          disabled={selectedStep !== 'success' || !isValid}
          selected={selectedStep === 'success'}
          data-step={'success'}
        >
          <IllustratedBanner
            illustrationName={IllustrationMessageType.SuccessScreen}
            title={t('createMCP.titleText')}
            subtitle={t('createMCP.subtitleText')}
          />
        </WizardStep>
      </Wizard>
      <ErrorDialog ref={errorDialogRef} />
    </Dialog>
  );
};
