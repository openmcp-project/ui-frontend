import type { TFunction } from 'i18next';
import {
  SUPPORT_LANDSCAPE_ANNOTATION,
  SUPPORT_LANDSCAPE_VALUES,
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

export type SupportInfoSourceKind = 'Project' | 'Workspace';

export interface SupportInfoSource {
  kind: SupportInfoSourceKind;
  name: string;
}

export interface SupportInfoCandidate extends SupportInfoSource {
  info: SupportInfo;
}

export interface ResolvedSupportInfo {
  info: SupportInfo;
  inheritedFrom?: SupportInfoSource;
}

export function hasSupportInfo(info: SupportInfo | undefined): boolean {
  if (!info) return false;
  return [info.supportLandscape, info.supportServiceIds, info.supportSecurityContacts, info.supportOpsContacts].some(
    (v) => !!v && v.trim() !== '',
  );
}

// Inheritance is whole-block: setting any field on a resource replaces all parent values.
export function resolveSupportInfo(own: SupportInfo, parents: SupportInfoCandidate[]): ResolvedSupportInfo {
  if (hasSupportInfo(own)) return { info: own };
  const parent = parents.find((p) => hasSupportInfo(p.info));
  if (!parent) return { info: own };
  return { info: parent.info, inheritedFrom: { kind: parent.kind, name: parent.name } };
}

/** Set2 color scheme index used by the Purpose Tag throughout the app. */
export function purposeColorScheme(landscape?: string): string {
  switch (landscape) {
    case 'production':
      return '8';
    case 'validation':
      return '6';
    case 'staging':
      return '3';
    case 'testing':
      return '5';
    case 'development':
      return '4';
    case 'experimental':
      return '7';
    default:
      return '10';
  }
}

export function isKnownLandscape(value?: string): value is SupportLandscape {
  return (SUPPORT_LANDSCAPE_VALUES as readonly string[]).includes(value ?? '');
}

/** Translated label for the landscape, or the "please set" placeholder. */
export function purposeLabel(t: TFunction, landscape?: string): string {
  if (!landscape) return t('SupportInfo.pleaseSet');
  const fallback = landscape.charAt(0).toUpperCase() + landscape.slice(1);
  return t(`SupportInfo.landscape.${landscape}`, { defaultValue: fallback });
}
