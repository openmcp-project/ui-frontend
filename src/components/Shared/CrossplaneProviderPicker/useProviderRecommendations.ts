import { useMemo } from 'react';
import { useApiResource } from '../../../lib/api/useApiResource';
import { ConfigMapResource } from '../../../lib/api/types/k8s/listConfigMaps';

interface AssociationRule {
  antecedent: string;
  consequent: string;
  confidence: number;
  lift: number;
}

export interface ProviderRecommendation {
  provider: string;
  score: number;
}

// A consequent is recommended when one of the selected providers is its antecedent and
// the consequent itself is not yet selected. Keeps the highest-confidence rule per provider.
function computeRecommendations(rules: AssociationRule[], selectedProviders: string[]): ProviderRecommendation[] {
  const selected = new Set(selectedProviders);
  const best = new Map<string, number>();

  for (const rule of rules) {
    if (!selected.has(rule.antecedent)) continue;
    if (selected.has(rule.consequent)) continue;
    const existing = best.get(rule.consequent);
    if (existing === undefined || rule.confidence > existing) {
      best.set(rule.consequent, rule.confidence);
    }
  }

  return Array.from(best.entries())
    .map(([provider, score]) => ({ provider, score }))
    .sort((a, b) => b.score - a.score);
}

// Reads the association rules from the ConfigMap and returns the recommended providers for the
// current selection, ranked by score. The ConfigMap lives on the crate cluster (null override),
// so the fetch is disabled unless `enabled` is set — keeps the create flow from firing the request.
export function useProviderRecommendations(
  selectedProviderNames: string[],
  enabled: boolean,
): ProviderRecommendation[] {
  const { data: configMap } = useApiResource(
    ConfigMapResource('default', 'provider-recommendation-rules'),
    undefined,
    null,
    !enabled,
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

  return useMemo(
    () => (enabled ? computeRecommendations(rules, selectedProviderNames) : []),
    [enabled, rules, selectedProviderNames],
  );
}
