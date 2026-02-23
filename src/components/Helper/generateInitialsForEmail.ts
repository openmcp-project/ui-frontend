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
