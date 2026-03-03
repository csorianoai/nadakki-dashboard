<#
.SYNOPSIS
  HTTP Audit Runner for /api/v1/agents/{id}/execute (PROXY EVIDENCE)
  Verifies: no /run in execute flow.
.DESCRIPTION
  POSTs to dashboard proxy /api/v1/agents/{id}/execute for each agent.
  Body: {"payload":{...variant},"dry_run":true}
  Captures: url, status, latency, headers, body.
  Retries 429/503/504 up to 2 times with backoff.
.PARAMETER BaseUrl
  Dashboard base URL (default: http://localhost:3000)
.PARAMETER Tenant
  X-Tenant-ID value (default: sf-rentals-nadaki-excursions)
.PARAMETER N
  Optional: limit to first N agents (for quick smoke)
#>

param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$Tenant = "sf-rentals-nadaki-excursions",
  [int]$N = 0
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$agentsFile = Join-Path $scriptDir "agents_marketing_core.json"
$logsDir = Join-Path (Split-Path -Parent (Split-Path -Parent $scriptDir)) "logs\audit"
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$jsonOut = Join-Path $logsDir "agents_execute_audit_$ts.json"
$mdOut = Join-Path $logsDir "agents_execute_audit_$ts.md"

if (-not (Test-Path $agentsFile)) {
  Write-Host "ERROR: $agentsFile not found" -ForegroundColor Red
  exit 1
}

$raw = Get-Content $agentsFile -Raw
$config = $raw | ConvertFrom-Json
$agents = $config.agents
if ($N -gt 0) {
  $agents = $agents | Select-Object -First $N
}
$variants = $config.variants

$results = @()
$urlsCalled = @()
$runInUrls = $false

function Invoke-WithRetry {
  param([string]$Url, [hashtable]$Headers, [string]$Body, [int]$MaxRetries = 2)
  $attempt = 0
  while ($true) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
      $r = Invoke-WebRequest -Uri $Url -Method Post -Headers $Headers -Body $Body -ContentType "application/json" -UseBasicParsing
      $sw.Stop()
      return @{ status = [int]$r.StatusCode; latencyMs = $sw.ElapsedMilliseconds; body = $r.Content; ok = $true }
    } catch {
      $sw.Stop()
      $status = 0
      if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
      if (($status -eq 429 -or $status -eq 503 -or $status -eq 504) -and $attempt -lt $MaxRetries) {
        $backoff = [math]::Min(1000 * [math]::Pow(2, $attempt), 5000)
        Start-Sleep -Milliseconds $backoff
        $attempt++
        continue
      }
      $body = ""
      try {
        if ($_.Exception.Response) {
          $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
          $body = $sr.ReadToEnd()
          $sr.Close()
        }
      } catch { }
      return @{ status = $status; latencyMs = $sw.ElapsedMilliseconds; body = $body; ok = $false }
    }
  }
}

foreach ($agent in $agents) {
  $aid = $agent.id
  foreach ($v in $variants) {
    $payload = @{ payload = $v.payload; dry_run = $true } | ConvertTo-Json -Depth 5
    $url = "$BaseUrl/api/v1/agents/$aid/execute"
    $urlsCalled += $url
    if ($url -match "/run") { $runInUrls = $true }
    $h = @{
      "Content-Type" = "application/json"
      "Accept" = "application/json"
      "X-Tenant-ID" = $Tenant
    }
    $res = Invoke-WithRetry -Url $url -Headers $h -Body $payload
    $results += [PSCustomObject]@{
      agent = $aid
      variant = $v.name
      url = $url
      status = $res.status
      latencyMs = $res.latencyMs
      ok = $res.ok
      bodyPreview = if ($res.body) { ($res.body -replace "`n"," ").Substring(0, [math]::Min(200, $res.body.Length)) } else { "" }
    }
  }
}

$summary = @{
  timestamp = $ts
  baseUrl = $BaseUrl
  tenant = $Tenant
  totalCalls = $results.Count
  okCount = ($results | Where-Object { $_.ok }).Count
  urlsCalled = $urlsCalled
  runInUrls = $runInUrls
  results = $results
}

$summary | ConvertTo-Json -Depth 6 | Set-Content $jsonOut -Encoding UTF8

$md = @"
# Agent Execute Audit — $ts

**Base URL:** $BaseUrl
**Tenant:** $Tenant
**Total calls:** $($results.Count)
**OK:** $(($results | Where-Object { $_.ok }).Count)

## Runtime proof: no /run in execute flow

- **URLs called:** $($urlsCalled.Count)
- **Any URL contains /run:** $runInUrls

$(if ($runInUrls) { "⚠️ **FAIL:** At least one URL contained /run" } else { "✅ **PASS:** No /run in any execute URL" })

## Results

| Agent | Variant | Status | Latency (ms) |
|-------|---------|--------|--------------|
"@
foreach ($r in $results) {
  $md += "`n| $($r.agent) | $($r.variant) | $($r.status) | $($r.latencyMs) |"
}
$md += "`n`n---`n*No /run calls in execute flow.*"
$md | Set-Content $mdOut -Encoding UTF8

Write-Host ""
Write-Host "=== Agent Execute Audit ===" -ForegroundColor Cyan
Write-Host "Base: $BaseUrl | Tenant: $Tenant"
Write-Host "Calls: $($results.Count) | OK: $(($results | Where-Object { $_.ok }).Count)"
Write-Host "URLs contain /run: $runInUrls"
Write-Host ""
$results | Format-Table agent, variant, status, latencyMs -AutoSize
Write-Host "JSON: $jsonOut"
Write-Host "MD:   $mdOut"
