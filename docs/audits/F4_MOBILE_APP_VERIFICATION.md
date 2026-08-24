# F4 · App Móvil - Verificación

**Loop:** FE-CIERRE  
**Fecha:** 2026-08-24

## Resumen

La app móvil (Android) está **configurada correctamente** pero no se puede compilar en este entorno por falta de Android SDK/Java.

---

## Verificaciones Realizadas

### 1. capacitor.config.ts ✅ PASS

**URL configurada:**
```typescript
server: {
  url: "https://dashboard.nadakki.com/credit-hub/dealer",
  cleartext: false,
  androidScheme: "https",
}
```

**Resultado:** URL apunta al dominio correcto de producción.

---

### 2. manifest-dealer.json ✅ PASS

**Iconos declarados:** 8 iconos (72x72 a 512x512)

**Verificación física:**
```powershell
Test-Path public/icons/icon-*.png
# All 8 files: True
```

**Resultado:** Todos los iconos declarados en el manifest existen en `public/icons/`.

**Shortcuts:** 3 accesos directos declarados (Nueva Solicitud, Mis Solicitudes, Pre-Aprobación)

---

### 3. Service Worker ✅ PASS

**Verificado en F1:** El service worker en `public/sw.js` NO cachea rutas autenticadas:

```javascript
// Todas estas rutas usan NetworkOnly (no cachean):
e.registerRoute(/^https?:\/\/[^/]+\/api\/.*/i, new e.NetworkOnly, "GET"),
e.registerRoute(/^https?:\/\/[^/]+\/(auth|login|logout|session)(\/.*)?$/i, new e.NetworkOnly, "GET"),
e.registerRoute(/^https?:\/\/[^/]+\/(dashboard|dealer|bank|forge|credit-hub)(\/.*)?$/i, new e.NetworkOnly, "GET"),
e.registerRoute(/^https?:\/\/[^/]+\/(applications|decision|scoring|documents|uploads)(\/.*)?$/i, new e.NetworkOnly, "GET"),
```

**Resultado:** No hay riesgo de exponer PII después del logout a través del cache del service worker.

---

### 4. Build del APK ⚠️ NO_EJECUTABLE

**Motivo:** Entorno carece de:
- Android SDK
- Java JDK
- Gradle

**Comando intentado:**
```bash
cd android
./gradlew assembleDebug
```

**Error:**
```
JAVA_HOME not set
```

**Conclusión:** La compilación del APK requiere un entorno con Android Studio o CI configurado. La configuración de Capacitor es correcta.

---

## DoD F4

- ✅ `capacitor.config.ts` apunta a URL correcta
- ✅ Manifest declara iconos que existen físicamente
- ✅ Service worker no cachea rutas autenticadas
- ⚠️ Build APK: `NO_EJECUTABLE` (Android SDK no disponible)

---

## Recomendaciones

1. **Para compilar APK:** Configurar entorno con Android Studio o usar CI/CD (GitHub Actions)
2. **Para testing:** Usar emulador Android con Android Studio
3. **Para distribución:** Configurar firma de app y subir a Google Play Console

---

## Estado Final

**Configuración:** PASS  
**Build:** NO_EJECUTABLE (dependencia externa)
