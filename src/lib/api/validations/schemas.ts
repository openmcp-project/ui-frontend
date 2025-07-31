import { z } from 'zod';
import { Member } from '../types/shared/members.ts';
import { TFunction } from 'i18next';
import { btpChargingTargetRegex, managedControlPlaneNameRegex, projectWorkspaceNameRegex } from './regex.ts';

const member = z.custom<Member>();

// Shared superRefine helper for charging target validation
function createValidateChargingTarget<T extends { chargingTargetType?: string; chargingTarget?: string }>(
  t: TFunction,
) {
  return (data: T, ctx: z.RefinementCtx) => {
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
  };
}

export function createProjectWorkspaceSchema(t: TFunction) {
  return z
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
    .superRefine(createValidateChargingTarget(t));
}

export function createManagedControlPlaneSchema(t: TFunction) {
  return z
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
    .superRefine(createValidateChargingTarget(t));
}
