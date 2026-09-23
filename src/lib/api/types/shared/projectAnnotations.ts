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
  return {
    [DISPLAY_NAME_ANNOTATION]: params.displayName ?? '',
    [SUPPORT_LANDSCAPE_ANNOTATION]: params.supportLandscape ?? '',
    [SUPPORT_SERVICE_IDS_ANNOTATION]: params.supportServiceIds ?? '',
    [SUPPORT_SECURITY_CONTACTS_ANNOTATION]: params.supportSecurityContacts ?? '',
    [SUPPORT_OPS_CONTACTS_ANNOTATION]: params.supportOpsContacts ?? '',
  };
}
