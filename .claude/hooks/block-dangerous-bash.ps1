# PreToolUse hook for the Bash tool. Blocks destructive/secret-leaking
# bash patterns and risky git operations. Exit 2 + stderr to deny.

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $data = $raw | ConvertFrom-Json
} catch { exit 0 }

$cmd = $data.tool_input.command
if ([string]::IsNullOrWhiteSpace($cmd)) { exit 0 }

# Case-insensitive pattern -> human-readable label.
$patterns = @(
    @{ p = 'rm\s+-[a-z]*r[a-z]*f[a-z]*\s+(/|~|\$HOME)';     name = 'rm -rf on / or ~' },
    @{ p = 'rm\s+-[a-z]*f[a-z]*r[a-z]*\s+(/|~|\$HOME)';     name = 'rm -fr on / or ~' },
    @{ p = 'rm\s+-[a-z]*r[a-z]*f[a-z]*\s+\*';               name = 'rm -rf *' },
    @{ p = 'chmod\s+-?R?\s*777';                            name = 'chmod 777 (world-writable)' },
    @{ p = 'curl\s+[^|;&]*\|\s*(ba)?sh\b';                  name = 'curl | sh (remote code execution)' },
    @{ p = 'wget\s+[^|;&]*\|\s*(ba)?sh\b';                  name = 'wget | sh (remote code execution)' },
    @{ p = 'git\s+push\s+[^;&|]*(--force|-f)\b[^;&|]*\b(main|master|prod|production|release)\b'; name = 'git push --force to protected branch' },
    @{ p = 'git\s+push\s+[^;&|]*\b(main|master|prod|production|release)\b[^;&|]*(--force|-f)\b'; name = 'git push --force to protected branch' },
    @{ p = 'git\s+reset\s+--hard\s+(?!HEAD(~\d+)?\s*$)';    name = 'git reset --hard to a non-HEAD target' },
    @{ p = 'git\s+clean\s+-[fdxFDX]+\s+/';                  name = 'git clean from filesystem root' },
    @{ p = 'git\s+commit\b[^;&|]*--no-verify\b';            name = 'git commit --no-verify (bypasses pre-commit hooks)' },
    @{ p = 'git\s+push\b[^;&|]*--no-verify\b';              name = 'git push --no-verify' },
    @{ p = '>\s*\.env\b';                                   name = 'overwriting .env via redirect' },
    @{ p = '>>\s*\.env\b';                                  name = 'appending to .env via redirect' },
    @{ p = '(^|[\s;|&])cat\s+[^|;&]*\.env(\s|$|[|;&])';     name = 'cat of .env file (potential secret leak)' },
    @{ p = '(^|[\s;|&])(type|Get-Content)\s+[^|;&]*\.env'; name = 'reading .env via type/Get-Content' }
)

foreach ($entry in $patterns) {
    if ($cmd -imatch $entry.p) {
        [Console]::Error.WriteLine("blocked by security hook: $($entry.name). Pattern matched: /$($entry.p)/. Reword the command, or ask the user explicitly to allow this operation.")
        exit 2
    }
}

# Extra check for `git commit` with staged .env / private key files.
if ($cmd -imatch '^\s*git\s+commit\b') {
    try {
        $staged = & git diff --cached --name-only 2>$null
        if ($LASTEXITCODE -eq 0 -and $staged) {
            foreach ($f in $staged) {
                $nf = ($f -replace '\\','/').Trim()
                if ($nf -match '(^|/)\.env($|\.[^/]*$)' -or
                    $nf -match '\.env$' -or
                    $nf -match '\.(pem|key|p12|pfx)$' -or
                    $nf -match '(^|/)(id_rsa|id_ed25519|id_ecdsa)(\.pub)?$') {
                    # whitelist templates
                    if ($nf -match '\.env\.(template|example|sample|dist)$') { continue }
                    [Console]::Error.WriteLine("blocked by security hook: git commit has staged secret-bearing file '$f'. Unstage it (git restore --staged '$f') or rename to .env.template / .env.example if it is documentation.")
                    exit 2
                }
            }
        }
    } catch {
        # If git probe fails, fall through and allow.
    }
}

exit 0
