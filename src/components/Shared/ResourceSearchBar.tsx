import { Icon, Input, InputDomRef, Ui5CustomEvent } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/search';
import { useTranslation } from 'react-i18next';
import styles from './ResourceSearchBar.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function ResourceSearchBar({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className={styles.wrapper}>
      <Input
        className={styles.input}
        icon={<Icon name="search" />}
        placeholder={t('ResourceSearchBar.placeholder')}
        showClearIcon
        value={value}
        onInput={(e: Ui5CustomEvent<InputDomRef, never>) => onChange(e.target.value)}
      />
    </div>
  );
}
