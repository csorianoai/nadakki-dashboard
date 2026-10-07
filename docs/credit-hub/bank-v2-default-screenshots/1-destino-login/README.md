# BANK-V2-DEFAULT 1/3 — destino tras el login

Build de produccion local (`next build` + `next start`), sesion simulada con
Playwright (API interceptada, sin backend). URL final medida tras abrir `/login`
con sesion valida:

| Perfil | Interruptor APAGADO | Interruptor ENCENDIDO |
|---|---|---|
| banker | `/credit-hub/bank` | `/credit-hub/bank-v2` |
| credit_admin | `/credit-hub/bank` | `/credit-hub/bank-v2` |
| bank_analyst | `/credit-hub/bank` | `/credit-hub/bank-v2` |
| platform_superadmin | `/` | `/` |
| dealer | `/autos/dealer` | `/autos/dealer` |
| dealer + credit_admin | `/credit-hub/bank` | `/credit-hub/bank` |

- `apagado-banker.png`: el banker aterriza en el panel actual, como hoy.
- `encendido-banker.png`: el banker aterriza en la Mesa de decisiones de bank-v2.
  Los "No se pudo cargar" son de la API simulada (503), no del cambio.
