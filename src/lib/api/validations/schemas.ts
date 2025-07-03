import { z } from 'zod';
import { Member } from '../types/shared/members.ts';
import i18n from '../../../../i18n.ts';
import {
  managedControlPlaneNameRegex,
  projectWorkspaceNameRegex,
} from './regex.ts';

const { t } = i18n;

const member = z.custom<Member>();

export const validationSchemaProjectWorkspace = z.object({
  name: z
    .string()
    .min(1, t('validationErrors.required'))
    .regex(projectWorkspaceNameRegex, t('validationErrors.properFormatting'))
    .max(25, t('validationErrors.max25chars')),
  displayName: z.string().optional(),
  chargingTarget: z.string().optional(),
  chargingTargetType: z.string().optional(),
  members: z.array(member).refine((members) => members?.length > 0),
});
export const validationSchemaCreateManagedControlPlane = z.object({
  name: z
    .string()
    .min(1, t('validationErrors.required'))
    .regex(
      managedControlPlaneNameRegex,
      t('validationErrors.properFormattingLowercase'),
    )
    .max(25, t('validationErrors.max25chars')),
  displayName: z.string().optional(),
  chargingTarget: z.string().optional(),
  chargingTargetType: z.string().optional(),
  members: z.array(member),
});
