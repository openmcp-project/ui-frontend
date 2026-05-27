import { z } from 'zod';
import type { TFunction } from 'i18next';

export function createCrossplaneInstallSchema(t: TFunction) {
  return z.object({
    crossplaneVersion: z.string().min(1, t('ComponentsSelection.chooseVersion')),
    providerStates: z
      .array(
        z.object({
          name: z.string(),
          isSelected: z.boolean(),
          selectedVersion: z.string(),
        }),
      )
      .superRefine((providers, ctx) => {
        providers.forEach((p, i) => {
          if (p.isSelected && !p.selectedVersion) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [i, 'selectedVersion'],
              message: t('ComponentsSelection.chooseVersion'),
            });
          }
        });
      }),
  });
}

export type CrossplaneInstallFormValues = z.infer<ReturnType<typeof createCrossplaneInstallSchema>>;
