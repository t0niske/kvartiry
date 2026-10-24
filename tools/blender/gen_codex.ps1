# Generates images through the Codex app (ChatGPT subscription, built-in image_gen tool).
# Usage:
#   powershell -ExecutionPolicy Bypass -File gen.ps1 -Prompt "..." -OutDir "C:\path" [-Name hero] [-Image ref1.png,ref2.png]
param(
    [Parameter(Mandatory = $true)][string]$Prompt,
    [string]$OutDir = (Get-Location).Path,
    [string]$Name = "image",
    [string[]]$Image = @()
)
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = New-Object System.Text.UTF8Encoding $false  # so non-ASCII prompts reach codex intact

# The Store app path changes with every update, so resolve it each run.
$codex = $null
$pkg = Get-AppxPackage OpenAI.Codex -ErrorAction SilentlyContinue
if ($pkg) { $codex = Join-Path $pkg.InstallLocation "app\resources\codex.exe" }
if (-not $codex -or -not (Test-Path $codex)) {
    $cmd = Get-Command codex -ErrorAction SilentlyContinue
    if ($cmd) { $codex = $cmd.Source } else { throw "Codex not found (neither the Store app nor codex in PATH)." }
}

New-Item -ItemType Directory -Force $OutDir | Out-Null
$OutDir = (Resolve-Path $OutDir).Path

$instruction = @"
Use your built-in image_gen tool to generate the image described below. Do not write or copy any files and do not run shell commands; just generate the image and reply 'done'.
If reference images are attached, use them as described in the request.

Request:
$Prompt
"@

$cliArgs = @("exec", "--skip-git-repo-check", "-s", "read-only", "--json", "-C", $env:TEMP)
foreach ($img in $Image) { $cliArgs += @("-i", (Resolve-Path $img).Path) }
$cliArgs += "-"

$ErrorActionPreference = "Continue"; $events = $instruction | & $codex @cliArgs 2>$null; $ErrorActionPreference = "Stop"
$threadId = $null
foreach ($line in $events) {
    if ($line -match '"type":"thread.started".*"thread_id":"([^"]+)"') { $threadId = $Matches[1] }
    if ($line -match '"type":"(turn.failed|error)"') { Write-Host "Codex error: $line" }
}
if (-not $threadId) { throw "Codex did not start a thread. Output:`n$($events -join "`n")" }

$genDir = Join-Path $env:USERPROFILE ".codex\generated_images\$threadId"
$files = Get-ChildItem $genDir -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime
if (-not $files) { throw "No images were generated (thread $threadId). Output:`n$($events -join "`n")" }

$i = 0
foreach ($f in $files) {
    $suffix = if ($files.Count -gt 1) { "-$($i + 1)" } else { "" }
    $base = "$Name$suffix"
    $dest = Join-Path $OutDir "$base$($f.Extension)"
    $n = 2
    while (Test-Path $dest) { $dest = Join-Path $OutDir "$base-v$n$($f.Extension)"; $n++ }
    Copy-Item $f.FullName $dest
    Write-Output $dest
    $i++
}

