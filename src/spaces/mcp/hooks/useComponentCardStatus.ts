import { useMemo } from 'react';
import { parse } from 'yaml';
import { z } from 'zod';

import type { ControlPlaneStatusCondition } from '../../../lib/api/types/crate/controlPlanes.ts';
import { Resource } from '../../../utils/removeManagedFieldsAndFilterData.ts';
import { ComponentCardV2Status } from '../components/ComponentCard/ComponentCardV2.tsx';

export interface UseComponentCardStatusYamlResult {
  yaml: string | null;
}

const ResourceConditionSchema = z.object({
  type: z.string(),
  status: z.string(),
  reason: z.string().catch(''),
  message: z.string().catch(''),
  lastTransitionTime: z.string().catch(''),
});

const ResourceStatusSchema = z.object({
  phase: z.string().nullish(),
  conditions: z.array(ResourceConditionSchema.nullable()).nullish(),
});

export function useComponentCardStatus(isInstalled: boolean, yamlResult: UseComponentCardStatusYamlResult) {
  const resource = useMemo<Resource | null>(() => {
    if (!yamlResult.yaml) return null;
    try {
      return parse(yamlResult.yaml) as Resource;
    } catch {
      return null;
    }
  }, [yamlResult.yaml]);

  const status = useMemo<ComponentCardV2Status>(() => {
    if (!isInstalled) return { kind: 'uninstalled' };
    const result = ResourceStatusSchema.safeParse(resource?.status);
    const phase = result.success ? (result.data.phase ?? null) : null;
    const conditions: ControlPlaneStatusCondition[] = result.success
      ? (result.data.conditions?.flatMap((condition) => (condition ? [condition] : [])) ?? [])
      : [];
    return { kind: 'installed', phase, conditions };
  }, [isInstalled, resource]);

  return { resource, status };
}
