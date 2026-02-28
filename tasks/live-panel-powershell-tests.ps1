# Live Panel - PowerShell Verification Script
# Run against production backend: https://nadakki-ai-suite.onrender.com
# Requires: Invoke-RestMethod (built-in)

$Base = "https://nadakki-ai-suite.onrender.com"
$TenantId = "sf-rentals-nadaki-excursions"  # or credicefi, sfrentals
$AgentId = "abtestingia__abtestingagentoperative"

Write-Host "=== 1. List Tenants (X-Role: admin) ===" -ForegroundColor Cyan
try {
  $h = @{
    "Content-Type" = "application/json"
    "X-Role" = "admin"
    "X-Tenant-ID" = $TenantId
  }
  $r = Invoke-RestMethod -Uri "$Base/api/v1/tenants" -Method Get -Headers $h
  $tenants = if ($r.tenants) { $r.tenants } elseif ($r.data.tenants) { $r.data.tenants } else { @($r) }
  Write-Host "Tenants loaded: $($tenants.Count)" -ForegroundColor Green
  $tenants | ForEach-Object { $s = $_.slug; if (-not $s) { $s = $_.tenant_id }; if (-not $s) { $s = $_.name }; Write-Host "  - $s" }
} catch {
  Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== 2. Get Executable Agent IDs ===" -ForegroundColor Cyan
try {
  $h = @{
    "Content-Type" = "application/json"
    "X-Tenant-ID" = $TenantId
  }
  $r = Invoke-RestMethod -Uri "$Base/api/v1/agents/ids" -Method Get -Headers $h
  $map = if ($r.data) { $r.data } else { $r }
  $ids = @($map.PSObject.Properties)
  Write-Host "Agents loaded: $($ids.Count)" -ForegroundColor Green
  $ids | Select-Object -First 5 | ForEach-Object { Write-Host "  - $($_.Name): $($_.Value)" }
} catch {
  Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== 3. Start Agent Run (dry_run) ===" -ForegroundColor Cyan
try {
  $body = @{
    mode = "dry_run"
    input = @{ query = "smoke test" }
    payload = @{ query = "smoke test" }
    priority = 5
    tags = @()
    triggered_by = "manual"
  } | ConvertTo-Json -Depth 5

  $h = @{
    "Content-Type" = "application/json"
    "X-Tenant-ID" = $TenantId
  }
  $r = Invoke-RestMethod -Uri "$Base/api/v1/tenants/$TenantId/agents/$AgentId/run" `
    -Method Post -Headers $h -Body $body

  Write-Host "Run started: $($r.run_id)" -ForegroundColor Green
  Write-Host "  stream_url: $($r.stream_url)"
  Write-Host "  status: $($r.status)"
} catch {
  Write-Host "Error: $_" -ForegroundColor Red
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.BaseStream.Position = 0
    Write-Host "  Body: $($reader.ReadToEnd())"
  }
}

Write-Host ""
Write-Host "Done. Use these values in the Live Panel: tenant=$TenantId, agent=$AgentId" -ForegroundColor Yellow
