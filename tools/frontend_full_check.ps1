# ============================================================================
# tools/frontend_full_check.ps1 - Nadakki Dashboard Frontend Validation
# ============================================================================
#
# USAGE:
#   powershell -ExecutionPolicy Bypass -File .\tools\frontend_full_check.ps1
#
# OPTIONS (environment variables):
#   $env:BASE_URL    - Dashboard URL (default: https://dashboard.nadakki.com)
#   $env:HEADLESS    - "true" (default) or "false"
#   $env:TIMEOUT_MS  - Timeout in ms (default: 20000)
#
# WHAT IT DOES:
#   1. Verifies repo context and dependencies (Node, npm)
#   2. Installs Playwright if not present
#   3. Installs Chromium browser if not present
#   4. Runs HTTP route availability checks (Level 1)
#   5. Runs Playwright navigation link checks (Level 2)
#   6. Aggregates results into a JSON report
#   7. Exits 0 (all pass) or 1 (any failure)
#
# REPORT OUTPUT:
#   tools/frontend_full_check_report.json
# ============================================================================

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# -- Configuration -----------------------------------------------------------

if ($env:BASE_URL) { $BaseUrl = $env:BASE_URL } else { $BaseUrl = "https://dashboard.nadakki.com" }
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$ReportPath = Join-Path $ScriptDir "frontend_full_check_report.json"
$NavCheckScript = Join-Path $ScriptDir "frontend_nav_check.mjs"
$NavReportPath = Join-Path $ScriptDir "frontend_nav_check_report.json"

# -- Route configuration -----------------------------------------------------

$RouteChecks = @(
    @{ Path = "/marketing/onboarding"; Label = "Marketing Onboarding" },
    @{ Path = "/marketing/whatsapp";   Label = "Marketing WhatsApp" },
    @{ Path = "/marketing/booking";    Label = "Marketing Booking" },
    @{ Path = "/admin/audit";          Label = "Admin Audit" },
    @{ Path = "/admin/readiness";      Label = "Admin Readiness" }
)

# -- Helper functions ---------------------------------------------------------

function Write-Step {
    param([string]$Icon, [string]$Message)
    $ts = (Get-Date).ToString("HH:mm:ss")
    Write-Host "[$ts] $Icon $Message"
}

function Write-Pass {
    param([string]$Message)
    Write-Host "  [PASS] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "  [FAIL] $Message" -ForegroundColor Red
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host ""
}

# -- Verify repo context -----------------------------------------------------

Write-Section "ENVIRONMENT CHECK"

$PackageJson = Join-Path $RepoRoot "package.json"
$NextConfig = Join-Path $RepoRoot "next.config.js"
if (-not (Test-Path $PackageJson)) {
    Write-Step "!!" "ERROR: package.json not found at $RepoRoot"
    Write-Step "!!" "Run from the nadakki-dashboard repo root."
    exit 1
}
if (-not (Test-Path $NextConfig)) {
    Write-Step "!!" "WARNING: next.config.js not found - may not be the dashboard repo"
}
Write-Step "OK" "Repo context verified: $RepoRoot"

# Check Node
try {
    $nodeVersion = & node --version 2>&1
    Write-Step "OK" "Node.js: $nodeVersion"
}
catch {
    Write-Step "!!" "ERROR: Node.js not found. Install from https://nodejs.org/"
    exit 1
}

# Check npm
try {
    $npmVersion = & npm --version 2>&1
    Write-Step "OK" "npm: $npmVersion"
}
catch {
    Write-Step "!!" "ERROR: npm not found."
    exit 1
}

# Check nav check script exists
if (-not (Test-Path $NavCheckScript)) {
    Write-Step "!!" "ERROR: Nav check script not found at $NavCheckScript"
    exit 1
}
Write-Step "OK" "Nav check script: $NavCheckScript"

# -- Install Playwright if needed --------------------------------------------

Write-Section "DEPENDENCY CHECK"

$PlaywrightDir = Join-Path (Join-Path $RepoRoot "node_modules") "playwright"
if (-not (Test-Path $PlaywrightDir)) {
    Write-Step ".." "Installing playwright..."
    Push-Location $RepoRoot
    try {
        & npm install --save-dev playwright 2>&1 | Out-Host
        Write-Step "OK" "Playwright installed"
    }
    catch {
        Write-Step "!!" "ERROR: Failed to install playwright: $_"
        Pop-Location
        exit 1
    }
    Pop-Location
}
else {
    Write-Step "OK" "Playwright package found"
}

# Ensure Chromium browser
Write-Step ".." "Ensuring Chromium browser is installed..."
Push-Location $RepoRoot
try {
    & npx playwright install chromium 2>&1 | Out-Host
    Write-Step "OK" "Chromium browser ready"
}
catch {
    Write-Step "!!" "WARNING: Chromium install issue: $_"
    Write-Step ".." "Continuing - nav check will report browser errors"
}
Pop-Location

# -- Level 1: Route Availability Checks --------------------------------------

Write-Section "LEVEL 1: ROUTE AVAILABILITY"

$routeResults = @()
$totalPass = 0
$totalFail = 0

Write-Step ".." "Checking routes against $BaseUrl ..."
Write-Host ""

