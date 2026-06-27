export function generateInitialsForEmail(email: string | undefined): string {
  if (!email) {
    return '';
  }
  const withoutPrefix = email.includes(':') ? email.split(':')[1] : email;
  const [name] = withoutPrefix.split('@');
  const nameParts = name.split('.');
  // return the first letter of each part of the name up to 3 characters
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

// 20-color curated palette — vibrant pastels with good visual variety
const PALETTE: [string, string][] = [
  // [background, text]
  ['#A8D8EA', '#1a4a5a'],
  ['#AA96DA', '#2e1a5a'],
  ['#FCBAD3', '#5a1a30'],
  ['#B5EAD7', '#1a4a38'],
  ['#FFB7B2', '#5a1a18'],
  ['#C7CEEA', '#1a2a5a'],
  ['#FFDAC1', '#5a3018'],
  ['#E2F0CB', '#2a4a18'],
  ['#F9C6C9', '#5a1a20'],
  ['#B5D5C5', '#1a3a28'],
  ['#9CC5A1', '#1a3a20'],
  ['#ECD5E3', '#3a1a38'],
  ['#A0C4FF', '#1a2a5a'],
  ['#BDB2FF', '#2a1a5a'],
  ['#FFC6FF', '#4a1a5a'],
  ['#CAFFBF', '#1a4a20'],
  ['#FFADAD', '#5a1818'],
  ['#FFD6A5', '#5a3810'],
  ['#D4A5A5', '#4a1a18'],
  ['#9CDCF0', '#1a3a4a'],
];

export function avatarColorsForEmail(email: string | undefined): { background: string; color: string } {
  if (!email) return { background: PALETTE[0][0], color: PALETTE[0][1] };
  const [background, color] = PALETTE[hashEmail(email) % PALETTE.length];
  return { background, color };
}

// Keep pastelColorForEmail as a convenience alias for background-only consumers
export function pastelColorForEmail(email: string | undefined): string {
  return avatarColorsForEmail(email).background;
}
