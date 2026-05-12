# PostToolUse hook: scan the file just written/edited for likely secrets.
# Does NOT block (too many false positives). Emits a system reminder via
# additionalContext so Claude is forced to acknowledge before continuing.

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $data = $raw | ConvertFrom-Json
} catch { exit 0 }

# Resolve the file path from PostToolUse payload.
$path = $null
foreach ($source in @($data.tool_response.filePath, $data.tool_input.file_path, $data.tool_input.path)) {
    if ($source -is [string] -and $source.Length -gt 0) { $path = $source; break }
}
if (-not $path -or -not (Test-Path -LiteralPath $path -PathType Leaf)) { exit 0 }

# Don't scan generated / vendored / binary paths.
$skipPatterns = @('node_modules[\\/]', '\.git[\\/]', 'dist[\\/]', 'build[\\/]', '__generated__', '\.lock$', '\.(png|jpg|jpeg|gif|webp|ico|pdf|zip|tar|gz|woff2?|ttf|eot|mp4|mov)$')
foreach ($skip in $skipPatterns) {
    if ($path -match $skip) { exit 0 }
}

try {
    $content = Get-Content -LiteralPath $path -Raw -ErrorAction Stop
} catch { exit 0 }
if ([string]::IsNullOrEmpty($content)) { exit 0 }

# Secret signatures. Each entry: human label + regex.
$signatures = @(
    @{ name = 'AWS access key (AKIA...)';                pattern = 'AKIA[0-9A-Z]{16}' },
    @{ name = 'AWS secret access key assignment';      pattern = '(?i)aws_secret_access_key\s*[:=]\s*["'']?[A-Za-z0-9/+]{40}["'']?' },
    @{ name = 'OpenAI/Anthropic-style API key (sk-...)'; pattern = 'sk-[A-Za-z0-9]{20,}' },
    @{ name = 'Anthropic API key (sk-ant-...)';          pattern = 'sk-ant-[A-Za-z0-9_-]{20,}' },
    @{ name = 'GitHub personal access token';          pattern = 'ghp_[A-Za-z0-9]{36}' },
    @{ name = 'GitHub OAuth token';                    pattern = 'gho_[A-Za-z0-9]{36}' },
    @{ name = 'GitHub user-to-server token';           pattern = 'ghu_[A-Za-z0-9]{36}' },
    @{ name = 'GitHub server-to-server token';         pattern = 'ghs_[A-Za-z0-9]{36}' },
    @{ name = 'Slack token';                           pattern = 'xox[abprs]-[A-Za-z0-9-]{10,}' },
    @{ name = 'JWT';                                   pattern = 'eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' },
    @{ name = 'PEM private key block';                 pattern = '-----BEGIN (RSA |EC |DSA |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY-----' },
    @{ name = 'hardcoded password assignment';         pattern = '(?i)(password|passwd|pwd)\s*[:=]\s*["''][^"''\s]{6,}["'']' }
)

$findings = New-Object System.Collections.Generic.List[string]
$lines = $content -split "`r?`n"
for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    foreach ($sig in $signatures) {
        if ($line -match $sig.pattern) {
            $findings.Add("  - $($path):$($i + 1) -- $($sig.name)") | Out-Null
            break
        }
    }
    if ($findings.Count -ge 20) { break }
}

if ($findings.Count -eq 0) { exit 0 }

$msg = "Suspected secret(s) in $path -- review before continuing:`n" + ($findings -join "`n") + "`n`nIf this is intentional (test fixture, public sample, etc.), say so. Otherwise: remove the value, rotate the credential if it was real, and consider adding the file to .gitignore."

# Emit JSON so the agent sees this as additional context, not a block.
$payload = @{
    hookSpecificOutput = @{
        hookEventName    = 'PostToolUse'
        additionalContext = $msg
    }
    systemMessage = "Secret-scan hook flagged $($findings.Count) suspected secret(s) in $path"
} | ConvertTo-Json -Compress -Depth 5

Write-Output $payload
exit 0
