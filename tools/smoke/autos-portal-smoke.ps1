# AP-6 Autos Portal production smoke tests (probe-first, no secrets in repo).
param(
    [string]$Backend = "https://nadakki-ai-suite.onrender.com",
    [string]$Frontend = "https://autos.nadakki.com",
    [string]$FrontendFallback = "https://dashboard.nadakki.com",
    [string]$TenantId = "d3b00111-0000-0000-0000-000000d3b001"
)

$ErrorActionPreference = "Stop"
$failures = @()

function Test-HttpStatus {
    param([string]$Label, [string]$Url, [int[]]$Expected = @(200))
    try {
        $resp = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -MaximumRedirection 5
        $code = [int]$resp.StatusCode
        if ($Expected -contains $code) {
            Write-Host "  OK $Label ($code)" -ForegroundColor Green
            return $true
        }
        Write-Host "  FAIL $Label (expected $($Expected -join '/'), got $code)" -ForegroundColor Red
        $script:failures += "$Label => $code"
        return $false
    } catch {
        $code = $null
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode.value__ }
        Write-Host "  FAIL $Label ($code $($_.Exception.Message))" -ForegroundColor Red
        $script:failures += "$Label => $code"
        return $false
    }
}

function Test-JsonEndpoint {
    param([string]$Label, [string]$Url, [hashtable]$Headers = @{}, [string]$Method = "GET", [string]$Body = $null)
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
        }
        if ($Body) { $params.Body = $Body; $params.ContentType = "application/json" }
        $resp = Invoke-WebRequest @params
        if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
            Write-Host "  OK $Label ($($resp.StatusCode))" -ForegroundColor Green
            return $resp.Content
        }
        Write-Host "  FAIL $Label ($($resp.StatusCode))" -ForegroundColor Red
        $script:failures += "$Label => $($resp.StatusCode)"
        return $null
    } catch {
        $code = $null
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode.value__ }
        Write-Host "  FAIL $Label ($code)" -ForegroundColor Red
        $script:failures += "$Label => $code"
        return $null
    }
}

Write-Host "`n=== AP-6 AUTOS PORTAL SMOKE TESTS ===" -ForegroundColor Cyan

Write-Host "`n1. Backend health"
$health = Test-JsonEndpoint -Label "GET /health" -Url "$Backend/health"
if ($health -and $health -match '"status"\s*:\s*"(ok|healthy)"') {
    Write-Host "  OK health payload" -ForegroundColor Green
} elseif ($health) {
    Write-Host "  WARN health payload unexpected: $($health.Substring(0, [Math]::Min(120, $health.Length)))" -ForegroundColor Yellow
}

Write-Host "`n2. Backend autos finance (public calculator)"
$calcBody = '{"vehicle_price":25000,"down_payment":5000,"term_months":60,"annual_rate":12}'
Test-JsonEndpoint -Label "POST /api/v1/autos/finance/calculate" -Url "$Backend/api/v1/autos/finance/calculate" -Method POST -Body $calcBody -Headers @{ "X-Tenant-ID" = $TenantId }

Write-Host "`n3. Backend autos search"
$searchBody = '{"page":1,"page_size":5}'
Test-JsonEndpoint -Label "POST /api/v1/autos/vehicles/search" -Url "$Backend/api/v1/autos/vehicles/search" -Method POST -Body $searchBody -Headers @{ "X-Tenant-ID" = $TenantId }

Write-Host "`n4. Frontend DNS probe"
$frontendLive = Test-HttpStatus -Label "HEAD $Frontend" -Url $Frontend
if (-not $frontendLive) {
    Write-Host "  INFO autos subdomain not resolving — falling back to $FrontendFallback" -ForegroundColor Yellow
    $Frontend = $FrontendFallback
}

Write-Host "`n5. Frontend routes"
Test-HttpStatus -Label "HEAD /" -Url $Frontend
Test-HttpStatus -Label "HEAD /autos/vehiculos" -Url "$Frontend/autos/vehiculos"
Test-HttpStatus -Label "HEAD /autos/cart" -Url "$Frontend/autos/cart"
Test-HttpStatus -Label "HEAD /autos/dashboard/mis-leads" -Url "$Frontend/autos/dashboard/mis-leads"
Test-HttpStatus -Label "HEAD /autos/marketplace (301)" -Url "$Frontend/autos/marketplace" -Expected @(301, 308)

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
if ($failures.Count -eq 0) {
    Write-Host "ALL SMOKE TESTS PASSED" -ForegroundColor Green
    exit 0
}
Write-Host "FAILURES ($($failures.Count)):" -ForegroundColor Red
$failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
exit 1
