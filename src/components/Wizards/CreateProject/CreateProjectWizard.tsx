import { useState, useMemo, FormEvent } from 'react';
import { Dialog, FlexBox, Button, Bar, FormGroup, Wizard, WizardStep } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import * as yaml from 'js-yaml';
import { Member } from '../../../lib/api/types/shared/members';
import { CreateDialogProps } from '../../Dialogs/CreateWorkspaceDialogContainer';
import { MetadataForm } from '../../Dialogs/MetadataForm';
import { EditMembers } from '../../Members/EditMembers';
import { YamlResourceEditorSchemaLoader } from '../../Yaml/YamlResourceEditorSchemaLoader';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import styles from './CreateProjectWizard.module.css';

export interface CreateProjectWizardProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onCreate: (e?: FormEvent<HTMLFormElement> | undefined) => void;
  members: Member[];
  register: UseFormRegister<CreateDialogProps>;
  errors: FieldErrors<CreateDialogProps>;
  setValue: UseFormSetValue<CreateDialogProps>;
  watch: UseFormWatch<CreateDialogProps>;
}

export function CreateProjectWizard({
  isOpen,
  setIsOpen,
  onCreate,
  members,
  register,
  errors,
  setValue,
  watch,
}: CreateProjectWizardProps) {
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyToClipboard();
  const [currentStep, setCurrentStep] = useState<number>(1);

  const name = watch('name') || '';
  const displayName = watch('displayName') || '';
  const chargingTarget = watch('chargingTarget') || '';
  const chargingTargetType = watch('chargingTargetType') || '';

  // Generate YAML based on current form values
  const yamlString = useMemo(() => {
    const projectObj: any = {
      apiVersion: 'core.openmcp.cloud/v1alpha1',
      kind: 'Project',
      metadata: {
        name: name || '<name>',
      },
      spec: {},
    };

    if (displayName) {
      if (!projectObj.metadata.annotations) projectObj.metadata.annotations = {};
      projectObj.metadata.annotations['openmcp.cloud/display-name'] = displayName;
    }

    if (chargingTargetType && chargingTarget) {
      projectObj.spec.chargebacks = [
        {
          type: chargingTargetType,
          target: chargingTarget,
        },
      ];
    }

    if (members && members.length > 0) {
      projectObj.spec.members = members.map(member => ({
        kind: member.kind || 'User',
        name: member.name,
        roles: member.roles,
      }));
    }

    return yaml.dump(projectObj, { lineWidth: -1 });
  }, [name, displayName, chargingTarget, chargingTargetType, members]);

  const handleStepChange = (event: any) => {
    const stepIndex = event.detail.step.dataset.stepIndex;
    if (stepIndex) {
      setCurrentStep(parseInt(stepIndex));
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      onCreate();
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const setMembers = (newMembers: Member[]) => {
    setValue('members', newMembers);
  };

  const canProceed = () => {
    if (currentStep === 1) {
      const hasName = name.length > 0;
      const hasValidChargingTarget = !chargingTargetType || (chargingTargetType && chargingTarget.length > 0);
      return !errors.name && hasName && hasValidChargingTarget;
    }
    return true;
  };

  const downloadYaml = () => {
    const blob = new Blob([yamlString], { type: 'text/yaml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-${name || 'new'}.yaml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      stretch
      open={isOpen}
      onClose={() => setIsOpen(false)}
      headerText="Create Project"
      className={styles.dialog}
      footer={
        <Bar
          design="Footer"
          endContent={
            <FlexBox style={{ gap: '0.5rem' }}>
              <Button onClick={() => setIsOpen(false)}>{t('common.cancel')}</Button>
              {currentStep === 2 && (
                <Button onClick={handleBack}>{t('common.back')}</Button>
              )}
              <Button design="Emphasized" onClick={handleNext} disabled={!canProceed()}>
                {currentStep === 2 ? t('common.create') : t('common.next')}
              </Button>
            </FlexBox>
          }
        />
      }
    >
      <Wizard contentLayout="SingleStep" onStepChange={handleStepChange} className={styles.wizard}>
        <WizardStep
          titleText={t('CreateProjectWorkspaceDialog.metadataHeader')}
          selected={currentStep === 1}
          disabled={false}
        >
          <div className={styles.wizardContent}>
            <div className={styles.leftPane}>
              <MetadataForm
                watch={watch}
                register={register}
                errors={errors}
                setValue={setValue}
                requireChargingTarget={true}
                hideHeader={true}
              />
            </div>

            <div className={styles.rightPane}>
              <div className={styles.yamlHeader}>
                <FlexBox style={{ gap: '0.5rem', marginLeft: 'auto' }}>
                  <Button icon="copy" onClick={() => copyToClipboard(yamlString)}>
                    {t('buttons.copy')}
                  </Button>
                  <Button icon="download" onClick={downloadYaml}>
                    {t('buttons.download')}
                  </Button>
                </FlexBox>
              </div>
              <div className={styles.yamlContent}>
                <YamlResourceEditorSchemaLoader
                  apiGroupName="core.openmcp.cloud"
                  apiVersion="v1alpha1"
                  yamlString={yamlString}
                  filename={`project-${name || 'new'}`}
                  isEdit={false}
                  kind="project"
                />
              </div>
            </div>
          </div>
        </WizardStep>

        <WizardStep
          titleText={t('CreateProjectWorkspaceDialog.membersHeader')}
          selected={currentStep === 2}
          disabled={!canProceed()}
        >
          <div className={styles.wizardContent}>
            <div className={styles.leftPane}>
              <FormGroup>
                <EditMembers
                  type="project"
                  members={members}
                  isValidationError={!!errors.members}
                  onMemberChanged={setMembers}
                />
              </FormGroup>
            </div>

            <div className={styles.rightPane}>
              <div className={styles.yamlHeader}>
                <FlexBox style={{ gap: '0.5rem', marginLeft: 'auto' }}>
                  <Button icon="copy" onClick={() => copyToClipboard(yamlString)}>
                    {t('buttons.copy')}
                  </Button>
                  <Button icon="download" onClick={downloadYaml}>
                    {t('buttons.download')}
                  </Button>
                </FlexBox>
              </div>
              <div className={styles.yamlContent}>
                <YamlResourceEditorSchemaLoader
                  apiGroupName="core.openmcp.cloud"
                  apiVersion="v1alpha1"
                  yamlString={yamlString}
                  filename={`project-${name || 'new'}`}
                  isEdit={false}
                  kind="project"
                />
              </div>
            </div>
          </div>
        </WizardStep>
      </Wizard>
    </Dialog>
  );
}
