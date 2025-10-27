import { FC, useMemo, useState, useEffect } from 'react';
import styles from './ImportMembersDialog.module.css';
import {
  Button,
  Dialog,
  FlexBox,
  Label,
  Option,
  Select,
  AnalyticalTable,
  Icon,
  AnalyticalTablePropTypes,
  SegmentedButton,
  SegmentedButtonItem,
  Bar,
} from '@ui5/webcomponents-react';

import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import { Member, MemberRoles, MemberRolesDetailed } from '../../lib/api/types/shared/members';
import { ACCOUNT_TYPES } from './EditMembers.tsx';

import { ResourceObject } from '../../lib/api/types/crate/resourceObject.ts';
import { useApiResource } from '../../lib/api/useApiResource.ts';
import { useTranslation } from 'react-i18next';
import IllustratedError from '../Shared/IllustratedError.tsx';
import { TFunction } from 'i18next';

type FilteredFor = 'All' | 'Users' | 'ServiceAccounts';
type SourceType = 'Workspace' | 'Project';
type TableRow = {
  email: string;
  role: string;
  kind: string;
  _member: Member;
};

export interface ImportMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (members: Member[]) => void;
  projectName: string;
  workspaceName?: string;
}
export const ImportMembersDialog: FC<ImportMembersDialogProps> = ({
  isOpen,
  projectName,
  workspaceName,
  onClose,
  onImport,
}) => {
  const [filteredFor, setFilteredFor] = useState<FilteredFor>('All');
  const [sourceType, setSourceType] = useState<SourceType>('Project');
  const [selectedRowIds, setSelectedRowIds] = useState<AnalyticalTablePropTypes['selectedRowIds']>({});

  const { t } = useTranslation();

  const {
    isLoading,
    data: parentResourceData,
    error,
  } = useApiResource(
    sourceType === 'Project'
      ? ResourceObject<SpecMembers>('', 'projects', projectName)
      : ResourceObject<SpecMembers>(`project-${projectName}`, 'workspaces', workspaceName ?? ''),
    undefined,
    true,
    !isOpen,
  );

  const selectedMembersCount = Object.keys(selectedRowIds ?? {}).length;

  const tableData: TableRow[] = useMemo(() => {
    const members = parentResourceData?.spec?.members ?? [];
    const showUsers = filteredFor !== 'ServiceAccounts';
    const showServiceAccounts = filteredFor !== 'Users';

    return members
      .filter(({ kind }) => (kind === 'User' && showUsers) || (kind === 'ServiceAccount' && showServiceAccounts))
      .map((m) => ({
        email: m.name,
        role: MemberRolesDetailed[m.roles?.[0] as MemberRoles]?.displayValue,
        kind: m.kind,
        _member: m,
      }));
  }, [parentResourceData, filteredFor]);

  const columns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
      { Header: t('MemberTable.columnNameHeader'), accessor: 'email' },
      {
        Header: t('MemberTable.columnTypeHeader'),
        accessor: 'kind',
        width: 145,
        Cell: (instance) => {
          const original = instance.cell.row.original as TableRow;
          const kind = ACCOUNT_TYPES.find(({ value }) => value === original.kind);
          return (
            <FlexBox gap={'0.5rem'} wrap={'NoWrap'}>
              <Icon name={kind?.icon} accessibleName={kind?.label} showTooltip />
              {kind?.label}
            </FlexBox>
          );
        },
      },
      { Header: t('MemberTable.columnRoleHeader'), accessor: 'role', width: 120 },
    ],
    [t],
  );

  useEffect(() => {
    setSelectedRowIds({});
  }, [isOpen]);

  const handleAddMembers = () => {
    const selectedMembers = Object.entries(selectedRowIds ?? {})
      .filter(([, isSelected]) => isSelected)
      .map(([idx]) => tableData[Number(idx)]._member);

    onImport(selectedMembers);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      headerText={t('ImportMembersDialog.dialogTitle')}
      className={styles.dialog}
      footer={
        <Bar
          endContent={
            <>
              <Button design="Transparent" onClick={onClose}>
                {t('buttons.cancel')}
              </Button>
              <Button design="Emphasized" disabled={selectedMembersCount === 0} onClick={handleAddMembers}>
                {getAddMembersButtonText(selectedMembersCount, t)}
              </Button>
            </>
          }
        />
      }
      onClose={onClose}
    >
      {error ? (
        <IllustratedError />
      ) : (
        <>
          <div className={styles.grid}>
            <div className={styles.gridColumnLabel}>
              <Label>{t('ImportMembersDialog.reuseFromLabel')}</Label>
            </div>
            <div>
              <Select
                value={sourceType}
                onChange={(e) => {
                  setSourceType(e.detail.selectedOption?.value as SourceType);
                  setSelectedRowIds({});
                }}
              >
                <Option value="Project" additionalText={t('Entities.Project')}>
                  {projectName}
                </Option>
                {!!workspaceName && (
                  <Option value="Workspace" additionalText={t('Entities.Workspace')}>
                    {workspaceName}
                  </Option>
                )}
              </Select>
            </div>
            <div className={styles.gridColumnLabel}>
              <Label>{t('ImportMembersDialog.filterForLabel')}</Label>
            </div>
            <div>
              <SegmentedButton
                onSelectionChange={(e) => {
                  setFilteredFor(e.detail.selectedItems[0].dataset.id as FilteredFor);
                  setSelectedRowIds({});
                }}
              >
                <SegmentedButtonItem data-id="All" selected={filteredFor === 'All'}>
                  {t('common.all')}
                </SegmentedButtonItem>
                <SegmentedButtonItem data-id="Users" selected={filteredFor === 'Users'}>
                  {t('Entities.Users')}
                </SegmentedButtonItem>
                <SegmentedButtonItem data-id="ServiceAccounts" selected={filteredFor === 'ServiceAccounts'}>
                  {t('Entities.ServiceAccounts')}
                </SegmentedButtonItem>
              </SegmentedButton>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <AnalyticalTable
              selectionMode="Multiple"
              scaleWidthMode="Smart"
              columns={columns}
              data={tableData}
              visibleRows={8}
              minRows={8}
              selectedRowIds={selectedRowIds}
              loading={isLoading}
              sortable
              onRowSelect={(e) => {
                setSelectedRowIds(e?.detail.selectedRowIds);
              }}
            />
          </div>
        </>
      )}
    </Dialog>
  );
};

function getAddMembersButtonText(selectedMembersCount: number, t: TFunction) {
  switch (selectedMembersCount) {
    case 0:
      return t('ImportMembersDialog.addMembersButton0');
    case 1:
      return t('ImportMembersDialog.addMembersButton1');
    default:
      return t('ImportMembersDialog.addMembersButtonN', { count: selectedMembersCount });
  }
}

interface SpecMembers {
  spec?: { members: { name: string; roles: string[]; kind: 'User' | 'ServiceAccount'; namespace?: string }[] };
}