foreach ($route in $RouteChecks) {
    $url = $BaseUrl + $route.Path
    $result = @{
        path   = $route.Path
        label  = $route.Label
        status = 0
        ok     = $false
        error  = $null
    }

    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
        $statusCode = $response.StatusCode
        $result.status = $statusCode

        if ($statusCode -ge 200 -and $statusCode -lt 400) {
            $result.ok = $true
            Write-Pass ($route.Label + " (" + $route.Path + ") -> " + $statusCode)
            $totalPass++
        }
        else {
            Write-Fail ($route.Label + " (" + $route.Path + ") -> " + $statusCode)
            $totalFail++
        }
    }
    catch {
        $errMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            try {
                $statusCode = [int]$_.Exception.Response.StatusCode
                $result.status = $statusCode
            }
            catch {
                $statusCode = 0
            }
            Write-Fail ($route.Label + " (" + $route.Path + ") -> " + $statusCode)
        }
        else {
            $result.error = $errMsg
            Write-Fail ($route.Label + " (" + $route.Path + ") -> ERROR: " + $errMsg)
        }
        $totalFail++
    }

    $routeResults += $result
}

Write-Host ""
Write-Step ".." ("Route checks: " + $totalPass + " passed, " + $totalFail + " failed")

# -- Level 2: Navigation Link Checks (Playwright) ----------------------------

Write-Section "LEVEL 2: NAVIGATION LINK CHECKS - Playwright"

$navPass = 0
$navFail = 0
$navReport = $null
$navExitCode = 0

# Set environment for the Node script
$env:BASE_URL = $BaseUrl
$env:REPORT_PATH = $NavReportPath

Write-Step ".." "Running Playwright nav checker..."
Write-Host ""

Push-Location $RepoRoot
try {
    & node $NavCheckScript $BaseUrl 2>&1 | ForEach-Object { Write-Host "  $_" }
    $navExitCode = $LASTEXITCODE
}
catch {
    Write-Step "!!" "Playwright nav checker threw an exception: $_"
    $navExitCode = 2
}
Pop-Location

# Read the nav check report if it exists
if (Test-Path $NavReportPath) {
    try {
        $navReportContent = Get-Content -Path $NavReportPath -Raw -Encoding UTF8
        $navReport = $navReportContent | ConvertFrom-Json

        if ($navReport.summary) {
            $navPass = [int]$navReport.summary.pass
            $navFail = [int]$navReport.summary.fail
        }
    }
    catch {
        Write-Step "!!" "Could not parse nav check report: $_"
        $navFail = 1
    }
}
else {
    Write-Step "!!" "Nav check report not found at $NavReportPath"
    if ($navExitCode -ne 0) {
        $navFail = 1
    }
}

# CRITICAL: If nav script exited non-zero, ensure we count failures.
# Prevents false PASS when nav check fails but summary says PASS.
if ($navExitCode -ne 0 -and $navFail -eq 0) {
    Write-Step "!!" ("Nav checker exited with code " + $navExitCode + " but reported 0 failures - forcing failure")
    $navFail = 1
}

Write-Host ""
Write-Step ".." ("Nav checks: " + $navPass + " passed, " + $navFail + " failed (exit code: " + $navExitCode + ")")

# -- Aggregate Summary -------------------------------------------------------

Write-Section "FINAL SUMMARY"

$grandPass = $totalPass + $navPass
$grandFail = $totalFail + $navFail
$grandTotal = $grandPass + $grandFail

if ($grandFail -eq 0) {
    $overallResult = "ALL PASSED"
    Write-Host ("  RESULT: ALL PASSED -- " + $grandPass + "/" + $grandTotal + " checks") -ForegroundColor Green
}
else {
    $overallResult = "FAILURES DETECTED"
    Write-Host ("  RESULT: FAILURES DETECTED -- " + $grandFail + " failed, " + $grandPass + " passed out of " + $grandTotal) -ForegroundColor Red
}

Write-Host ""
Write-Host ("  Route checks:      " + $totalPass + " pass / " + $totalFail + " fail")
Write-Host ("  Navigation checks: " + $navPass + " pass / " + $navFail + " fail")
Write-Host ("  Total:             " + $grandPass + " pass / " + $grandFail + " fail")
Write-Host ""

# -- Write combined report ---------------------------------------------------

if ($navReport) { $navSection = $navReport } else { $navSection = @{ error = "Nav check did not produce a report" } }

$report = @{
    timestamp  = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    baseUrl    = $BaseUrl
    routes     = $routeResults
    navigation = $navSection
    summary    = @{
        route_pass    = $totalPass
        route_fail    = $totalFail
        nav_pass      = $navPass
        nav_fail      = $navFail
        total_pass    = $grandPass
        total_fail    = $grandFail
        total_checks  = $grandTotal
        result        = $overallResult
    }
}

try {
    $reportJson = $report | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($ReportPath, $reportJson, [System.Text.Encoding]::UTF8)
    Write-Step "OK" "Report written to $ReportPath"
}
catch {
    Write-Step "!!" "Failed to write report: $_"
}

Write-Host ""

# -- Exit --------------------------------------------------------------------

if ($grandFail -gt 0) {
    Write-Step "!!" "Exiting with code 1 - failures detected"
    exit 1
}
else {
    Write-Step "OK" "Exiting with code 0 - all checks passed"
    exit 0
}
