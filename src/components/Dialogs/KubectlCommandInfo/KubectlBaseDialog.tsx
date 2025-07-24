import {
  FlexBox,
  MessageStrip,
  Text,
  Link,
  Input,
  Panel,
  InputDomRef,
  Ui5CustomEvent,
  Dialog,
  Button,
  Bar,
} from '@ui5/webcomponents-react';
import { KubectlTerminal } from './KubectlTerminal';
import { useState, useEffect, ReactNode } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useLink } from '../../../lib/shared/useLink.ts';

export interface FormField {
  id: string;
  label: string;
  placeholder: string;
  defaultValue: string;
}

export interface CustomCommand {
  command: string;
  description: string;
  isMainCommand?: boolean;
}

interface KubectlBaseDialogProps {
  onClose: () => void;
  open?: boolean;
  title: string;
  introSection: ReactNode[];
  formFields?: FormField[];
  customCommands: CustomCommand[];
}

export const KubectlBaseDialog = ({
  onClose,
  open,
  title,
  introSection,
  formFields = [],
  customCommands,
}: KubectlBaseDialogProps) => {
  const { t } = useTranslation();
  const { gettingStartedGuide } = useLink();
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialValues: Record<string, string> = {};
    formFields?.forEach((field) => {
      initialValues[field.id] = field.defaultValue;
    });
    setFormValues(initialValues);
  }, []);

  const handleFieldChange = (fieldId: string) => (event: Ui5CustomEvent<InputDomRef>) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: event.target.value,
    }));
  };

  const getFormattedCommand = (template: string) => {
    let result = template;

    Object.entries(formValues).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\$\\{${key}\\}`, 'g');
      result = result.replace(placeholder, value);
    });

    return result;
  };

  const showFormFields = formFields && formFields.length > 0;

  return (
    <Dialog
      headerText={title}
      open={open}
      style={{ width: '550px' }}
      footer={<Bar endContent={<Button onClick={onClose}>Close</Button>} />}
      onClose={onClose}
    >
      <FlexBox direction="Column" style={{ gap: '16px' }}>
        <Panel headerText={t('KubectlBaseDialog.prerequisites')} collapsed>
          <Text>
            <Trans
              i18nKey="KubectlBaseDialog.prerequisitesText"
              components={{
                bold1: <b />,
                bold2: <b />,
                bold3: <b />,
              }}
            />
          </Text>
        </Panel>

        {introSection}

        {customCommands
          .filter((template) => template.isMainCommand)
          .map((template, index) => (
            <div key={`main-command-${index}`}>
              <Text>{template.description}</Text>
              <KubectlTerminal command={getFormattedCommand(template.command)} />
            </div>
          ))}

        {showFormFields && (
          <>
            <Text>
              <Trans
                i18nKey="KubectlBaseDialog.formFieldsNote"
                components={{
                  bold1: <b />,
                }}
              />
            </Text>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              {formFields.map((field) => (
                <div key={field.id}>
                  <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>{field.label}</Text>
                  <Input
                    placeholder={field.placeholder}
                    value={formValues[field.id] || ''}
                    style={{ width: '100%' }}
                    onChange={handleFieldChange(field.id)}
                    onInput={handleFieldChange(field.id)}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {customCommands
          .filter((template) => !template.isMainCommand)
          .map((template, index) => (
            <div key={`additional-command-${index}`}>
              <Text>{template.description}</Text>
              <KubectlTerminal command={getFormattedCommand(template.command)} />
            </div>
          ))}

        <MessageStrip design="Information" hideCloseButton={true}>
          <Trans
            i18nKey="KubectlBaseDialog.onboardingGuide"
            components={{
              link1: <Link href={gettingStartedGuide} target="_blank" />,
            }}
          />
        </MessageStrip>
      </FlexBox>
    </Dialog>
  );
};
