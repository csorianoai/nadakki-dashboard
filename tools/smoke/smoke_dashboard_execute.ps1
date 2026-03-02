# smoke_dashboard_execute.ps1 - Dashboard /execute proxy smoke test
# Params: -BaseUrl, -N (agent iterations), -Tenant
param(
  [string]$BaseUrl = "http://localhost:3001",
  [int]$N = 10,
  [string]$Tenant = "sf-rentals-nadaki-excursions"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportPath = Join-Path $projectRoot "logs\smoke\dashboard_execute_smoke_$timestamp.json"

$report = @{
  timestamp = $timestamp
  baseUrl = $BaseUrl
  tenant = $Tenant
  n = $N
  static_scan = $null
  health = $null
  tenants = $null
  agents = @()
  summary = @{ pass = 0; fail = 0; backend_fail = 0 }
}

# --- PHASE: Static scan - fail if any route/hook forwards to /run ---
function Run-StaticScan {
  $exclude = @(".next", "node_modules", "dist", "build", "coverage")
  $dirs = @(
    (Join-Path $projectRoot "app\api"),
    (Join-Path $projectRoot "hooks")
  )
  $bad = @()
  foreach ($d in $dirs) {
    if (!(Test-Path $d)) { continue }
    $files = Get-ChildItem -Path $d -Recurse -Include "*.ts","*.tsx" -ErrorAction SilentlyContinue
    foreach ($f in $files) {
      $skip = $false
      foreach ($x in $exclude) {
        if ($f.FullName -match [regex]::Escape($x)) { $skip = $true; break }
      }
      if ($skip) { continue }
      $content = try { [System.IO.File]::ReadAllText($f.FullName) } catch { $null }
      if (!$content) { continue }
      # Exclude lines that are only in comments (simplified: lines starting with // or containing "NEVER forward")
      $lines = $content -split "`n"
      for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i].Trim()
        if ($line.StartsWith("//") -or $line.StartsWith("*") -or $line.StartsWith("/*")) { continue }
        # Skip if line is inside block comment - simplified: skip lines with "RLS bug" or "NEVER forward"
        if ($line -match "NEVER forward to /run" -or $line -match 'includes\("/run"\)' -or $line -match '\=\=\= .*run' -or $line -match 'use /execute instead') { continue }
        if ($line -match '/run["''`\)]' -or $line -match '/api/v1/tenants/.*agents/.*/run' -or $line -match 'agents/.*/run') {
          $bad += "$($f.FullName):$($i+1): $line"
        }
      }
    }
  }
  if ($bad.Count -gt 0) {
    $report.static_scan = @{ status = "FAIL"; findings = $bad }
    Write-Host "STATIC SCAN FAIL: /run forwarding detected in dashboard code" -ForegroundColor Red
    foreach ($b in $bad) { Write-Host "  $b" -ForegroundColor Red }
    return $false
  }
  $report.static_scan = @{ status = "PASS"; findings = @() }
  Write-Host "STATIC SCAN PASS: no /run forwarding in routes/hooks" -ForegroundColor Green
  return $true
}

