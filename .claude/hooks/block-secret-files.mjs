#!/usr/bin/env node
// PreToolUse hook: block Read/Edit/Write/Glob/Grep on secret-bearing paths.

import { readStdinJson, collectPaths, normalizePath, deny, allow } from './_io.mjs';

const data = await readStdinJson();
if (!data) allow();

const paths = collectPaths(data.tool_input);
if (paths.length === 0) allow();

// Whitelist: template/example/sample env files are documentation.
const whitelist = [
  /\.env\.template$/,
  /\.env\.example$/,
  /\.env\.sample$/,
  /\.env\.dist$/,
];

const secretPatterns = [
  { name: '.env file',                pattern: /(^|\/)\.env($|\.[^/]*$)/ },
  { name: 'env file (suffix)',        pattern: /\.env$/ },
  { name: 'secrets/ directory',       pattern: /(^|\/)\.?secrets\// },
  { name: 'credentials/ directory',   pattern: /(^|\/)credentials\// },
  { name: 'PEM/key file',             pattern: /\.(pem|key|p12|pfx|jks|keystore)$/ },
  { name: 'SSH private key',          pattern: /(^|\/)(id_rsa|id_ed25519|id_ecdsa|id_dsa)(\.pub)?$/ },
  { name: '.ssh directory',           pattern: /(^|\/)\.ssh\// },
  { name: '.gnupg directory',         pattern: /(^|\/)\.gnupg\// },
  { name: 'AWS credentials',          pattern: /(^|\/)\.aws\/(credentials|config)$/ },
  { name: 'kubeconfig',               pattern: /(^|\/)(kubeconfig|\.kube\/config)$/ },
  { name: 'GCP service account',      pattern: /(^|\/)service-account[^/]*\.json$/ },
  { name: '.npmrc/.pypirc auth',      pattern: /(^|\/)(\.npmrc|\.pypirc|\.pgpass|\.netrc)$/ },
];

for (const p of paths) {
  const norm = normalizePath(p);
  if (whitelist.some((re) => re.test(norm))) continue;
  for (const sp of secretPatterns) {
    if (sp.pattern.test(norm)) {
      deny(
        `blocked by security hook -- path '${p}' matches secret pattern: ${sp.name}. ` +
        `If intentional, ask the user to add an explicit exception (e.g. via permissions.allow in .claude/settings.local.json) or operate on the file outside Claude Code.`
      );
    }
  }
}

allow();
