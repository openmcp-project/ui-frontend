import AvatarColorScheme from '@ui5/webcomponents/dist/types/AvatarColorScheme.js';

export function generateInitialsForEmail(email: string | undefined): string {
  if (!email) {
    return '';
  }
  const withoutPrefix = email.includes(':') ? email.split(':')[1] : email;
  const [name] = withoutPrefix.split('@');
  const nameParts = name.split('.');
  return nameParts
    .map((part) => part[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();
}

function hashEmail(email: string): number {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const ACCENT_SCHEMES = [
  AvatarColorScheme.Accent1,
  AvatarColorScheme.Accent2,
  AvatarColorScheme.Accent3,
  AvatarColorScheme.Accent4,
  AvatarColorScheme.Accent5,
  AvatarColorScheme.Accent6,
  AvatarColorScheme.Accent7,
  AvatarColorScheme.Accent8,
  AvatarColorScheme.Accent9,
  AvatarColorScheme.Accent10,
] as const;

export function avatarColorSchemeForEmail(email: string | undefined): AvatarColorScheme {
  if (!email) return AvatarColorScheme.Accent6;
  return ACCENT_SCHEMES[hashEmail(email) % ACCENT_SCHEMES.length];
}
