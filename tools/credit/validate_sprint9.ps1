<#
.SYNOPSIS
  Sprint 9 validator: Credit API create + narrative + PDFs + demo mode.

.DESCRIPTION
  Aligns with dashboard client in lib/credit-api.ts (FastAPI /api/v2/credit/*).
  Headers: X-Tenant-ID (required), JSON body for POSTs.

.PARAMETER BaseUrl
  Backend root URL (no trailing slash). Default http://localhost:8000

.PARAMETER Tenant
  Tenant id. Falls back to env CREDIT_TENANT_ID or X_TENANT_ID.

.PARAMETER SkipProcess
  If set, skips save_applicant, save_vehicle, and POST .../process (narrative/PDF will usually fail).

.EXAMPLE
  $env:CREDIT_TENANT_ID = "your-tenant"
  .\tools\credit\validate_sprint9.ps1
#>
param(
  [string]$BaseUrl = "http://localhost:8000",
  [string]$Tenant = "",
  [switch]$SkipProcess
)

$ErrorActionPreference = "Continue"
$BaseUrl = $BaseUrl.TrimEnd("/")

if ([string]::IsNullOrWhiteSpace($Tenant)) {
  $Tenant = [environment]::GetEnvironmentVariable("CREDIT_TENANT_ID")
}
if ([string]::IsNullOrWhiteSpace($Tenant)) {
  $Tenant = [environment]::GetEnvironmentVariable("X_TENANT_ID")
}
if ([string]::IsNullOrWhiteSpace($Tenant)) {
  Write-Host "FAIL: Set -Tenant or env CREDIT_TENANT_ID / X_TENANT_ID" -ForegroundColor Red
  exit 1
}

$script:Passed = 0
$script:Failed = 0

function Register-Pass([string]$Name) {
  $script:Passed++
  Write-Host "PASS: $Name" -ForegroundColor Green
}
function Register-Fail([string]$Name, [string]$Reason) {
  $script:Failed++
  Write-Host "FAIL: $Name - $Reason" -ForegroundColor Red
}

function Get-ApplicationIdFromObject($obj) {
  if ($null -eq $obj) { return $null }
  if ($obj -is [hashtable]) {
    if ($obj.ContainsKey("application_id") -and $obj["application_id"]) {
      return [string]$obj["application_id"].Trim()
    }
    if ($obj.ContainsKey("id") -and $obj["id"]) {
      return [string]$obj["id"].Trim()
    }
    return $null
  }
  $names = @()
  try { $names = @($obj.PSObject.Properties | ForEach-Object { $_.Name }) } catch { }
  if ($names.Count -eq 0) {
    try { $names = @($obj.PSObject.Properties.Name) } catch { }
  }
  $id = $null
  if ($names -contains "application_id" -and $null -ne $obj.application_id -and "$($obj.application_id)" -ne "") {
    $id = [string]$obj.application_id
  }
  elseif ($names -contains "id" -and $null -ne $obj.id -and "$($obj.id)" -ne "") {
    $id = [string]$obj.id
  }
  if ($id) { return $id.Trim() }
  return $null
}

function Invoke-JsonPost([string]$Uri, [hashtable]$Headers, [object]$Body) {
  $json = $Body | ConvertTo-Json -Depth 10 -Compress
  return Invoke-RestMethod -Uri $Uri -Method POST -Headers $Headers -Body $json -ContentType "application/json; charset=utf-8"
}

function Invoke-JsonGet([string]$Uri, [hashtable]$Headers) {
  return Invoke-RestMethod -Uri $Uri -Method GET -Headers $Headers
}

function Test-PdfEndpoint([string]$Label, [string]$Uri, [string]$TenantId) {
  try {
    $h = @{
      "Accept"        = "application/pdf"
      "X-Tenant-ID"   = $TenantId
    }
    $resp = Invoke-WebRequest -Uri $Uri -Method GET -Headers $h -UseBasicParsing -TimeoutSec 120
    if ($resp.StatusCode -ne 200) {
      Register-Fail $Label "HTTP $($resp.StatusCode)"
      return
    }
    $len = 0
    if ($resp.RawContentLength) { $len = [int]$resp.RawContentLength }
    elseif ($resp.Content -is [byte[]]) { $len = $resp.Content.Length }
    elseif ($null -ne $resp.Content) { $len = [System.Text.Encoding]::UTF8.GetByteCount([string]$resp.Content) }
    $ct = [string]$resp.Headers["Content-Type"]
    # Real backends may emit compact PDFs (<1KB); reject only obvious non-PDF/empty bodies
    if ($len -lt 500) {
      Register-Fail $Label ('PDF too small (' + $len + ' bytes), expected >= 500')
      return
    }
    if ($ct -notmatch "pdf") {
      Register-Fail $Label ('Content-Type not PDF (' + $ct + ')')
      return
    }
    Register-Pass $Label
  }
  catch {
    Register-Fail $Label $_.Exception.Message
  }
}

function Test-NarrativeObject($n) {
  if ($null -eq $n) { return $false }
  $props = @()
  try { $props = $n.PSObject.Properties.Name }
  catch { }
  $hasDealer = ($props -contains "dealer_narrative")
  $hasBank = ($props -contains "bank_narrative")
  $hasClient = ($props -contains "client_narrative")
  if (-not ($hasDealer -or $hasBank -or $hasClient)) { return $false }
  $d = if ($hasDealer) { [string]$n.dealer_narrative } else { "" }
  $b = if ($hasBank) { [string]$n.bank_narrative } else { "" }
  $c = if ($hasClient) { [string]$n.client_narrative } else { "" }
  # At least one narrative field with substance (avoid empty PASS on empty strings)
  return (($d.Length -gt 10) -or ($b.Length -gt 10) -or ($c.Length -gt 10))
}

Write-Host "=== VALIDATE SPRINT 9 - Credit API ===" -ForegroundColor Cyan
Write-Host "BaseUrl: $BaseUrl"
Write-Host "Tenant:  $Tenant"
Write-Host ""

$headersJson = @{
  "Accept"        = "application/json"
  "X-Tenant-ID"   = $Tenant
}

# --- 1) Create application ---
$applicationId = $null
try {
  $createUri = "$BaseUrl/api/v2/credit/applications"
  $createBody = @{
    application_payload = @{
      mode           = "AI_ONLY"
      applicant_data = @{ }
    }
    initial_state       = "DRAFT"
  }
  $created = Invoke-JsonPost -Uri $createUri -Headers $headersJson -Body $createBody
  $applicationId = Get-ApplicationIdFromObject $created
  if ([string]::IsNullOrWhiteSpace($applicationId)) {
    Register-Fail "create_application" "Response missing application_id/id. Body: $($created | ConvertTo-Json -Compress -Depth 5)"
  }
  else {
    Register-Pass ('create_application id=' + $applicationId)
  }
}
catch {
  $err = $_.Exception.Message
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $err = $_.ErrorDetails.Message }
  Register-Fail "create_application" $err
}

if ([string]::IsNullOrWhiteSpace($applicationId)) {
  Write-Host "`nAbort: no application id - fix create before narrative/PDF." -ForegroundColor Yellow
  Write-Host "=== RESULT: $($script:Passed) PASS / $($script:Failed) FAIL ===" -ForegroundColor $(if ($script:Failed -eq 0) { "Green" } else { "Red" })
  exit $(if ($script:Failed -eq 0) { 0 } else { 1 })
}

# --- 1a) Minimal applicant + vehicle (required by current API before /process) ---
if (-not $SkipProcess) {
  try {
    $appUri = "$BaseUrl/api/v2/credit/applications/$([uri]::EscapeDataString($applicationId))/applicant"
    # Use schema-allowed fields only (current API may reject extended RD keys on this route).
    $applicantBody = @{
      name                = "Sprint9 Validator"
      monthly_income      = 75000
      national_id         = "00100000000"
      employment_status   = "employed"
    }
    $null = Invoke-JsonPost -Uri $appUri -Headers $headersJson -Body $applicantBody
    Register-Pass 'save_applicant (minimal, prerequisite for /process)'
  }
  catch {
    $warn = $_.Exception.Message
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $warn = $_.ErrorDetails.Message }
    Write-Host "WARN: save_applicant failed: $warn" -ForegroundColor DarkYellow
  }
  try {
    $vehUri = "$BaseUrl/api/v2/credit/applications/$([uri]::EscapeDataString($applicationId))/vehicle"
    $vehicleBody = @{
      make                  = "Toyota"
      model                 = "Corolla"
      year                  = 2022
      vin                   = "1HGBH41JXMN109186"
      vehicle_value         = 850000
      loan_amount_requested = 600000
    }
    $null = Invoke-JsonPost -Uri $vehUri -Headers $headersJson -Body $vehicleBody
    Register-Pass 'save_vehicle (minimal, prerequisite for /process)'
  }
  catch {
    $warn = $_.Exception.Message
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $warn = $_.ErrorDetails.Message }
    Write-Host "WARN: save_vehicle failed: $warn" -ForegroundColor DarkYellow
  }
}

# --- 1b) Process (dry_run) so narrative/PDF exist after AI decision ---
if (-not $SkipProcess) {
  try {
    $procUri = "$BaseUrl/api/v2/credit/applications/$([uri]::EscapeDataString($applicationId))/process"
    $procBody = @{ mode = "AI_ONLY"; dry_run = $true }
    $null = Invoke-JsonPost -Uri $procUri -Headers $headersJson -Body $procBody
    Register-Pass 'process_application (dry_run, prerequisite for narrative/PDF)'
  }
  catch {
    $warn = $_.Exception.Message
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $warn = $_.ErrorDetails.Message }
    Write-Host "WARN: process_application skipped or failed: $warn" -ForegroundColor DarkYellow
  }
}

# --- 2) Narrative ---
try {
  $narUri = "$BaseUrl/api/v2/credit/applications/$([uri]::EscapeDataString($applicationId))/narrative"
  $nar = Invoke-JsonGet -Uri $narUri -Headers $headersJson
  if (Test-NarrativeObject $nar) {
    Register-Pass "get_narrative"
  }
  else {
    Register-Fail "get_narrative" "200 but missing or empty dealer/bank/client narrative fields"
  }
}
catch {
  $err = $_.Exception.Message
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $err = $_.ErrorDetails.Message }
  Register-Fail "get_narrative" $err
}

# --- 3) PDFs ---
Test-PdfEndpoint "pdf_application_summary" `
  "$BaseUrl/api/v2/credit/applications/$([uri]::EscapeDataString($applicationId))/pdf/application-summary" `
  $Tenant

Test-PdfEndpoint "pdf_executive_memo" `
  "$BaseUrl/api/v2/credit/applications/$([uri]::EscapeDataString($applicationId))/pdf/executive-memo" `
  $Tenant

# --- 4) Demo load ---
$demoUri = "$BaseUrl/api/v2/credit/demo/load"
$demoBody = @{ case_type = "prime" }
$demoHeaders = @{
  "Accept"       = "application/json"
  "Content-Type" = "application/json; charset=utf-8"
  "X-Tenant-ID"  = $Tenant
}
$demoJson = $demoBody | ConvertTo-Json -Compress
try {
  $demoResult = Invoke-RestMethod -Uri $demoUri -Method POST -Headers $demoHeaders -Body $demoJson -TimeoutSec 60
  $did = Get-ApplicationIdFromObject $demoResult
  if ($did) {
    Register-Pass ('demo_load 200 application_id=' + $did)
  }
  else {
    Register-Fail "demo_load" "200 but no application_id/id in response"
  }
}
catch {
  $code = $null
  try {
    $ex = $_.Exception
    if ($ex.Response) {
      $code = [int]$ex.Response.StatusCode
    }
    elseif ($null -ne $ex.StatusCode) {
      $code = [int]$ex.StatusCode
    }
  }
  catch { }
  if ($null -eq $code -and $_.Exception.Message -match '\b403\b') {
    $code = 403
  }
  if ($code -eq 403) {
    Register-Pass 'demo_load (403 demo disabled / demo_disabled - expected PASS)'
  }
  else {
    $err = $_.Exception.Message
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $err = $_.ErrorDetails.Message }
    Register-Fail "demo_load" $err
  }
}

Write-Host ""
Write-Host "=== RESULT: $($script:Passed) PASS / $($script:Failed) FAIL ===" -ForegroundColor $(if ($script:Failed -eq 0) { "Green" } else { "Red" })
exit $(if ($script:Failed -eq 0) { 0 } else { 1 })
