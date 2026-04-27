param(
  [string]$BackendUrl = "http://127.0.0.1:8000",
  [string]$FrontendUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

function Test-Endpoint {
  param(
    [string]$Name,
    [string]$Url,
    [hashtable]$Headers = @{}
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing -TimeoutSec 10
    Write-Host "PASS $Name $($response.StatusCode)"
  } catch {
    Write-Host "WARN $Name unavailable: $($_.Exception.Message)"
  }
}

$tenantId = $env:NEXT_PUBLIC_DEFAULT_TENANT_ID
if (-not $tenantId) {
  $tenantId = "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242"
}

Write-Host "Validating Forge Credit Hub Session 4"
Write-Host "BackendUrl: $BackendUrl"
Write-Host "FrontendUrl: $FrontendUrl"
Write-Host "Tenant: $tenantId"

Test-Endpoint -Name "backend /health" -Url "$BackendUrl/health"
Test-Endpoint -Name "backend /api/v2/credit/health" -Url "$BackendUrl/api/v2/credit/health" -Headers @{ "X-Tenant-ID" = $tenantId }
Test-Endpoint -Name "frontend proxied /api/v2/credit/health" -Url "$FrontendUrl/api/v2/credit/health" -Headers @{ "X-Tenant-ID" = $tenantId }

npm run typecheck
npm run test:run -- credit-hub
npm run build
