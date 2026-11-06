import '@ui5/webcomponents-icons/dist/globe';
import { CheckBox, CheckBoxDomRef, FlexBox, Icon, Text, Ui5CustomEvent } from '@ui5/webcomponents-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './StaticEgressIpCheckBox.module.css';

interface StaticEgressIpCheckBoxProps {
  checked: boolean;
  /** Set when the ControlPlane already has a reserved IP — the platform ignores a later opt-out. */
  locked?: boolean;
  onChange: (checked: boolean) => void;
}

export const StaticEgressIpCheckBox: FC<StaticEgressIpCheckBoxProps> = ({ checked, locked = false, onChange }) => {
  const { t } = useTranslation();

  return (
    <FlexBox direction="Column" className={styles.container}>
      <FlexBox alignItems="Center" gap={12}>
        <Icon name="globe" className={styles.icon} accessibleName={t('StaticEgressIp.label')} />
        <CheckBox
          checked={checked}
          disabled={locked}
          text={t('StaticEgressIp.checkboxLabel')}
          data-testid="static-egress-ip-checkbox"
          onChange={(e: Ui5CustomEvent<CheckBoxDomRef>) => onChange(e.target.checked)}
        />
      </FlexBox>
      <Text className={styles.hint}>{locked ? t('StaticEgressIp.lockedHint') : t('StaticEgressIp.checkboxHint')}</Text>
    </FlexBox>
  );
};
