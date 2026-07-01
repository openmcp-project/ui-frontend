import '@ui5/webcomponents-icons/dist/search';
import { Icon, Input, InputDomRef, Ui5CustomEvent } from '@ui5/webcomponents-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ResourceSearchBar.module.css';

interface Props {
  focusOnMount?: boolean;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  value: string;
}

export function ResourceSearchBar({ focusOnMount, onChange, onKeyDown, value }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<InputDomRef>(null);

  useEffect(() => {
    if (focusOnMount) {
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.wrapper}>
      <Input
        ref={inputRef}
        className={styles.input}
        icon={<Icon name="search" />}
        placeholder={t('ResourceSearchBar.placeholder')}
        showClearIcon
        value={value}
        onInput={(e: Ui5CustomEvent<InputDomRef, never>) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
