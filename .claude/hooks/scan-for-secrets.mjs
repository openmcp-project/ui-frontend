#!/usr/bin/env node
// PostToolUse hook: scan the file just written/edited for likely secrets.
// Does NOT block (too many false positives). Emits additionalContext so
// Claude is forced to acknowledge before continuing.

import { readFileSync, statSync } from 'node:fs';
import { readStdinJson } from './_io.mjs';

const data = await readStdinJson();
if (!data) process.exit(0);

const candidates = [
  data.tool_response?.filePath,
  data.tool_input?.file_path,
  data.tool_input?.path,
];
const path = candidates.find((v) => typeof v === 'string' && v.length > 0);
if (!path) process.exit(0);

try {
  if (!statSync(path).isFile()) process.exit(0);
} catch {
  process.exit(0);
}

// Don't scan generated / vendored / binary paths.
const skipPatterns = [
  /node_modules[\\/]/,
  /\.git[\\/]/,
  /dist[\\/]/,
  /build[\\/]/,
  /__generated__/,
  /\.lock$/,
  /\.(png|jpg|jpeg|gif|webp|ico|pdf|zip|tar|gz|woff2?|ttf|eot|mp4|mov)$/i,
];
if (skipPatterns.some((re) => re.test(path))) process.exit(0);

let content;
try {
  content = readFileSync(path, 'utf8');
} catch {
  process.exit(0);
}
if (!content) process.exit(0);

const signatures = [
  { name: 'AWS access key (AKIA...)',                pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'AWS secret access key assignment',        pattern: /aws_secret_access_key\s*[:=]\s*["']?[A-Za-z0-9/+]{40}["']?/i },
  { name: 'OpenAI/Anthropic-style API key (sk-...)', pattern: /sk-[A-Za-z0-9]{20,}/ },
  { name: 'Anthropic API key (sk-ant-...)',          pattern: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: 'GitHub personal access token',            pattern: /ghp_[A-Za-z0-9]{36}/ },
  { name: 'GitHub OAuth token',                      pattern: /gho_[A-Za-z0-9]{36}/ },
  { name: 'GitHub user-to-server token',             pattern: /ghu_[A-Za-z0-9]{36}/ },
  { name: 'GitHub server-to-server token',           pattern: /ghs_[A-Za-z0-9]{36}/ },
  { name: 'Slack token',                             pattern: /xox[abprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'JWT',                                     pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
  { name: 'PEM private key block',                   pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY-----/ },
  { name: 'hardcoded password assignment',           pattern: /(password|passwd|pwd)\s*[:=]\s*["'][^"'\s]{6,}["']/i },
];

const findings = [];
const lines = content.split(/\r?\n/);
for (let i = 0; i < lines.length && findings.length < 20; i++) {
  for (const sig of signatures) {
    if (sig.pattern.test(lines[i])) {
      findings.push(`  - ${path}:${i + 1} -- ${sig.name}`);
      break;
    }
  }
}

if (findings.length === 0) process.exit(0);

const msg =
  `Suspected secret(s) in ${path} -- review before continuing:\n` +
  findings.join('\n') +
  `\n\nIf this is intentional (test fixture, public sample, etc.), say so. ` +
  `Otherwise: remove the value, rotate the credential if it was real, and consider adding the file to .gitignore.`;

const payload = {
  hookSpecificOutput: {
    hookEventName: 'PostToolUse',
    additionalContext: msg,
  },
  systemMessage: `Secret-scan hook flagged ${findings.length} suspected secret(s) in ${path}`,
};

process.stdout.write(JSON.stringify(payload));
process.exit(0);
