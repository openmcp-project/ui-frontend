import { useMemo } from 'react';
import { parse } from 'yaml';
import { z } from 'zod';

import type { ControlPlaneStatusCondition } from '../../../lib/api/types/crate/controlPlanes.ts';
import { Resource } from '../../../utils/removeManagedFieldsAndFilterData.ts';
import { ComponentCardV2Status } from '../components/ComponentCard/ComponentCardV2.tsx';

export interface UseComponentCardStatusYamlResult {
  yaml: string | null;
  isLoading: boolean;
  error?: unknown;
}

const ResourceConditionSchema = z.object({
  type: z.string(),
  status: z.string(),
  reason: z.string().catch(''),
  message: z.string().catch(''),
  lastTransitionTime: z.string().catch(''),
});

const PhaseSchema = z.string().nullish();
// Each entry is validated independently and dropped (not the whole array) if malformed, so one
// bad condition can't discard an otherwise-valid `phase` parsed alongside it.
const ConditionsSchema = z.array(ResourceConditionSchema.nullable().catch(null)).nullish();

export function useComponentCardStatus(isInstalled: boolean, yamlResult: UseComponentCardStatusYamlResult) {
  const { resource, parseFailed } = useMemo<{ resource: Resource | null; parseFailed: boolean }>(() => {
    if (!yamlResult.yaml) return { resource: null, parseFailed: false };
    try {
      return { resource: parse(yamlResult.yaml) as Resource, parseFailed: false };
    } catch {
      return { resource: null, parseFailed: true };
    }
  }, [yamlResult.yaml]);

  const status = useMemo<ComponentCardV2Status>(() => {
    if (!isInstalled) return { kind: 'uninstalled' };
    // No parsed resource yet: report why (still loading vs. errored) instead of a phase of
    // `null`, so callers don't have to guess and default to looking healthy.
    if (!resource) {
      return {
        kind: 'installed',
        phase: null,
        conditions: [],
        isLoading: yamlResult.isLoading,
        hasError: parseFailed || !!yamlResult.error,
      };
    }
    const phaseResult = PhaseSchema.safeParse(resource.status?.phase);
    const conditionsResult = ConditionsSchema.safeParse(resource.status?.conditions);
    const phase = phaseResult.success ? (phaseResult.data ?? null) : null;
    const conditions: ControlPlaneStatusCondition[] = conditionsResult.success
      ? (conditionsResult.data?.flatMap((condition) => (condition ? [condition] : [])) ?? [])
      : [];
    return {
      kind: 'installed',
      phase,
      conditions,
      isLoading: false,
      // A malformed `phase` (present but not a string/null) means we genuinely don't know the
      // component's health; a malformed `conditions` entry is already tolerated per-entry above
      // and shouldn't flip this.
      hasError: !phaseResult.success,
    };
  }, [isInstalled, resource, parseFailed, yamlResult.isLoading, yamlResult.error]);

  return { resource, status };
}
