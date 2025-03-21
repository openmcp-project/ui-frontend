import {
  FlexBox,
  MessageStrip,
  Text,
  Link,
  Input,
  Panel,
} from '@ui5/webcomponents-react';
import { KubectlDialog } from './KubectlDialog';
import { KubectlTerminal } from './KubectlTerminal';
import { useState, useEffect, ReactNode } from 'react';
import { InputDomRef } from '@ui5/webcomponents-react';
import { Ui5CustomEvent } from '@ui5/webcomponents-react';

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
  title: string;
  introSection: ReactNode[];
  formFields?: FormField[];
  customCommands: CustomCommand[];
}

export const KubectlBaseDialog = ({
  onClose,
  title,
  introSection,
  formFields = [],
  customCommands,
}: KubectlBaseDialogProps) => {
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialValues: Record<string, string> = {};
    formFields?.forEach((field) => {
      initialValues[field.id] = field.defaultValue;
    });
    setFormValues(initialValues);
  }, []);

  const handleFieldChange =
    (fieldId: string) => (event: Ui5CustomEvent<InputDomRef>) => {
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
    <KubectlDialog onClose={onClose} headerText={title}>
      <FlexBox direction="Column" style={{ gap: '16px' }}>
        <Panel headerText="Prerequisites" collapsed>
          <Text>
            Make sure you have installed <b>kubectl</b> and the <b>kubelogin</b>{' '}
            plugin. We recommend using <b>krew</b> which is a plugin manager for
            kubectl.
          </Text>
        </Panel>

        {introSection}

        {customCommands
          .filter((template) => template.isMainCommand)
          .map((template, index) => (
            <div key={`main-command-${index}`}>
              <Text>{template.description}</Text>
              <KubectlTerminal
                command={getFormattedCommand(template.command)}
              />
            </div>
          ))}

        {showFormFields && (
          <>
            <Text>
              <b>Important:</b> Before executing, modify the commands below:
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
                  <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    {field.label}
                  </Text>
                  <Input
                    placeholder={field.placeholder}
                    value={formValues[field.id] || ''}
                    onChange={handleFieldChange(field.id)}
                    onInput={handleFieldChange(field.id)}
                    style={{ width: '100%' }}
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
              <KubectlTerminal
                command={getFormattedCommand(template.command)}
              />
            </div>
          ))}

        <MessageStrip design="Information" hideCloseButton={true}>
          <Text>
            You can also use our{' '}
            <Link
              href="https://pages.github.tools.sap/cloud-orchestration/docs/managed-control-planes/get-started/get-started-mcp#before-you-begin"
              target="_blank"
            >
              Onboarding Guide
            </Link>{' '}
            for more information.
          </Text>
        </MessageStrip>
      </FlexBox>
    </KubectlDialog>
  );
};
