import { z } from 'zod';
import { Member } from '../types/shared/members.ts';
import i18n from '../../../../i18n.ts';
import { btpChargingTargetRegex, managedControlPlaneNameRegex, projectWorkspaceNameRegex } from './regex.ts';

const { t } = i18n;

const member = z.custom<Member>();

// Shared superRefine helper for charging target validation
function validateChargingTarget<T extends { chargingTargetType?: string; chargingTarget?: string }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  if (data.chargingTargetType && data.chargingTarget && !btpChargingTargetRegex.test(data.chargingTarget ?? '')) {
    ctx.addIssue({
      path: ['chargingTarget'],
      code: z.ZodIssueCode.custom,
      message: t('validationErrors.notValidChargingTargetFormat'),
    });
  } else if (data.chargingTargetType && !data.chargingTarget) {
    ctx.addIssue({
      path: ['chargingTarget'],
      code: z.ZodIssueCode.custom,
      message: t('validationErrors.required'),
    });
  }
}

export const validationSchemaProjectWorkspace = z
  .object({
    name: z
      .string()
      .min(1, t('validationErrors.required'))
      .regex(projectWorkspaceNameRegex, t('validationErrors.properFormatting'))
      .max(25, t('validationErrors.maxChars', { maxLength: 25 })),
    displayName: z.string().optional(),
    chargingTarget: z.string().optional(),
    chargingTargetType: z.string().optional(),
    members: z.array(member).refine((members) => members?.length > 0),
  })
  .superRefine(validateChargingTarget);

export const validationSchemaCreateManagedControlPlane = z
  .object({
    name: z
      .string()
      .min(1, t('validationErrors.required'))
      .regex(managedControlPlaneNameRegex, t('validationErrors.properFormattingLowercase'))
      .max(36, t('validationErrors.maxChars', { maxLength: 36 })),
    displayName: z.string().optional(),
    chargingTarget: z.string().optional(),
    chargingTargetType: z.string().optional(),
    members: z.array(member),
  })
  .superRefine(validateChargingTarget);
