import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, FlexBox, Icon, Text } from '@ui5/webcomponents-react';
import styles from './ProviderRecommendations.module.css';
import { useApiResource } from '../../../lib/api/useApiResource';
import { ConfigMapResource } from '../../../lib/api/types/k8s/listConfigMaps';

interface AssociationRule {
  antecedent: string;
  consequent: string;
  confidence: number;
  lift: number;
}

interface Recommendation {
  provider: string;
  confidence: number;
  lift: number;
  triggeredBy: string;
}

interface ProviderRecommendationsProps {
  selectedServiceNames: string[];
  availableProviderNames: string[];
  onAddService: (providerName: string) => void;
}

// Strips "provider-" prefix for display: "provider-vault" → "vault"
function displayName(name: string): string {
  return name.startsWith('provider-') ? name.slice('provider-'.length) : name;
}

function computeRecommendations(rules: AssociationRule[], selectedProviders: string[]): Recommendation[] {
  const selected = new Set(selectedProviders);
  const best = new Map<string, Recommendation>();

  for (const rule of rules) {
    if (!selected.has(rule.antecedent)) continue;
    if (selected.has(rule.consequent)) continue;

    const existing = best.get(rule.consequent);
    if (!existing || rule.confidence > existing.confidence) {
      best.set(rule.consequent, {
        provider: rule.consequent,
        confidence: rule.confidence,
        lift: rule.lift,
        triggeredBy: rule.antecedent,
      });
    }
  }

  return Array.from(best.values()).sort((a, b) => b.confidence - a.confidence);
}

export function ProviderRecommendations({
  selectedServiceNames,
  availableProviderNames,
  onAddService,
}: ProviderRecommendationsProps) {
  const { t } = useTranslation();
  const available = useMemo(() => new Set(availableProviderNames), [availableProviderNames]);

  const { data: configMap } = useApiResource(
    ConfigMapResource('default', 'provider-recommendation-rules'),
    undefined,
    null,
  );

  const rules = useMemo<AssociationRule[]>(() => {
    const raw = configMap?.data?.['rules.json'];
    if (!raw) return [];
    try {
      return JSON.parse(raw) as AssociationRule[];
    } catch {
      return [];
    }
  }, [configMap]);

  const recommendations = useMemo(
    () => computeRecommendations(rules, selectedServiceNames).filter((r) => available.has(r.provider)),
    [rules, selectedServiceNames, available],
  );

  if (recommendations.length === 0) {
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
              <Text className={styles.providerName}>{displayName(rec.provider)}</Text>
              <Text className={styles.confidence}>
                {t('ProviderRecommendations.confidence', {
                  value: Math.round(rec.confidence * 100),
                })}
              </Text>
            </FlexBox>
            <Button design="Emphasized" onClick={() => onAddService(rec.provider)}>
              {t('ProviderRecommendations.addService')}
            </Button>
          </FlexBox>
        ))}
      </div>
    </div>
  );
}
