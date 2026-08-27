import { readFileSync, writeFileSync } from "node:fs";
import { join } from 'node:path';

export function injectDynatraceTag(scriptUrl: string): void {
  const indexPath = join(process.cwd(), 'dist/client/index.html');
  console.log(`[Dynatrace] Injecting "${scriptUrl}" into "${indexPath}".`);

  let html: string;
  try {
    html = readFileSync(indexPath, 'utf-8');
  } catch (err) {
    console.error(`[Dynatrace] Failed to read ${indexPath}.`, err);
    return;
  }

  if (html.includes(scriptUrl)) {
    console.log('[Dynatrace] Script already present, skipping.');
    return;
  }

  const scriptTag =
    `<script type="text/javascript" src="${scriptUrl}" crossorigin="anonymous"></script>`;

  // Inject right before closing </head> tag (case-insensitive)
  const headClose = /<\/head>/i;
  if (!headClose.test(html)) {
    console.error('[Dynatrace] </head> tag not found, aborting.');
    return;
  }
  html = html.replace(headClose, `  ${scriptTag}\n</head>`);

  writeFileSync(indexPath, html, 'utf-8');
  console.log('[Dynatrace] Script injected successfully.');
}