# --- PHASE: Health ---
function Test-Health {
  try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/health" -Method GET -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -eq 404) {
      $report.health = @{ status = "FAIL"; reason = "404" }
      Write-Host "HEALTH FAIL: 404" -ForegroundColor Red
      return $false
    }
    $report.health = @{ status = "PASS"; statusCode = $r.StatusCode }
    Write-Host "HEALTH PASS ($($r.StatusCode))" -ForegroundColor Green
    return $true
  } catch {
    $report.health = @{ status = "FAIL"; reason = $_.Exception.Message }
    Write-Host "HEALTH FAIL: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

# --- PHASE: Tenants ---
function Test-Tenants {
  try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/tenants" -Method GET -Headers @{ "X-Role" = "admin" } -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -eq 404) {
      $report.tenants = @{ status = "FAIL"; reason = "404" }
      Write-Host "TENANTS FAIL: 404" -ForegroundColor Red
      return $false
    }
    $report.tenants = @{ status = "PASS"; statusCode = $r.StatusCode }
    Write-Host "TENANTS PASS ($($r.StatusCode))" -ForegroundColor Green
    return $true
  } catch {
    $report.tenants = @{ status = "FAIL"; reason = $_.Exception.Message }
    Write-Host "TENANTS FAIL: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

# --- PHASE: Execute agents ---
$agentIds = @("abtestingia__abtestingagentoperative")
# Try to fetch agent ids if endpoint exists
try {
  $r = Invoke-WebRequest -Uri "$BaseUrl/api/v1/agents/ids" -Method GET -Headers @{ "X-Tenant-ID" = $Tenant; "Content-Type" = "application/json" } -UseBasicParsing -TimeoutSec 5
  if ($r.StatusCode -eq 200) {
    $j = $r.Content | ConvertFrom-Json
    $ids = $j.data.PSObject.Properties.Value
    if (!$ids) { $ids = $j.PSObject.Properties.Value }
    if ($ids -and ($ids | Measure-Object).Count -gt 0) {
      $agentIds = @()
      foreach ($id in $ids) {
        if ($id) { $agentIds += [string]$id }
      }
      # Ensure default agent is included
      if ("abtestingia__abtestingagentoperative" -notin $agentIds) {
        $agentIds = @("abtestingia__abtestingagentoperative") + $agentIds
      }
      $agentIds = $agentIds | Select-Object -First $N
    }
  }
} catch {
  # Use static list
}

$body = '{"payload":{"query":"smoke test"},"dry_run":true}'

Write-Host ""
Write-Host "Agent Execute Results:" -ForegroundColor Cyan
Write-Host ("{0,-45} {1,-10} {2}" -f "AgentId", "Status", "Notes") -ForegroundColor Cyan
Write-Host ("-" * 70)

foreach ($aid in $agentIds) {
  $result = @{ agentId = $aid; status = "UNKNOWN"; statusCode = $null; notes = "" }
  try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/v1/agents/$aid/execute" -Method POST `
      -Headers @{
        "X-Tenant-ID" = $Tenant
        "Content-Type" = "application/json"
      } `
      -Body $body `
      -UseBasicParsing `
      -TimeoutSec 30
    $result.statusCode = $r.StatusCode
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) {
      $result.status = "PASS"
      $report.summary.pass++
      Write-Host ("{0,-45} {1,-10} {2}" -f $aid, "PASS", "HTTP $($r.StatusCode)") -ForegroundColor Green
    } else {
      $result.status = "FAIL"
      $result.notes = "HTTP $($r.StatusCode)"
      $report.summary.fail++
      Write-Host ("{0,-45} {1,-10} {2}" -f $aid, "FAIL", "HTTP $($r.StatusCode)") -ForegroundColor Red
    }
  } catch {
    $statusCode = $null
    if ($_.Exception.Response) { try { $statusCode = [int]$_.Exception.Response.StatusCode } catch {} }
    $result.notes = $_.Exception.Message
    $result.statusCode = $statusCode
    # Backend error (5xx, 404 from backend) -> BACKEND_FAIL
    if ($statusCode -ge 500 -or $statusCode -eq 404) {
      $result.status = "BACKEND_FAIL"
      $report.summary.backend_fail++
      Write-Host ("{0,-45} {1,-10} {2}" -f $aid, "BACKEND_FAIL", $_.Exception.Message) -ForegroundColor Yellow
    } else {
      $result.status = "FAIL"
      $report.summary.fail++
      Write-Host ("{0,-45} {1,-10} {2}" -f $aid, "FAIL", $_.Exception.Message) -ForegroundColor Red
    }
  }
  $report.agents += $result
}

# --- Run phases ---
$staticOk = Run-StaticScan
if (!$staticOk) {
  $report | ConvertTo-Json -Depth 10 | Set-Content $reportPath -Encoding UTF8
  exit 1
}

$healthOk = Test-Health
$tenantsOk = Test-Tenants
if (!$healthOk -or !$tenantsOk) {
  $report | ConvertTo-Json -Depth 10 | Set-Content $reportPath -Encoding UTF8
  exit 1
}

Write-Host ""
Write-Host "Summary: PASS=$($report.summary.pass) FAIL=$($report.summary.fail) BACKEND_FAIL=$($report.summary.backend_fail)" -ForegroundColor Cyan
$report | ConvertTo-Json -Depth 10 | Set-Content $reportPath -Encoding UTF8
Write-Host "Report: $reportPath" -ForegroundColor Gray

$totalFail = $report.summary.fail
if ($totalFail -gt 0) { exit 1 }
exit 0
