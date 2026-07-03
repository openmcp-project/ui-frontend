import type { TFunction } from 'i18next';
import {
  SUPPORT_LANDSCAPE_ANNOTATION,
  SUPPORT_OPS_CONTACTS_ANNOTATION,
  SUPPORT_SECURITY_CONTACTS_ANNOTATION,
  SUPPORT_SERVICE_IDS_ANNOTATION,
  SupportLandscape,
} from './api/types/shared/keyNames.ts';

export interface SupportInfo {
  supportLandscape?: string;
  supportServiceIds?: string;
  supportSecurityContacts?: string;
  supportOpsContacts?: string;
}

/** Reads the four support annotations from a project's annotations map. */
export function extractSupportInfo(annotations: Record<string, string> | null | undefined): SupportInfo {
  const a = annotations ?? {};
  return {
    supportLandscape: a[SUPPORT_LANDSCAPE_ANNOTATION] || undefined,
    supportServiceIds: a[SUPPORT_SERVICE_IDS_ANNOTATION] || undefined,
    supportSecurityContacts: a[SUPPORT_SECURITY_CONTACTS_ANNOTATION] || undefined,
    supportOpsContacts: a[SUPPORT_OPS_CONTACTS_ANNOTATION] || undefined,
  };
}

/** Set2 color scheme index used by the Purpose Tag throughout the app. */
export function purposeColorScheme(landscape?: string): string {
  switch (landscape) {
    case 'production':
      return '8';
    case 'validation':
      return '6';
    case 'testing':
      return '5';
    default:
      return '10';
  }
}

export function isKnownLandscape(value?: string): value is SupportLandscape {
  return value === 'production' || value === 'validation' || value === 'testing';
}

/** Translated label for the landscape, or the "please set" placeholder. */
export function purposeLabel(t: TFunction, landscape?: string): string {
  return landscape ? t(`SupportInfo.landscape.${landscape}`, { defaultValue: landscape }) : t('SupportInfo.pleaseSet');
}
