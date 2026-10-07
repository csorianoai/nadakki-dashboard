# BANK-V2-DEFAULT 2/3 — menu del banco

Menu global (seccion Credit Hub) en `/market-intel`. Las etiquetas ambar con el
destino de cada enlace son una ANOTACION de la captura (se inyectan solo en el
navegador de Playwright), no parte de la UI.

- `apagado-banker.png`: enlaces de siempre (`/credit-hub/bank/...`).
- `encendido-banker.png`: las 8 entradas del banco apuntan a `/credit-hub/bank-v2/...`.
  El lado dealer del menu no cambia.
- `encendido-superadmin.png` y `encendido-dealer.png`: identicos al menu de hoy.

Enlaces medidos en el DOM con el interruptor ENCENDIDO:

| Perfil | Mesa de decisiones | Bandeja | Filtros | KPIs | Vehiculos | Analitica | Cumplimiento | Auditoria |
|---|---|---|---|---|---|---|---|---|
| banker / credit_admin / bank_analyst | bank-v2 | bank-v2/solicitudes | bank-v2/filtros | bank-v2/kpis | bank-v2/vehiculos | bank-v2/analitica | bank-v2/cumplimiento | bank-v2/auditoria |
| superadmin, dealer, dealer+credit_admin | /credit-hub/bank | .../applications | /credit/pool-filters | /credit/bank/kpis | .../vehicles | .../analytics | .../compliance | .../audit |
