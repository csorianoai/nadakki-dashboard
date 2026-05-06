# =============================================================================
# fix_prompt_B_apibase.ps1
# =============================================================================
# Inyecta la correccion de apiBase (NEXT_PUBLIC_API_URL) en el prompt B
# de cierre, antes de pasarselo a Cursor.
#
# Uso:
#   .\tools\fix_prompt_B_apibase.ps1 -PromptPath "C:\ruta\al\B_CLOSURE_CURSOR_legal_home_launcher.md"
#
# Comportamiento:
#   - Hace backup .bak del archivo original
#   - Reemplaza el bloque viejo de useLegalTasks.ts por la version con apiBase
#   - Inyecta el mismo patron en useExecuteLegalTask y TaskExecuteModal
#   - Agrega una seccion al inicio del prompt explicando la correccion
#   - Idempotente: si ya esta corregido, no toca nada y reporta
#   - Verifica al final que la cadena "NEXT_PUBLIC_API_URL" aparece >= 3 veces
# =============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$PromptPath = ""
)

$ErrorActionPreference = "Stop"

# -----------------------------------------------------------------------------
# 1. RESOLVER PATH DEL PROMPT
# -----------------------------------------------------------------------------

if ([string]::IsNullOrWhiteSpace($PromptPath)) {
    $candidates = @(
        ".\B_CLOSURE_CURSOR_legal_home_launcher.md",
        "$env:USERPROFILE\Downloads\B_CLOSURE_CURSOR_legal_home_launcher.md",
        "$env:USERPROFILE\Desktop\B_CLOSURE_CURSOR_legal_home_launcher.md"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) {
            $PromptPath = (Resolve-Path $c).Path
            Write-Host "[INFO] Prompt encontrado en: $PromptPath" -ForegroundColor Cyan
            break
        }
    }
    if ([string]::IsNullOrWhiteSpace($PromptPath)) {
        Write-Host "[ERROR] No se encontro B_CLOSURE_CURSOR_legal_home_launcher.md" -ForegroundColor Red
        Write-Host "        Pasa el path con -PromptPath 'C:\ruta\al\archivo.md'" -ForegroundColor Yellow
        exit 1
    }
}

if (-not (Test-Path $PromptPath)) {
    Write-Host "[ERROR] No existe: $PromptPath" -ForegroundColor Red
    exit 1
}

$PromptPath = (Resolve-Path $PromptPath).Path

# -----------------------------------------------------------------------------
# 2. LEER CONTENIDO (BOM-safe) + idempotencia (sin backup si no hace falta)
# -----------------------------------------------------------------------------

$content = [System.IO.File]::ReadAllText($PromptPath)
$originalLength = $content.Length

$alreadyPatched = $content -match "NEXT_PUBLIC_API_URL"
if ($alreadyPatched) {
    Write-Host "[INFO] El prompt ya contiene NEXT_PUBLIC_API_URL — no se requiere cambios" -ForegroundColor Yellow
    Write-Host "[INFO] Si quieres forzar reemplazo, edita el archivo a mano o quita las lineas con esa variable" -ForegroundColor Yellow
    exit 0
}

# -----------------------------------------------------------------------------
# 3. BACKUP
# -----------------------------------------------------------------------------

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "$PromptPath.bak_$timestamp"
Copy-Item -Path $PromptPath -Destination $backupPath -Force
Write-Host "[OK] Backup creado: $backupPath" -ForegroundColor Green

# -----------------------------------------------------------------------------
# 4. APLICAR REEMPLAZOS
# -----------------------------------------------------------------------------

Write-Host "[INFO] Aplicando correcciones..." -ForegroundColor Cyan

# --- Reemplazo 1: useLegalTasks.ts ---
$oldUseLegalTasks = @'
        const res = await fetch(
          `/api/v1/legal/tasks?jurisdiction=${jurisdiction}`,
          { headers: { "X-Tenant-ID": tenantId } },
        );
'@

$newUseLegalTasks = @'
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
        const res = await fetch(
          `${apiBase}/api/v1/legal/tasks?jurisdiction=${jurisdiction}`,
          { headers: { "X-Tenant-ID": tenantId } },
        );
'@

if ($content.Contains($oldUseLegalTasks)) {
    $content = $content.Replace($oldUseLegalTasks, $newUseLegalTasks)
    Write-Host "  [OK] useLegalTasks.ts: parcheado" -ForegroundColor Green
} else {
    Write-Host "  [WARN] useLegalTasks.ts: bloque exacto no encontrado (ver instrucciones manuales abajo)" -ForegroundColor Yellow
}

