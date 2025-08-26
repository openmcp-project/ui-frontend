import { FC, useMemo, useState } from 'react';
import { Button, CheckBox, Dialog, FlexBox, Label, Option, Select, Title } from '@ui5/webcomponents-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type ParentType = 'Workspace' | 'Project';

type ImportMembersFormData = {
  parentType: ParentType | '';
  importMembers: boolean;
  importServiceAccounts: boolean;
};

type ImportMembersDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const ImportMembersDialog: FC<ImportMembersDialogProps> = ({ open, onClose }) => {
  const [step, setStep] = useState<number>(1);

  const formSchema = useMemo(
    () =>
      z
        .object({
          parentType: z.union([z.literal('Workspace'), z.literal('Project')]),
          importMembers: z.boolean(),
          importServiceAccounts: z.boolean(),
        })
        .refine((data) => data.importMembers || data.importServiceAccounts, {
          path: ['importMembers'],
          message: 'Select at least one option',
        }),
    [],
  );

  const { handleSubmit, setValue, watch, reset } = useForm<ImportMembersFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      parentType: '',
      importMembers: false,
      importServiceAccounts: false,
    },
  });

  const parentType = watch('parentType');
  const importMembers = watch('importMembers');
  const importServiceAccounts = watch('importServiceAccounts');
  const canProceed = parentType !== '' && (importMembers || importServiceAccounts);

  const handleDialogAfterClose = () => {
    reset();
    setStep(1);
  };

  const onSubmitStepOne = () => {
    setStep(2);
  };

  return (
    <Dialog
      open={open}
      headerText={step === 1 ? 'Import members' : 'Import members'}
      onAfterClose={handleDialogAfterClose}
      onClose={onClose}
    >
      {step === 1 && (
        <FlexBox direction="Column" gap={8} style={{ padding: '1rem' }}>
          <Label>Choose parent to import members from</Label>
          <Select
            data-testid="parent-select"
            onChange={(e: any) => {
              const selected = (e.detail.selectedOption as HTMLElement)?.getAttribute('value') as ParentType;
              setValue('parentType', selected, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            }}
          >
            <Option value="Workspace">Workspace</Option>
            <Option value="Project">Project</Option>
          </Select>

          <Label>What would you like to import?</Label>
          <FlexBox direction="Column" gap={4}>
            <CheckBox
              text="Members"
              checked={importMembers}
              onChange={(e: any) =>
                setValue('importMembers', e.detail.checked, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
            />
            <CheckBox
              text="Service Accounts"
              checked={importServiceAccounts}
              onChange={(e: any) =>
                setValue('importServiceAccounts', e.detail.checked, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
            />
          </FlexBox>

          <FlexBox justifyContent="End" gap={8} style={{ marginTop: '1rem' }}>
            <Button design="Transparent" onClick={onClose}>
              Cancel
            </Button>
            <Button design="Emphasized" disabled={!canProceed} onClick={() => handleSubmit(onSubmitStepOne)()}>
              Next
            </Button>
          </FlexBox>
        </FlexBox>
      )}

      {step === 2 && (
        <FlexBox direction="Column" gap={8} style={{ padding: '1rem' }}>
          <Title>Step 1</Title>

          <FlexBox justifyContent="End" gap={8} style={{ marginTop: '1rem' }}>
            <Button design="Transparent" onClick={onClose}>
              Cancel
            </Button>
            <Button design="Emphasized">Add members</Button>
          </FlexBox>
        </FlexBox>
      )}
    </Dialog>
  );
};
