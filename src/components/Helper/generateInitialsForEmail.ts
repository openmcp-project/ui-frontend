export function generateInitialsForEmail(email: string | undefined): string {
  if (!email) {
    return '';
  }
  const [name, _] = email.split('@');
  const nameParts = name.split('.');
  // return the first letter of each part of the name up to 3 characters
  return nameParts
    .map((part) => part[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();
}