# --- Reemplazo 2: TaskExecuteModal.tsx ---
$oldExecuteModal = @'
      const res = await fetch(`/api/v1/legal/tasks/${task.task_id}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": getTenantId(),
        },
        body: JSON.stringify({
          task_id: task.task_id,
          inputs,
          dry_run: true,
        }),
      });
'@

$newExecuteModal = @'
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/v1/legal/tasks/${task.task_id}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": getTenantId(),
        },
        body: JSON.stringify({
          task_id: task.task_id,
          inputs,
          dry_run: true,
        }),
      });
'@

if ($content.Contains($oldExecuteModal)) {
    $content = $content.Replace($oldExecuteModal, $newExecuteModal)
    Write-Host "  [OK] TaskExecuteModal.tsx: parcheado" -ForegroundColor Green
} else {
    Write-Host "  [WARN] TaskExecuteModal.tsx: bloque exacto no encontrado" -ForegroundColor Yellow
}

# --- Reemplazo 3: telemetry.ts ---
$oldTelemetry = @'
    fetch("/api/v1/telemetry/legal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => {
      /* fire and forget */
    });
'@

$newTelemetry = @'
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${apiBase}/api/v1/telemetry/legal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => {
      /* fire and forget */
    });
'@

if ($content.Contains($oldTelemetry)) {
    $content = $content.Replace($oldTelemetry, $newTelemetry)
    Write-Host "  [OK] telemetry.ts: parcheado" -ForegroundColor Green
} else {
    Write-Host "  [WARN] telemetry.ts: bloque exacto no encontrado" -ForegroundColor Yellow
}

# --- Inyeccion 4: agregar nota destacada al inicio del prompt ---
$injectionMarker = "## CONTEXTO HONESTO — LEE ESTO ANTES DE EMPEZAR"

$injectionBlock = @'
## CORRECCION CRITICA APLICADA AUTOMATICAMENTE — APIBASE

**Antes de leer el resto del prompt, lee esto:**

Todos los `fetch()` en este prompt usan ahora `NEXT_PUBLIC_API_URL` desde
`.env.local` para apuntar al backend en Render:

```
NEXT_PUBLIC_API_URL="https://nadakki-ai-suite.onrender.com"
```

**Patron obligatorio en CUALQUIER fetch nuevo que escribas:**

```ts
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
const res = await fetch(`${apiBase}/api/v1/...`, { ... });
```

**Razon:** Vercel no tiene backend en `/api/*` por defecto. Sin esta variable,
el frontend funciona en `localhost` con proxy pero falla en produccion Vercel
con 404. La variable ya esta configurada en `.env.local` — solo asegurate de
USARLA en cada fetch.

Si en el cuerpo del prompt ves un fetch sin `apiBase`, AGREGALO. No commitear
ningun fetch a `/api/v1/...` sin el prefijo `${apiBase}`.

---

'@

if ($content.Contains($injectionMarker)) {
    $content = $content.Replace($injectionMarker, "$injectionBlock$injectionMarker")
    Write-Host "  [OK] Nota de apiBase inyectada al inicio del prompt" -ForegroundColor Green
} else {
    Write-Host "  [WARN] No se encontro el marker de inyeccion — agregando al inicio" -ForegroundColor Yellow
    $content = "$injectionBlock`n$content"
}

# -----------------------------------------------------------------------------
# 5. ESCRIBIR ARCHIVO (UTF-8 sin BOM)
# -----------------------------------------------------------------------------

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($PromptPath, $content, $utf8NoBom)

$newLength = $content.Length
$delta = $newLength - $originalLength

Write-Host ""
Write-Host "[OK] Archivo actualizado" -ForegroundColor Green
Write-Host "     Tamano original:    $originalLength bytes" -ForegroundColor Gray
Write-Host "     Tamano nuevo:       $newLength bytes" -ForegroundColor Gray
Write-Host "     Delta:              +$delta bytes" -ForegroundColor Gray

# -----------------------------------------------------------------------------
# 6. VERIFICACION
# -----------------------------------------------------------------------------

Write-Host ""
Write-Host "[INFO] Verificando..." -ForegroundColor Cyan

$verifyContent = [System.IO.File]::ReadAllText($PromptPath)
$apiBaseCount = ([regex]::Matches($verifyContent, "NEXT_PUBLIC_API_URL")).Count
$apiBaseTokenCount = ([regex]::Matches($verifyContent, '\$\{apiBase\}')).Count

Write-Host "  Ocurrencias de NEXT_PUBLIC_API_URL: $apiBaseCount (esperado >= 3)" -ForegroundColor Gray
Write-Host ('  Ocurrencias de ${apiBase}: ' + $apiBaseTokenCount + ' (esperado >= 3)') -ForegroundColor Gray

$success = ($apiBaseCount -ge 3) -and ($apiBaseTokenCount -ge 3)

if ($success) {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  PROMPT B PARCHEADO Y LISTO PARA PASAR A CURSOR" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Siguiente paso:" -ForegroundColor White
    Write-Host "  1. Abre el archivo: $PromptPath" -ForegroundColor Gray
    Write-Host "  2. Copialo completo (Ctrl+A, Ctrl+C)" -ForegroundColor Gray
    Write-Host "  3. Pegalo en una sesion de Cursor con el workspace nadakki-dashboard abierto" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Backup disponible en: $backupPath" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host "  VERIFICACION FALLIDA — REVISAR MANUALMENTE" -ForegroundColor Red
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "El parche no encontro los 3 bloques esperados." -ForegroundColor Yellow
    Write-Host "Restaurando del backup automaticamente..." -ForegroundColor Yellow
    Copy-Item -Path $backupPath -Destination $PromptPath -Force
    Write-Host "[OK] Restaurado al estado original" -ForegroundColor Green
    Write-Host ""
    Write-Host "Acciones manuales:" -ForegroundColor White
    Write-Host "  1. Abre $PromptPath" -ForegroundColor Gray
    Write-Host "  2. Busca cualquier 'fetch(\"/api/v1/' y reemplaza por:" -ForegroundColor Gray
    Write-Host '     fetch(`${apiBase}/api/v1/...`)' -ForegroundColor Gray
    Write-Host "  3. Antes de cada fetch agrega:" -ForegroundColor Gray
    Write-Host '     const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";' -ForegroundColor Gray
    exit 1
}
