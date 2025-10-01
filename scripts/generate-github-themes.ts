/* Script to generate GitHub Light/Dark Default Monaco theme JSON files locally.
 * It uses the generator from github-vscode-theme (CJS) and writes to src/lib/themes.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Use CJS module via dynamic import; this path is resolvable in Node (not via Vite bundler)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const getThemeModule = await import('github-vscode-theme/src/theme.js');

// Interop for CJS default export
const getTheme: (args: { theme: 'light' | 'dark' | string; name: string }) => any =
  // @ts-expect-error - cjs interop
  getThemeModule.default || getThemeModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const outDir = resolve(__dirname, '../src/lib/themes');
  await mkdir(outDir, { recursive: true });

  const light = getTheme({ theme: 'light', name: 'GitHub Light Default' });
  const dark = getTheme({ theme: 'dark', name: 'GitHub Dark Default' });

  await writeFile(resolve(outDir, 'github-light-default.json'), JSON.stringify(light, null, 2), 'utf-8');
  await writeFile(resolve(outDir, 'github-dark-default.json'), JSON.stringify(dark, null, 2), 'utf-8');

  // eslint-disable-next-line no-console
  console.log('Generated themes at', outDir);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate themes:', err);
  process.exitCode = 1;
});
