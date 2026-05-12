# PreToolUse hook for the PowerShell tool. Mirrors block-dangerous-bash.ps1
# with PowerShell-idiomatic patterns. Exit 2 + stderr to deny.

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $data = $raw | ConvertFrom-Json
} catch { exit 0 }

$cmd = $data.tool_input.command
if ([string]::IsNullOrWhiteSpace($cmd)) { exit 0 }

$patterns = @(
    @{ p = 'Remove-Item\b[^;|]*-Recurse\b[^;|]*-Force\b[^;|]*\s(~|/|[A-Z]:[\\/]?|\$HOME)(\s|$|"|''|;|\|)'; name = 'Remove-Item -Recurse -Force at drive/home root' },
    @{ p = 'Remove-Item\b[^;|]*-Force\b[^;|]*-Recurse\b[^;|]*\s(~|/|[A-Z]:[\\/]?|\$HOME)(\s|$|"|''|;|\|)'; name = 'Remove-Item -Force -Recurse at drive/home root' },
    @{ p = '(^|[\s;|&])(rm|del|rmdir)\b[^;|]*\s(~|/|[A-Z]:[\\/])(\s|$|"|''|;|\|)';                         name = 'rm/del at drive or filesystem root' },
    @{ p = 'Set-ExecutionPolicy\s+[^;|]*Unrestricted';                                                        name = 'Set-ExecutionPolicy Unrestricted (process-wide RCE risk)' },
    @{ p = 'Set-ExecutionPolicy\s+[^;|]*Bypass\b[^;|]*-Scope\s+(LocalMachine|CurrentUser)';                   name = 'Set-ExecutionPolicy Bypass at machine/user scope' },
    @{ p = '(iex|Invoke-Expression)\s*\(?\s*\(?\s*(Invoke-WebRequest|iwr|Invoke-RestMethod|irm|curl|wget)\b'; name = 'IEX(IWR/IRM) (remote code execution)' },
    @{ p = '(Invoke-WebRequest|iwr|Invoke-RestMethod|irm)\b[^;]*\|\s*(iex|Invoke-Expression)\b';              name = 'pipe to Invoke-Expression (remote code execution)' },
    @{ p = '\.env\b[^;|]*\|\s*Set-Clipboard';                                                                 name = 'copying .env contents to clipboard' },
    @{ p = '(Get-Content|gc|cat|type)\s+[^|;]*\.env(\s|$|;|\|)';                                              name = 'reading .env via Get-Content' },
    @{ p = '>\s*\.env\b';                                                                                     name = 'overwriting .env via redirect' },
    @{ p = '>>\s*\.env\b';                                                                                    name = 'appending to .env via redirect' },
    @{ p = 'git\s+push\s+[^;|]*(--force|-f)\b[^;|]*\b(main|master|prod|production|release)\b';                name = 'git push --force to protected branch' },
    @{ p = 'git\s+push\s+[^;|]*\b(main|master|prod|production|release)\b[^;|]*(--force|-f)\b';                name = 'git push --force to protected branch' },
    @{ p = 'git\s+reset\s+--hard\s+(?!HEAD(~\d+)?\s*$)';                                                      name = 'git reset --hard to a non-HEAD target' },
    @{ p = 'git\s+commit\b[^;|]*--no-verify\b';                                                               name = 'git commit --no-verify' },
    @{ p = 'git\s+push\b[^;|]*--no-verify\b';                                                                 name = 'git push --no-verify' }
)

foreach ($entry in $patterns) {
    if ($cmd -imatch $entry.p) {
        [Console]::Error.WriteLine("blocked by security hook: $($entry.name). Pattern matched: /$($entry.p)/. Reword the command, or ask the user explicitly to allow this operation.")
        exit 2
    }
}

# Staged-secrets check for git commit.
if ($cmd -imatch '(^|[\s;|&])git\s+commit\b') {
    try {
        $staged = & git diff --cached --name-only 2>$null
        if ($LASTEXITCODE -eq 0 -and $staged) {
            foreach ($f in $staged) {
                $nf = ($f -replace '\\','/').Trim()
                if ($nf -match '\.env\.(template|example|sample|dist)$') { continue }
                if ($nf -match '(^|/)\.env($|\.[^/]*$)' -or
                    $nf -match '\.env$' -or
                    $nf -match '\.(pem|key|p12|pfx)$' -or
                    $nf -match '(^|/)(id_rsa|id_ed25519|id_ecdsa)(\.pub)?$') {
                    [Console]::Error.WriteLine("blocked by security hook: git commit has staged secret-bearing file '$f'. Unstage with: git restore --staged '$f'.")
                    exit 2
                }
            }
        }
    } catch { }
}

exit 0
