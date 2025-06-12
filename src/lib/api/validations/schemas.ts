import { z } from 'zod';
import { Member } from '../types/shared/members.ts';
import i18n from '../../../../i18n.ts';

const { t } = i18n;

const member = z.custom<Member>();

export const validationSchemaProjectWorkspace = z.object({
  name: z
    .string()
    .min(1, t('validationErrors.required'))
    .regex(
      /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*$/,
      t('validationErrors.properFormatting'),
    )
    .max(25, t('validationErrors.max25chars')),
  displayName: z.string().optional(),
  chargingTarget: z.string().optional(),
  members: z.array(member).refine((members) => members?.length > 0),
});
export const validationSchemaCreateManagedControlPlane = z.object({
  name: z
    .string()
    .min(1, t('validationErrors.required'))
    .regex(
      /^(?!-)[a-z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/,
      t('validationErrors.properFormattingLowercase'),
    )
    .max(25, t('validationErrors.max25chars')),
  displayName: z.string().optional(),
  chargingTarget: z.string().optional(),
  members: z.array(member),
});
