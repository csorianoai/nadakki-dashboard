# Contratos vendorizados (solo lectura)

Copias exactas de los contratos de Nadakki Sites que el motor consume. Fuente: `csorianoai/nadakki-ai-suite`, `docs/contracts/`, rama `main` (commit `c30cf8b33`).

| Contrato | Versión | Ficheros |
|---|---|---|
| `C-SITES-RENDER` | 1.0.0 | `schema.json`, `openapi.yaml`, `events.yaml` |
| `C-SITES-LEADS` | 1.1.0 (#2627) | `schema.json`, `openapi.yaml`, `events.yaml` |

- `CONTRACTS.sha256` lista la huella de cada fichero; se comprueba con `cd apps/sites-engine/contracts && sha256sum -c CONTRACTS.sha256`.
- **No se editan.** Un cambio de contrato se hace en `nadakki-ai-suite` (zona `PRODUCT-CONTRACTS`) y aquí se vuelve a copiar, con el `sha256` nuevo, en un PR humano.
- El motor valida en tiempo de ejecución contra estos esquemas (ajv); no importa nada de `nadakki-ai-suite`.
