import { readFileSync, writeFileSync } from "node:fs";
import { join } from 'node:path';
import { logger } from '../../logger.js';

const log = logger.child({ component: 'dynatrace' });

export function injectDynatraceTag(scriptUrl: string): void {
  const indexPath = join(process.cwd(), 'dist/client/index.html');
  log.info({ scriptUrl, indexPath }, 'Injecting Dynatrace script');

  let html: string;
  try {
    html = readFileSync(indexPath, 'utf-8');
  } catch (err) {
    log.error({ err, indexPath }, 'Failed to read index.html');
    return;
  }

  if (html.includes(scriptUrl)) {
    log.debug('Script already present, skipping');
    return;
  }

  const scriptTag =
    `<script type="text/javascript" src="${scriptUrl}" crossorigin="anonymous"></script>`;

  // Inject right before closing </head> tag (case-insensitive)
  const headClose = /<\/head>/i;
  if (!headClose.test(html)) {
    log.error('</head> tag not found, aborting');
    return;
  }
  html = html.replace(headClose, `  ${scriptTag}\n</head>`);

  writeFileSync(indexPath, html, 'utf-8');
  log.info('Script injected successfully');
}
