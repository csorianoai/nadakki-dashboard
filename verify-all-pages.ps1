# ============================================================
# NADAKKI - VERIFICADOR DE PÁGINAS Y ERRORES
# Detecta: .map() sin protección, imports rotos, errores comunes
# ============================================================

$ProjectRoot = "C:\Users\cesar\Projects\nadakki-dashboard"
Set-Location $ProjectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NADAKKI PAGE VERIFIER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$fixed = @()

# 1. Buscar .map() sin optional chaining (?.)
Write-Host "🔍 Verificando .map() sin protección..." -ForegroundColor Yellow
$unsafeMapFiles = Get-ChildItem -Path "app","components" -Recurse -Include "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $relativePath = $_.FullName.Replace($ProjectRoot, "").TrimStart("\")
    
    # Buscar patrones peligrosos: variable.map( sin ?. antes
    $dangerousPatterns = @(
        '(?<!\?)\.(map)\s*\(',           # .map( sin ?.
        '(?<!\|\|)\s*\[\s*\]\s*\)\s*\.map'  # sin || [] antes de .map
    )
    
    foreach ($pattern in $dangerousPatterns) {
        if ($content -match '\b(\w+)\.map\s*\(' -and $content -notmatch '\?\s*\.map\s*\(') {
            # Verificar si tiene fallback
            $hasNullCheck = $content -match '\|\|\s*\[\s*\]' -or $content -match '\?\?' -or $content -match '\?\s*\.\s*map'
            if (-not $hasNullCheck) {
                # Contar ocurrencias
                $matches = [regex]::Matches($content, '(\w+)\.map\s*\(')
                foreach ($m in $matches) {
                    $varName = $m.Groups[1].Value
                    # Ignorar variables seguras conocidas
                    if ($varName -notin @('Array', 'Object', 'pathSegments', 'navigationStructure', 'CORES_CONFIG', 'allCores', 'breadcrumbs')) {
                        if ($content -notmatch "\b$varName\s*\?\s*\.map") {
                            return [PSCustomObject]@{
                                File = $relativePath
                                Variable = $varName
                                Issue = ".map() puede fallar si $varName es undefined"
                            }
                        }
                    }
                }
            }
        }
    }
}

if ($unsafeMapFiles) {
    Write-Host ""
    Write-Host "⚠️  ARCHIVOS CON .map() POTENCIALMENTE INSEGURO:" -ForegroundColor Red
    $unsafeMapFiles | Select-Object -First 20 | ForEach-Object {
        Write-Host "   ❌ $($_.File)" -ForegroundColor Red
        Write-Host "      Variable: $($_.Variable)" -ForegroundColor DarkGray
    }
    if (($unsafeMapFiles | Measure-Object).Count -gt 20) {
        Write-Host "   ... y $(($unsafeMapFiles | Measure-Object).Count - 20) más" -ForegroundColor DarkGray
    }
} else {
    Write-Host "   ✅ Todos los .map() están protegidos" -ForegroundColor Green
}

# 2. Verificar imports de componentes que no existen
Write-Host ""
Write-Host "🔍 Verificando imports rotos..." -ForegroundColor Yellow

$brokenImports = @()
Get-ChildItem -Path "app","components" -Recurse -Include "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $relativePath = $_.FullName.Replace($ProjectRoot, "").TrimStart("\")
    
    # Buscar imports de @/components
    $importMatches = [regex]::Matches($content, 'from\s+[''"]@/components/([^''"]+)[''"]')
    foreach ($match in $importMatches) {
        $importPath = $match.Groups[1].Value
        $fullPath = Join-Path $ProjectRoot "components" $importPath
        
        # Verificar si existe .tsx o index.ts
        $exists = (Test-Path "$fullPath.tsx") -or (Test-Path "$fullPath/index.ts") -or (Test-Path "$fullPath/index.tsx") -or (Test-Path $fullPath)
        
        if (-not $exists) {
            $brokenImports += [PSCustomObject]@{
                File = $relativePath
                Import = "@/components/$importPath"
            }
        }
    }
}

