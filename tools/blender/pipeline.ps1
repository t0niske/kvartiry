# Wait for each final Blender render, then send it to Codex (max 3 jobs at once). Log to ..\photo2\pipeline.log
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$final = Join-Path $here "..\final"; $out = Join-Path $here "..\photo2"; New-Item -ItemType Directory -Force $out | Out-Null
$log = Join-Path $out "pipeline.log"
$keys = @()
foreach ($c in 'rekord', 'samolet7', 'reed', 'park3') { foreach ($v in 'aerial', 'yard', 'street') { $keys += "$($c)_$v" } }
foreach ($f in 'turn', 'dev', 'rough') { foreach ($r in 'living', 'bed', 'bath', 'hall') { $keys += "apt_$($f)_$r" } }
$jobs = @()
foreach ($k in $keys) {
  $png = Join-Path $final "$k.png"
  while (-not (Test-Path $png)) { Start-Sleep 20 }
  $s1 = -1; while ($true) { $s2 = (Get-Item $png).Length; if ($s2 -eq $s1 -and $s2 -gt 0) { break }; $s1 = $s2; Start-Sleep 5 }
  if (Test-Path (Join-Path $out "$k.png")) { Add-Content $log "$k skip (exists)"; continue }
  while (@($jobs | Where-Object { $_.State -eq 'Running' }).Count -ge 3) { Start-Sleep 5 }
  Add-Content $log "$k start $(Get-Date -Format T)"
  $jobs += Start-Job -Name $k { param($h, $k, $log)
    Set-Location $h; $r = & (Join-Path $h 'codex2.ps1') -Key $k 2>&1; Add-Content $log "$k done $(Get-Date -Format T): $($r -join ' | ')" } -ArgumentList $here, $k, $log
}
$jobs | Wait-Job | Out-Null
Add-Content $log "ALL DONE $(Get-Date -Format T)"
