import { z } from 'zod';
import type { TFunction } from 'i18next';

export function createComponentInstallSchema(t: TFunction) {
  return z.object({
    version: z.string().min(1, t('ComponentsSelection.chooseVersion')),
  });
}

export type ComponentInstallFormValues = z.infer<ReturnType<typeof createComponentInstallSchema>>;
