import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@ui5/webcomponents-react';
import StatusFilterOption, { StatusFilterOptionProps } from './StatusFilterOption';

interface StatusFilterProps {
  column: {
    filterValue?: string;
    setFilter?: (value?: string) => void;
  };
}

const options: Pick<StatusFilterOptionProps, 'value' | 'iconName' | 'color' | 'labelKey'>[] = [
  { value: 'all', iconName: 'filter', color: 'gray', labelKey: 'All' },
  {
    value: 'true',
    iconName: 'sys-enter-2',
    color: 'green',
    labelKey: 'Enabled',
  },
  {
    value: 'false',
    iconName: 'sys-cancel-2',
    color: 'red',
    labelKey: 'Disabled',
  },
];

const StatusFilter: React.FC<StatusFilterProps> = ({ column }) => {
  const { t } = useTranslation();

  const handleChange = (e: CustomEvent<{ selectedOption: { dataset?: { value?: string } } }>) => {
    const value = e.detail.selectedOption.dataset?.value;
    column.setFilter?.(value === 'all' ? undefined : value);
  };

  return (
    <Select onChange={handleChange}>
      {options.map((option) => (
        <StatusFilterOption
          key={option.value}
          {...option}
          t={t}
          isSelected={column.filterValue === option.value || (option.value === 'all' && !column.filterValue)}
        />
      ))}
    </Select>
  );
};

export default StatusFilter;
