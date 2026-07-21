import { CheckBox, FlexBox, Input, Label } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { ServiceSelection } from '../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import LogoCrossplane from '../../../assets/images/logo-crossplane.svg';
import LogoEso from '../../../assets/images/logo-eso.svg';
import LogoFlux from '../../../assets/images/logo-flux.svg';
import LogoLandscaper from '../../../assets/images/logo-landscaper.svg';
import styles from './ServiceSelectionStep.module.css';

type ServiceKey = keyof ServiceSelection;

interface ServiceDef {
  key: ServiceKey;
  labelKey: string;
  logo: string;
}

const SERVICES: ServiceDef[] = [
  { key: 'crossplane', labelKey: 'ServiceSelectionStep.crossplane', logo: LogoCrossplane },
  { key: 'flux', labelKey: 'ServiceSelectionStep.flux', logo: LogoFlux },
  { key: 'landscaper', labelKey: 'ServiceSelectionStep.landscaper', logo: LogoLandscaper },
  { key: 'externalSecretsOperator', labelKey: 'ServiceSelectionStep.externalSecretsOperator', logo: LogoEso },
];

interface ServiceSelectionStepProps {
  services: ServiceSelection;
  onServicesChange: (services: ServiceSelection) => void;
}

export function ServiceSelectionStep({ services, onServicesChange }: ServiceSelectionStepProps) {
  const { t } = useTranslation();

  const toggle = (key: ServiceKey, checked: boolean) => {
    onServicesChange({
      ...services,
      [key]: { selected: checked, version: services[key]?.version ?? '' },
    });
  };

  const setVersion = (key: ServiceKey, version: string) => {
    onServicesChange({
      ...services,
      [key]: { selected: services[key]?.selected ?? false, version },
    });
  };

  return (
    <div className={styles.container}>
      <p className={styles.intro}>{t('ServiceSelectionStep.intro')}</p>
      <div className={styles.grid}>
        {SERVICES.map(({ key, labelKey, logo }) => {
          const entry = services[key];
          const selected = entry?.selected ?? false;
          return (
            <div key={key} className={styles.row}>
              <FlexBox alignItems="Center" gap={12}>
                <img src={logo} alt={t(labelKey)} className={styles.logo} />
                <CheckBox
                  checked={selected}
                  text={t(labelKey)}
                  data-testid={`service-${key}-checkbox`}
                  onChange={(e) => toggle(key, e.target.checked)}
                />
              </FlexBox>
              {selected && (
                <FlexBox alignItems="Center" gap={8} className={styles.versionRow}>
                  <Label for={`service-${key}-version`}>{t('ServiceSelectionStep.versionLabel')}</Label>
                  <Input
                    id={`service-${key}-version`}
                    data-testid={`service-${key}-version`}
                    placeholder={t('ServiceSelectionStep.versionPlaceholder')}
                    value={entry?.version ?? ''}
                    className={styles.versionInput}
                    onInput={(e) => setVersion(key, (e.target as unknown as { value: string }).value)}
                  />
                </FlexBox>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