if ($brokenImports) {
    Write-Host ""
    Write-Host "❌ IMPORTS ROTOS ENCONTRADOS:" -ForegroundColor Red
    $brokenImports | Select-Object -Unique -Property Import | ForEach-Object {
        Write-Host "   ❌ $($_.Import)" -ForegroundColor Red
    }
} else {
    Write-Host "   ✅ Todos los imports son válidos" -ForegroundColor Green
}

# 3. Verificar páginas que usan contextos incorrectamente
Write-Host ""
Write-Host "🔍 Verificando uso de contextos..." -ForegroundColor Yellow

$contextIssues = @()
Get-ChildItem -Path "app","components" -Recurse -Include "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $relativePath = $_.FullName.Replace($ProjectRoot, "").TrimStart("\")
    
    # Buscar uso incorrecto de useTenant
    if ($content -match 'useTenant\(\)' -and $content -match '\bcurrentTenant\b') {
        $contextIssues += [PSCustomObject]@{
            File = $relativePath
            Issue = "Usa 'currentTenant' pero TenantContext exporta 'tenantId'"
        }
    }
    
    if ($content -match 'useTenant\(\)' -and $content -match '\btenants\b' -and $content -match '\.map\(') {
        $contextIssues += [PSCustomObject]@{
            File = $relativePath
            Issue = "Usa 'tenants.map()' pero TenantContext no exporta array de tenants"
        }
    }
    
    if ($content -match 'useTenant\(\)' -and $content -match '\bisLoading\b') {
        $contextIssues += [PSCustomObject]@{
            File = $relativePath
            Issue = "Usa 'isLoading' pero TenantContext no lo exporta"
        }
    }
}

if ($contextIssues) {
    Write-Host ""
    Write-Host "❌ PROBLEMAS DE CONTEXTO:" -ForegroundColor Red
    $contextIssues | ForEach-Object {
        Write-Host "   ❌ $($_.File)" -ForegroundColor Red
        Write-Host "      $($_.Issue)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "   ✅ Contextos usados correctamente" -ForegroundColor Green
}

# 4. Verificar páginas sin "use client" que usan hooks
Write-Host ""
Write-Host "🔍 Verificando directiva 'use client'..." -ForegroundColor Yellow

$missingUseClient = @()
Get-ChildItem -Path "app" -Recurse -Include "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $relativePath = $_.FullName.Replace($ProjectRoot, "").TrimStart("\")
    
    $usesHooks = $content -match '\buse[A-Z]\w+\s*\(' -or $content -match '\buseState\b' -or $content -match '\buseEffect\b'
    $hasUseClient = $content -match '["'']use client["'']'
    
    if ($usesHooks -and -not $hasUseClient) {
        $missingUseClient += $relativePath
    }
}

if ($missingUseClient) {
    Write-Host ""
    Write-Host "⚠️  PÁGINAS SIN 'use client' QUE USAN HOOKS:" -ForegroundColor Yellow
    $missingUseClient | Select-Object -First 10 | ForEach-Object {
        Write-Host "   ⚠️  $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✅ Todas las páginas con hooks tienen 'use client'" -ForegroundColor Green
}

# 5. Resumen
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$totalPages = (Get-ChildItem -Path "app" -Recurse -Name "page.tsx").Count
$issueCount = ($contextIssues | Measure-Object).Count + ($brokenImports | Measure-Object).Count

Write-Host ""
Write-Host "   Total páginas: $totalPages" -ForegroundColor White
Write-Host "   Problemas de contexto: $(($contextIssues | Measure-Object).Count)" -ForegroundColor $(if (($contextIssues | Measure-Object).Count -gt 0) { "Red" } else { "Green" })
Write-Host "   Imports rotos: $(($brokenImports | Measure-Object).Count)" -ForegroundColor $(if (($brokenImports | Measure-Object).Count -gt 0) { "Red" } else { "Green" })
Write-Host "   Sin 'use client': $(($missingUseClient | Measure-Object).Count)" -ForegroundColor $(if (($missingUseClient | Measure-Object).Count -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

if ($issueCount -eq 0) {
    Write-Host "🎉 ¡Todo está correcto!" -ForegroundColor Green
} else {
    Write-Host "🔧 Se encontraron $issueCount problemas que requieren atención" -ForegroundColor Yellow
}

Write-Host ""