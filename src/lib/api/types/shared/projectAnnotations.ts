import { Member } from './members';
import {
  DISPLAY_NAME_ANNOTATION,
  SUPPORT_LANDSCAPE_ANNOTATION,
  SUPPORT_OPS_CONTACTS_ANNOTATION,
  SUPPORT_SECURITY_CONTACTS_ANNOTATION,
  SUPPORT_SERVICE_IDS_ANNOTATION,
} from './keyNames';

export interface CreateProjectParams {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
  supportServiceIds?: string;
  supportLandscape?: string;
  supportSecurityContacts?: string;
  supportOpsContacts?: string;
}

export function buildProjectAnnotations(params: CreateProjectParams): Record<string, string> {
  const annotations: Record<string, string> = {
    [DISPLAY_NAME_ANNOTATION]: params.displayName ?? '',
  };
  if (params.supportLandscape) annotations[SUPPORT_LANDSCAPE_ANNOTATION] = params.supportLandscape;
  if (params.supportServiceIds) annotations[SUPPORT_SERVICE_IDS_ANNOTATION] = params.supportServiceIds;
  if (params.supportSecurityContacts) annotations[SUPPORT_SECURITY_CONTACTS_ANNOTATION] = params.supportSecurityContacts;
  if (params.supportOpsContacts) annotations[SUPPORT_OPS_CONTACTS_ANNOTATION] = params.supportOpsContacts;
  return annotations;
}
