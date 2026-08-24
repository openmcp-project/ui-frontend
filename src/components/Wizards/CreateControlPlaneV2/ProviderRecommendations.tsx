import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, FlexBox, Icon, Text } from '@ui5/webcomponents-react';
import { useFrontendConfig } from '../../../context/FrontendConfigContext.tsx';
import styles from './ProviderRecommendations.module.css';

interface Recommendation {
  provider: string;
  confidence: number;
  lift: number;
  triggeredBy: string;
}

interface ProviderRecommendationsProps {
  selectedServiceNames: string[];
  onAddService: (providerName: string) => void;
}

// Shortens long provider API group names for display, e.g.
// "vault.crossplane.io" → "vault"
function shortName(name: string): string {
  return name.split('.')[0];
}

export function ProviderRecommendations({ selectedServiceNames, onAddService }: ProviderRecommendationsProps) {
  const { t } = useTranslation();
  const config = useFrontendConfig();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    const dashboardUrl = config.supportDashboardUrl;
    if (!dashboardUrl || selectedServiceNames.length === 0) {
      setRecommendations([]);
      return;
    }

    const params = new URLSearchParams({ providers: selectedServiceNames.join(',') });
    fetch(`${dashboardUrl}/api/recommendations?${params}`)
      .then((res) => (res.ok ? res.json() : { recommendations: [] }))
      .then((data) => setRecommendations(data.recommendations ?? []))
      .catch(() => setRecommendations([]));
  }, [config.supportDashboardUrl, selectedServiceNames.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!config.supportDashboardUrl || recommendations.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <FlexBox alignItems="Center" gap={8} className={styles.header}>
        <Icon name="lightbulb" className={styles.icon} />
        <Text className={styles.title}>{t('ProviderRecommendations.title')}</Text>
      </FlexBox>
      <Text className={styles.subtitle}>{t('ProviderRecommendations.subtitle')}</Text>
      <div className={styles.list}>
        {recommendations.map((rec) => (
          <FlexBox key={rec.provider} alignItems="Center" justifyContent="SpaceBetween" className={styles.row}>
            <FlexBox alignItems="Center" gap={8}>
              <Text className={styles.providerName}>{shortName(rec.provider)}</Text>
              <Text className={styles.confidence}>
                {t('ProviderRecommendations.confidence', {
                  value: Math.round(rec.confidence * 100),
                })}
              </Text>
            </FlexBox>
            <Button
              design="Emphasized"
              onClick={() => onAddService(rec.provider)}
            >
              {t('ProviderRecommendations.addService')}
            </Button>
          </FlexBox>
        ))}
      </div>
    </div>
  );
}
