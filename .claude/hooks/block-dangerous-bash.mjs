#!/usr/bin/env node
// PreToolUse hook for the Bash tool: block destructive / secret-leaking
// shell patterns and risky git operations.

import { execSync } from 'node:child_process';
import { readStdinJson, deny, allow } from './_io.mjs';

const data = await readStdinJson();
if (!data) allow();

const cmd = data.tool_input?.command;
if (typeof cmd !== 'string' || cmd.trim() === '') allow();

const patterns = [
  { p: /rm\s+-[a-z]*r[a-z]*f[a-z]*\s+(\/|~|\$HOME)/i,                                              name: 'rm -rf on / or ~' },
  { p: /rm\s+-[a-z]*f[a-z]*r[a-z]*\s+(\/|~|\$HOME)/i,                                              name: 'rm -fr on / or ~' },
  { p: /rm\s+-[a-z]*r[a-z]*f[a-z]*\s+\*/i,                                                         name: 'rm -rf *' },
  { p: /chmod\s+-?R?\s*777/i,                                                                      name: 'chmod 777 (world-writable)' },
  { p: /curl\s+[^|;&]*\|\s*(ba)?sh\b/i,                                                            name: 'curl | sh (remote code execution)' },
  { p: /wget\s+[^|;&]*\|\s*(ba)?sh\b/i,                                                            name: 'wget | sh (remote code execution)' },
  { p: /git\s+push\s+[^;&|]*(--force|-f)\b[^;&|]*\b(main|master|prod|production|release)\b/i,      name: 'git push --force to protected branch' },
  { p: /git\s+push\s+[^;&|]*\b(main|master|prod|production|release)\b[^;&|]*(--force|-f)\b/i,      name: 'git push --force to protected branch' },
  { p: /git\s+reset\s+--hard\s+(?!HEAD(~\d+)?\s*$)/i,                                              name: 'git reset --hard to a non-HEAD target' },
  { p: /git\s+clean\s+-[fdxFDX]+\s+\//i,                                                           name: 'git clean from filesystem root' },
  { p: /git\s+commit\b[^;&|]*--no-verify\b/i,                                                      name: 'git commit --no-verify (bypasses pre-commit hooks)' },
  { p: /git\s+push\b[^;&|]*--no-verify\b/i,                                                        name: 'git push --no-verify' },
  { p: />\s*\.env\b/i,                                                                             name: 'overwriting .env via redirect' },
  { p: />>\s*\.env\b/i,                                                                            name: 'appending to .env via redirect' },
  { p: /(^|[\s;|&])cat\s+[^|;&]*\.env(\s|$|[|;&])/i,                                               name: 'cat of .env file (potential secret leak)' },
  { p: /(^|[\s;|&])(type|Get-Content)\s+[^|;&]*\.env/i,                                            name: 'reading .env via type/Get-Content' },
];

for (const { p, name } of patterns) {
  if (p.test(cmd)) {
    deny(
      `blocked by security hook: ${name}. Pattern matched: ${p}. ` +
      `Reword the command, or ask the user explicitly to allow this operation.`
    );
  }
}

// Extra check for `git commit` with staged .env / private key files.
if (/^\s*git\s+commit\b/i.test(cmd)) {
  let staged = [];
  try {
    const out = execSync('git diff --cached --name-only', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    staged = out.split(/\r?\n/).filter((s) => s.length > 0);
  } catch {
    // No git or other error -- fall through and allow.
  }
  for (const f of staged) {
    const nf = f.replace(/\\/g, '/').trim();
    if (/\.env\.(template|example|sample|dist)$/.test(nf)) continue;
    if (
      /(^|\/)\.env($|\.[^/]*$)/.test(nf) ||
      /\.env$/.test(nf) ||
      /\.(pem|key|p12|pfx)$/.test(nf) ||
      /(^|\/)(id_rsa|id_ed25519|id_ecdsa)(\.pub)?$/.test(nf)
    ) {
      deny(
        `blocked by security hook: git commit has staged secret-bearing file '${f}'. ` +
        `Unstage it (git restore --staged '${f}') or rename to .env.template / .env.example if it is documentation.`
      );
    }
  }
}

allow();
