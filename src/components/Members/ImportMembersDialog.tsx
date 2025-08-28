import { FC, useMemo, useState, useEffect } from 'react';
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
  AnalyticalTable,
  Icon,
  BusyIndicator,
} from '@ui5/webcomponents-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import { Member, MemberRoles, MemberRolesDetailed } from '../../lib/api/types/shared/members';
import { ACCOUNT_TYPES } from './EditMembers.tsx';

import { ResourceObject } from '../../lib/api/types/crate/resourceObject.ts';
import { useApiResource } from '../../lib/api/useApiResource.ts';

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
  projectName?: string;
  workspaceName?: string;
};

export const ImportMembersDialog: FC<ImportMembersDialogProps> = ({
  open,
  projectName,
  workspaceName,
  onClose,
  onImport,
}) => {
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

  const { handleSubmit, setValue, watch, reset, getValues } = useForm<ImportMembersFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      parentType: 'Project',
      importMembers: true,
      importServiceAccounts: true,
    },
  });

  const parentType = watch('parentType');
  const importMembers = watch('importMembers');
  const importServiceAccounts = watch('importServiceAccounts');
  const canProceed = parentType !== '' && (importMembers || importServiceAccounts);
  const onSubmitStepOne = () => {
    setStep(2);
  };

  console.log(projectName);
  console.log(workspaceName);
  useEffect(() => {
    if (!open) {
      setStep(1);
      reset({ parentType: 'Project', importMembers: false, importServiceAccounts: false });
    }
  }, [open, reset]);
  return (
    <Dialog open={open} headerText={step === 1 ? 'Import members' : 'Import members'} onClose={onClose}>
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
            {!!workspaceName && <Option value="Workspace">Workspace</Option>}
            <Option value="Project">Project</Option>
          </Select>

          <Label>What would you like to import?</Label>
          <FlexBox direction="Column" gap={4}>
            <CheckBox
              text="Members"
              checked={getValues('importMembers') ?? false}
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
              checked={getValues('importServiceAccounts') ?? false}
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
          parentType={parentType as ParentType}
          includeMembers={importMembers}
          includeServiceAccounts={importServiceAccounts}
          workspaceName={workspaceName}
          projectName={projectName}
          onCancel={onClose}
          onImport={onImport}
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

interface SpecMembers {
  spec?: { members: { name: string; roles: string[]; kind: 'User' | 'ServiceAccount'; namespace?: string }[] };
}

const ImportMembersSelectionTable: FC<{
  onCancel: () => void;
  onImport: (members: Member[]) => void;
  parentType: ParentType;
  includeMembers: boolean;
  includeServiceAccounts: boolean;
  workspaceName?: string;
  projectName?: string;
}> = ({ onCancel, onImport, parentType, workspaceName, projectName, includeMembers, includeServiceAccounts }) => {
  const {
    isLoading,
    data: parentResourceData,
    error,
  } = useApiResource(
    parentType === 'Project'
      ? ResourceObject<SpecMembers>('', 'projects', projectName ?? '')
      : ResourceObject<SpecMembers>(workspaceName ?? '', 'projects', projectName ?? ''),
    undefined,
    true,
  );
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  if (isLoading) {
    return <BusyIndicator active />;
  }
  console.log(parentResourceData?.spec?.members);
  const membersData = parentResourceData?.spec?.members ?? [];
  const mockedMembers: Member[] = membersData.map(({ name, namespace, kind, roles }) => ({
    kind,
    name,
    role: roles.includes('admin') ? 'admin' : 'view',
    namespace,
  }));

  const filteredMockedMembers: Member[] = mockedMembers.filter(
    (m) => (m.kind === 'User' && includeMembers) || (m.kind === 'ServiceAccount' && includeServiceAccounts),
  );

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
        <Button design="Emphasized" disabled={selectedEmails.size === 0} onClick={handleAddMembers}>
          Add members
        </Button>
      </FlexBox>
    </FlexBox>
  );
};
