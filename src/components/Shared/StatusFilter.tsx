import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Option, Icon } from '@ui5/webcomponents-react';

export interface StatusFilterProps {
  column: {
    filterValue?: string;
    setFilter?: (value?: string) => void;
  };
}

interface SelectChangeEventDetail {
  selectedOption: HTMLElement & {
    dataset?: {
      value?: string;
    };
  };
}

type SelectChangeEvent = CustomEvent<SelectChangeEventDetail>;

interface OptionProps {
  value: string;
  iconName: string;
  color: string;
  labelKey: string;
  isSelected: boolean;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ column }) => {
  const { t } = useTranslation();

  const handleChange = (e: SelectChangeEvent) => {
    const selectedOption = e.detail.selectedOption;
    if (!selectedOption || !column.setFilter) return;

    const val = selectedOption.dataset?.value;
    column.setFilter(val === 'all' ? undefined : val);
  };

  const renderOption = ({
    value,
    iconName,
    color,
    labelKey,
    isSelected,
  }: OptionProps) => (
    <Option
      data-value={value}
      selected={isSelected}
      style={{
        padding: '6px 10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Icon
          name={iconName}
          style={{
            color,
            width: 16,
            height: 16,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 14 }}>{t(labelKey)}</span>
      </div>
    </Option>
  );

  return (
    <Select onChange={handleChange}>
      {renderOption({
        value: 'all',
        iconName: 'filter',
        color: 'gray',
        labelKey: 'All',
        isSelected: column.filterValue === undefined,
      })}
      {renderOption({
        value: 'true',
        iconName: 'sys-enter-2',
        color: 'green',
        labelKey: 'Enabled',
        isSelected: column.filterValue === 'true',
      })}
      {renderOption({
        value: 'false',
        iconName: 'sys-cancel-2',
        color: 'red',
        labelKey: 'Disabled',
        isSelected: column.filterValue === 'false',
      })}
    </Select>
  );
};

export default StatusFilter;
