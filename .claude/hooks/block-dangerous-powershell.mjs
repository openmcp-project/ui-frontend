#!/usr/bin/env node
// PreToolUse hook for the PowerShell tool: mirrors block-dangerous-bash.mjs
// with PowerShell-idiomatic patterns.

import { execSync } from 'node:child_process';
import { readStdinJson, deny, allow } from './_io.mjs';

const data = await readStdinJson();
if (!data) allow();

const cmd = data.tool_input?.command;
if (typeof cmd !== 'string' || cmd.trim() === '') allow();

const patterns = [
  { p: /Remove-Item\b[^;|]*-Recurse\b[^;|]*-Force\b[^;|]*\s(~|\/|[A-Z]:[\\/]?|\$HOME)(\s|$|"|'|;|\|)/i, name: 'Remove-Item -Recurse -Force at drive/home root' },
  { p: /Remove-Item\b[^;|]*-Force\b[^;|]*-Recurse\b[^;|]*\s(~|\/|[A-Z]:[\\/]?|\$HOME)(\s|$|"|'|;|\|)/i, name: 'Remove-Item -Force -Recurse at drive/home root' },
  { p: /(^|[\s;|&])(rm|del|rmdir)\b[^;|]*\s(~|\/|[A-Z]:[\\/])(\s|$|"|'|;|\|)/i,                        name: 'rm/del at drive or filesystem root' },
  { p: /Set-ExecutionPolicy\s+[^;|]*Unrestricted/i,                                                    name: 'Set-ExecutionPolicy Unrestricted (process-wide RCE risk)' },
  { p: /Set-ExecutionPolicy\s+[^;|]*Bypass\b[^;|]*-Scope\s+(LocalMachine|CurrentUser)/i,               name: 'Set-ExecutionPolicy Bypass at machine/user scope' },
  { p: /(iex|Invoke-Expression)\s*\(?\s*\(?\s*(Invoke-WebRequest|iwr|Invoke-RestMethod|irm|curl|wget)\b/i, name: 'IEX(IWR/IRM) (remote code execution)' },
  { p: /(Invoke-WebRequest|iwr|Invoke-RestMethod|irm)\b[^;]*\|\s*(iex|Invoke-Expression)\b/i,          name: 'pipe to Invoke-Expression (remote code execution)' },
  { p: /\.env\b[^;|]*\|\s*Set-Clipboard/i,                                                             name: 'copying .env contents to clipboard' },
  { p: /(Get-Content|gc|cat|type)\s+[^|;]*\.env(\s|$|;|\|)/i,                                          name: 'reading .env via Get-Content' },
  { p: />\s*\.env\b/i,                                                                                 name: 'overwriting .env via redirect' },
  { p: />>\s*\.env\b/i,                                                                                name: 'appending to .env via redirect' },
  { p: /git\s+push\s+[^;|]*(--force|-f)\b[^;|]*\b(main|master|prod|production|release)\b/i,            name: 'git push --force to protected branch' },
  { p: /git\s+push\s+[^;|]*\b(main|master|prod|production|release)\b[^;|]*(--force|-f)\b/i,            name: 'git push --force to protected branch' },
  { p: /git\s+reset\s+--hard\s+(?!HEAD(~\d+)?\s*$)/i,                                                  name: 'git reset --hard to a non-HEAD target' },
  { p: /git\s+commit\b[^;|]*--no-verify\b/i,                                                           name: 'git commit --no-verify' },
  { p: /git\s+push\b[^;|]*--no-verify\b/i,                                                             name: 'git push --no-verify' },
];

for (const { p, name } of patterns) {
  if (p.test(cmd)) {
    deny(
      `blocked by security hook: ${name}. Pattern matched: ${p}. ` +
      `Reword the command, or ask the user explicitly to allow this operation.`
    );
  }
}

if (/(^|[\s;|&])git\s+commit\b/i.test(cmd)) {
  let staged = [];
  try {
    const out = execSync('git diff --cached --name-only', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    staged = out.split(/\r?\n/).filter((s) => s.length > 0);
  } catch {
    // ignore
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
        `Unstage with: git restore --staged '${f}'.`
      );
    }
  }
}

allow();
