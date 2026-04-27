param(
  [string]$BackendUrl = "http://127.0.0.1:8000",
  [string]$FrontendUrl = "http://localhost:3000",
  [string]$TenantId = "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242",
  [switch]$SkipFrontendProxy
)

$ErrorActionPreference = "Stop"

function Assert-StatusOk {
  param(
    [string]$Name,
    [string]$Url,
    [hashtable]$Headers = @{}
  )

  $response = Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing -TimeoutSec 20
  if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
    throw "$Name failed with HTTP $($response.StatusCode)"
  }
  Write-Host "PASS $Name $($response.StatusCode)"
  return $response
}

function New-FullCreditPayload {
  $stamp = Get-Date -Format "yyyyMMddHHmmss"
  return @{
    application_payload = @{
      applicant = @{
        full_name = "QA Forge Demo $stamp"
        identification = "001-$stamp"
        date_of_birth = "1990-01-01"
        age = "35"
        marital_status = "single"
        phone = "8095550000"
        email = "qa.forge.$stamp@example.com"
        address = "Av. Winston Churchill 1"
        city = "Santo Domingo"
        province = "Distrito Nacional"
        country = "Republica Dominicana"
      }
      employment = @{
        employment_type = "employee"
        employer_name = "Credicefi QA"
        position = "Analista"
        time_in_job = "3 anos"
        monthly_income = "85000"
        other_income = "5000"
        payment_frequency = "monthly"
        work_phone = "8095551111"
      }
      financial = @{
        requested_amount = "500000"
        desired_term = "48 meses"
        down_payment = "100000"
        monthly_debts = "15000"
        estimated_monthly_expenses = "30000"
        primary_bank = "Banco Popular"
        has_bank_account = $true
        has_late_payment_history = $false
        max_late_payment_days = $null
      }
      vehicle = @{
        product_type = "vehicle"
        make = "Toyota"
        model = "Hilux"
        year = "2024"
        price = "1600000"
        dealer_supplier = "Dealer QA"
        condition = "new"
      }
      co_debtor = @{
        required = $false
        full_name = ""
        identification = ""
        phone = ""
        monthly_income = ""
        relationship = ""
        employment = ""
      }
      documents = @{
        id_uploaded = $true
        income_proof_uploaded = $true
        bank_statement_uploaded = $true
        bureau_authorization_uploaded = $true
        invoice_uploaded = $true
      }
      consents = @{
        bureau_authorization = $true
        terms_accepted = $true
        data_processing_authorization = $true
      }
      source = "forge_dealer_portal"
      version = "full_credit_application_v1"
    }
    initial_state = "DRAFT"
  }
}

$headers = @{
  "X-Tenant-ID" = $TenantId
  "Content-Type" = "application/json"
}

Write-Host "Validating full Forge credit wizard contract"
Write-Host "BackendUrl: $BackendUrl"
Write-Host "FrontendUrl: $FrontendUrl"
Write-Host "TenantId: $TenantId"

Assert-StatusOk -Name "backend /api/v2/credit/health" -Url "$BackendUrl/api/v2/credit/health" -Headers @{ "X-Tenant-ID" = $TenantId } | Out-Null

$payload = New-FullCreditPayload
$body = $payload | ConvertTo-Json -Depth 20
Write-Host "Payload schema:"
$body

$createResponse = Invoke-RestMethod -Method Post -Uri "$BackendUrl/api/v2/credit/applications" -Headers $headers -Body $body -TimeoutSec 30
$applicationId = $createResponse.application_id
if (-not $applicationId) {
  throw "Backend create response did not include application_id"
}
if (-not $createResponse.tenant_id) {
  throw "Backend create response did not include tenant_id"
}
if (-not $createResponse.state) {
  throw "Backend create response did not include state"
}
if (-not $createResponse.application_payload) {
  throw "Backend create response did not include application_payload"
}

Write-Host "PASS create application_id=$applicationId state=$($createResponse.state)"

$detailResponse = Invoke-RestMethod -Method Get -Uri "$BackendUrl/api/v2/credit/applications/$applicationId" -Headers @{ "X-Tenant-ID" = $TenantId } -TimeoutSec 30
if (-not $detailResponse.application_id -and -not $detailResponse.id) {
  throw "Detail response did not include id/application_id"
}
Write-Host "PASS detail loaded"

$listResponse = Invoke-RestMethod -Method Get -Uri "$BackendUrl/api/v2/credit/applications" -Headers @{ "X-Tenant-ID" = $TenantId } -TimeoutSec 30
$listJson = $listResponse | ConvertTo-Json -Depth 20
if ($listJson -notmatch [regex]::Escape($applicationId)) {
  throw "Created application was not found in list response"
}
Write-Host "PASS list includes created application"

if (-not $SkipFrontendProxy) {
  try {
    Assert-StatusOk -Name "frontend proxied health" -Url "$FrontendUrl/api/v2/credit/health" -Headers @{ "X-Tenant-ID" = $TenantId } | Out-Null
  } catch {
    Write-Host "WARN frontend proxy check skipped/failed: $($_.Exception.Message)"
  }
}

Write-Host ""
Write-Host "Manual browser check:"
Write-Host "1. Open $FrontendUrl/credit-hub/dealer/applications/new"
Write-Host "2. Confirm sections: Solicitante, Laboral, Finanzas, Producto, Garante, Documentos, Consentimientos, Revision"
Write-Host "3. Submit and confirm redirect to /credit-hub/dealer/applications/{application_id}"
