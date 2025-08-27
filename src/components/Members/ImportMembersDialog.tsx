import { FC, useMemo, useState } from 'react';
import {
  Button,
  CheckBox,
  Dialog,
  FlexBox,
  Label,
  Option,
  Select,
  Ui5CustomEvent,
  CheckBoxDomRef,
} from '@ui5/webcomponents-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnalyticalTable, Icon } from '@ui5/webcomponents-react';
import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import { Member, MemberRoles, MemberRolesDetailed } from '../../lib/api/types/shared/members';
import { ACCOUNT_TYPES } from './EditMembers.tsx';

type ParentType = 'Workspace' | 'Project';

type ImportMembersFormData = {
  parentType: ParentType | '';
  importMembers: boolean;
  importServiceAccounts: boolean;
};

type ImportMembersDialogProps = {
  open: boolean;
  onClose: () => void;
  onImport: (members: Member[]) => void;
};

export const ImportMembersDialog: FC<ImportMembersDialogProps> = ({ open, onClose, onImport }) => {
  const [step, setStep] = useState<number>(1);

  const formSchema = useMemo(
    () =>
      z
        .object({
          parentType: z.union([z.literal('Workspace'), z.literal('Project'), z.literal('')]),
          importMembers: z.boolean(),
          importServiceAccounts: z.boolean(),
        })
        .refine((data) => data.importMembers || data.importServiceAccounts, {
          path: ['importMembers'],
          message: 'Select at least one option',
        }),
    [],
  );

  const { handleSubmit, setValue, watch } = useForm<ImportMembersFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      parentType: 'Project',
      importMembers: false,
      importServiceAccounts: false,
    },
  });

  const parentType = watch('parentType');
  const importMembers = watch('importMembers');
  const importServiceAccounts = watch('importServiceAccounts');
  const canProceed = parentType !== '' && (importMembers || importServiceAccounts);
  const onSubmitStepOne = () => {
    setStep(2);
  };
  console.log(parentType, importMembers, importServiceAccounts);
  return (
    <Dialog
      open={open}
      headerText={step === 1 ? 'Import members' : 'Import members'}
      // onAfterClose={handleDialogAfterClose}
      onClose={onClose}
    >
      {step === 1 && (
        <FlexBox direction="Column" gap={8} style={{ padding: '1rem' }}>
          <Label>Choose parent to import members from</Label>
          <Select
            data-testid="parent-select"
            value={parentType}
            onChange={(e: any) => {
              const selected = (e.detail.selectedOption as any)?.value as ParentType;
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
              onChange={(e: Ui5CustomEvent<CheckBoxDomRef, { checked: boolean }>) =>
                setValue('importMembers', e.target.checked, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
            />
            <CheckBox
              text="Service Accounts"
              checked={importServiceAccounts}
              onChange={(e: Ui5CustomEvent<CheckBoxDomRef, { checked: boolean }>) =>
                setValue('importServiceAccounts', e.target.checked, {
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
        <ImportMembersSelectionTable
          onCancel={onClose}
          onImport={onImport}
          includeMembers={importMembers}
          includeServiceAccounts={importServiceAccounts}
        />
      )}
    </Dialog>
  );
};

type SelectionRow = {
  email: string;
  role: string;
  kind: string;
  _member: Member;
};

const ImportMembersSelectionTable: FC<{
  onCancel: () => void;
  onImport: (members: Member[]) => void;
  includeMembers: boolean;
  includeServiceAccounts: boolean;
}> = ({ onCancel, onImport, includeMembers, includeServiceAccounts }) => {
  const mockedMembers: Member[] = [
    { name: 'alice@example.com', role: MemberRoles.view, kind: 'User' },
    { name: 'bob@example.com', role: MemberRoles.admin, kind: 'User' },
    { name: 'service-reader', role: MemberRoles.view, kind: 'ServiceAccount', namespace: 'default' },
    { name: 'service-admin', role: MemberRoles.admin, kind: 'ServiceAccount', namespace: 'ops' },
  ];

  const filteredMockedMembers: Member[] = mockedMembers.filter(
    (m) => (m.kind === 'User' && includeMembers) || (m.kind === 'ServiceAccount' && includeServiceAccounts),
  );

  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  const columns: AnalyticalTableColumnDefinition[] = [
    {
      Header: '',
      id: 'select',
      width: 60,
      Cell: (instance: { cell: { row: { original: SelectionRow } } }) => {
        const email = instance.cell.row.original.email;
        const checked = selectedEmails.has(email);
        return (
          <CheckBox
            checked={checked}
            onChange={(e: Ui5CustomEvent<CheckBoxDomRef, { checked: boolean }>) => {
              setSelectedEmails((prev) => {
                const next = new Set(prev);
                if (e.target.checked) {
                  next.add(email);
                } else {
                  next.delete(email);
                }
                return next;
              });
            }}
          />
        );
      },
    },
    { Header: 'Email', accessor: 'email' },
    {
      Header: 'Type',
      accessor: 'kind',
      width: 145,
      Cell: (instance: { cell: { row: { original: SelectionRow } } }) => {
        const kind = ACCOUNT_TYPES.find(({ value }) => value === instance.cell.row.original.kind);
        return (
          <FlexBox gap={'0.5rem'} wrap={'NoWrap'}>
            <Icon name={kind?.icon} accessibleName={kind?.label} showTooltip />
            {kind?.label}
          </FlexBox>
        );
      },
    },
    { Header: 'Role', accessor: 'role', width: 120 },
  ];

  const data: SelectionRow[] = filteredMockedMembers.map((m) => ({
    email: m.name,
    role: MemberRolesDetailed[m.role as MemberRoles]?.displayValue,
    kind: m.kind,
    _member: m,
  }));

  const handleAddMembers = () => {
    const selected = filteredMockedMembers.filter((m) => selectedEmails.has(m.name));
    onImport(selected);
    onCancel();
  };

  return (
    <FlexBox direction="Column" gap={8} style={{ padding: '1rem' }}>
      <AnalyticalTable scaleWidthMode="Smart" columns={columns} data={data} />

      <FlexBox justifyContent="End" gap={8} style={{ marginTop: '1rem' }}>
        <Button design="Transparent" onClick={onCancel}>
          Cancel
        </Button>
        <Button design="Emphasized" onClick={handleAddMembers} disabled={selectedEmails.size === 0}>
          Add members
        </Button>
      </FlexBox>
    </FlexBox>
  );
};
