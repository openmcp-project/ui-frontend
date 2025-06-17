import { Icon, Option, Select } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import styles from './StatusFilter.module.css';

interface StatusFilterProps {
  column: {
    filterValue?: string;
    setFilter?: (value?: string | undefined) => void;
  };
}

interface OptionConfig {
  value: string;
  iconName: string;
  color: string;
  labelKey: string;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ column }) => {
  const { t } = useTranslation();

  const options: OptionConfig[] = [
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

  const handleChange = (
    e: CustomEvent<{ selectedOption: { dataset?: { value?: string } } }>,
  ) => {
    const value = e.detail.selectedOption.dataset?.value;
    column.setFilter?.(value === 'all' ? undefined : value);
  };

  const renderOption = ({ value, iconName, color, labelKey }: OptionConfig) => (
    <Option
      key={value}
      data-value={value}
      selected={
        column.filterValue === value || (value === 'all' && !column.filterValue)
      }
      className={styles.option}
    >
      <div className={styles.container}>
        <Icon name={iconName} style={{ color }} className={styles.icon} />
        <span className={styles.label}>{t(labelKey)}</span>
      </div>
    </Option>
  );

  return <Select onChange={handleChange}>{options.map(renderOption)}</Select>;
};

export default StatusFilter;
