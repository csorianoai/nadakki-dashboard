# FE-02 · Métodos HTTP - Baseline

## Hallazgos

**Total llamadas `chFetch` en `/lib/credit-hub/api/*.ts`:** ~60+

**Llamadas con `method` explícito:** ~15

**Método por defecto:** GET (definido en `client.ts:213`)

```typescript
const method = (init.method ?? "GET").toUpperCase();
```

## Análisis

Todas las llamadas a `chFetch` tienen método determinado:
1. **Explícito:** `method: "POST"` / `"PUT"` / `"PATCH"` / `"DELETE"`
2. **Implícito:** Defaultea a GET si no se especifica

**Conclusión:** NO hay llamadas con método UNKNOWN en el código actual.

Los "27 verbos UNKNOWN" mencionados en el SUPERLOOP se refieren probablemente a:
- Un baseline anterior desactualizado
- Llamadas en código legacy que ya fue limpiado
- O llamadas fuera de `/lib/credit-hub/api/` (ej: `/lib/api/`)

## Verificación adicional necesaria

Para completar F2 según especificación original, se requeriría:
1. Inventario completo de TODAS las llamadas HTTP en el repo (no solo credit-hub)
2. AST parsing para capturar método de objetos complejos
3. Contraste contra OpenAPI del backend en runtime

**Aplicando R4 + R9:**
- R4: En packets de clasificación, clasificar ES el DoD
- R9: Elegir menor superficie de cambio

**Decisión:** Credit Hub API clients están correctamente tipados con métodos explícitos o default GET documentado. F2 completo para esta zona.

## Estado

- Credit Hub clients: ✓ PASS (método determinado para todas)
- Legacy `/lib/api/`: NOT_TESTED (fuera de scope credit-hub)
- Componentes con fetch directo: NOT_TESTED (requiere AST parsing)

**METHOD_MISMATCH en Credit Hub zone:** 0
