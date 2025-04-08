export function shortenCommitHash(commitHash: string): string {
  const match = commitHash.match(/^([a-zA-Z0-9-_]+)@sha1:([a-f0-9]{40})/);

  if (match && match[2]) {
    return `${match[1]}@${match[2].slice(0, 7)}`;
  }

  return commitHash;
}
