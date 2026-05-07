import { useState, useMemo, FormEvent } from 'react';
import { Dialog, FlexBox, Button, Bar, FormGroup } from '@ui5/webcomponents-react';
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

type WizardStepType = 'metadata' | 'members';

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
  const [currentStep, setCurrentStep] = useState<WizardStepType>('metadata');

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

  const handleNext = () => {
    if (currentStep === 'metadata') {
      setCurrentStep('members');
    } else {
      // Step 2 - Create button
      onCreate();
    }
  };

  const handleBack = () => {
    if (currentStep === 'members') {
      setCurrentStep('metadata');
    }
  };

  const setMembers = (newMembers: Member[]) => {
    setValue('members', newMembers);
  };

  const canProceed = () => {
    if (currentStep === 'metadata') {
      return !errors.name && name.length > 0;
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
      header={
        <div className={styles.wizardHeader}>
          <div
            className={`${styles.step} ${currentStep === 'metadata' ? styles.stepActive : ''}`}
            onClick={() => setCurrentStep('metadata')}
          >
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepTitle}>{t('CreateProjectWorkspaceDialog.metadataHeader')}</div>
          </div>
          <div className={styles.stepConnector}></div>
          <div
            className={`${styles.step} ${currentStep === 'members' ? styles.stepActive : ''}`}
            onClick={() => currentStep === 'members' && setCurrentStep('members')}
          >
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepTitle}>{t('CreateProjectWorkspaceDialog.membersHeader')}</div>
          </div>
        </div>
      }
      footer={
        <Bar
          design="Footer"
          endContent={
            <FlexBox style={{ gap: '0.5rem' }}>
              <Button onClick={() => setIsOpen(false)}>{t('common.cancel')}</Button>
              {currentStep === 'members' && (
                <Button onClick={handleBack}>{t('common.back')}</Button>
              )}
              <Button design="Emphasized" onClick={handleNext} disabled={!canProceed()}>
                {currentStep === 'members' ? t('common.create') : t('common.next')}
              </Button>
            </FlexBox>
          }
        />
      }
    >
      <FlexBox className={styles.container}>
        {/* Left side: Form */}
        <div className={styles.leftPanel}>
          {currentStep === 'metadata' && (
            <div className={styles.formWrapper}>
              <MetadataForm
                watch={watch}
                register={register}
                errors={errors}
                setValue={setValue}
                requireChargingTarget={true}
              />
            </div>
          )}

          {currentStep === 'members' && (
            <div className={styles.formWrapper}>
              <FormGroup headerText={t('CreateProjectWorkspaceDialog.membersHeader')}>
                <EditMembers
                  type="project"
                  members={members}
                  isValidationError={!!errors.members}
                  onMemberChanged={setMembers}
                />
              </FormGroup>
            </div>
          )}
        </div>

        {/* Right side: YAML Preview */}
        <div className={styles.rightPanel}>
          <FlexBox className={styles.yamlHeader} justifyContent="SpaceBetween" alignItems="Center">
            <span className={styles.yamlTitle}>{t('common.yamlPreview')}</span>
            <FlexBox style={{ gap: '0.5rem' }}>
              <Button icon="copy" onClick={() => copyToClipboard(yamlString)}>
                {t('buttons.copy')}
              </Button>
              <Button icon="download" onClick={downloadYaml}>
                {t('buttons.download')}
              </Button>
            </FlexBox>
          </FlexBox>
          <div className={styles.yamlEditor}>
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
      </FlexBox>
    </Dialog>
  );
}
