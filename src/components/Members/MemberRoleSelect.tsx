import { MemberRoles, MemberRolesDetailed } from '../../lib/api/types/shared/members';
import { FlexBox, Label, Option, Select, SelectDomRef, Ui5CustomEvent } from '@ui5/webcomponents-react';
import { SelectChangeEventDetail } from '@ui5/webcomponents/dist/Select.js';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface MemberRoleSelectProps {
  value: MemberRoles;
  onChange: (value: MemberRoles) => void;
}
export function MemberRoleSelect({ value, onChange: fireOnChangeEventToParent }: MemberRoleSelectProps) {
  const ref = useRef<SelectDomRef>(null);

  const handleChange = (event: Ui5CustomEvent<SelectDomRef, SelectChangeEventDetail>) => {
    const newValue = event.detail.selectedOption.dataset.value as MemberRoles;
    fireOnChangeEventToParent(newValue);
  };

  useEffect(() => {
    if (ref.current) {
      ref.current.value = value;
      return;
    }
  }, [value]);
  const { t } = useTranslation();
  return (
    <FlexBox direction={'Column'}>
      <Label for={'member-role-select'}>{t('MemberTable.columnRoleHeader')}</Label>
      <Select ref={ref} id="member-role-select" value={value} onChange={handleChange}>
        {Object.values(MemberRoles)
          .map((r) => MemberRolesDetailed[r])
          .map((role) => (
            <Option key={role.value} data-value={role.value} value={role.value}>
              {role.displayValue}
            </Option>
          ))}
      </Select>
    </FlexBox>
  );
}
