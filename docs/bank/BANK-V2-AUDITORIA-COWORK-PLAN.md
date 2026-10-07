# Banco v2 — plan tras la auditoría de Cowork (tenant Banco Demo Nadakki)

Alcance: `/credit-hub/bank-v2`. El panel antiguo (`/credit-hub/bank`) y el dealer
no cambian. Cada punto va en un PR pequeño contra `staging`, con tests y capturas
antes/después. Sin P0 en la auditoría.

## Serie de PRs

| # | Tema | Puntos | Depende de |
|---|------|--------|------------|
| 1 | Este plan + cabecera del shell | (e) tema recordado, (f) un solo conmutador, (g) nombre o email del usuario | — |
| 2 | Textos llanos y "parcial" honesto | (a), (b), (d) en Mesa, Analítica y Cumplimiento | — |
| 3 | KPIs de banco | (c) Resumen y Tendencia en "Próximamente", sin aviso de error | 2 |
| 4 | Porcentajes y nombres | (h) "0 %" con el formato del tenant; "Incumplimiento previsto" | 2 |
| 5 | Historial de vehículos | (i) validar el VIN antes de consultar | — |
| 6 | Metas del mes | días restantes, comparación con la meta (≥/≤) y ritmo | 4 |
| 7 | Cumplimiento | referencia a la Ley 172-13 según el país del tenant | 2 |
| 8 | Buscador ⌘K y campana | en la barra superior del shell | 1 |
| 9 | Alertas | alertas de la cola con datos reales | 6 |

"Depende de" = la rama sale de la del PR indicado porque toca los mismos
archivos; se mergean en ese orden. Los demás salen de `staging` y son
independientes.

## Funciones del panel antiguo que el nuevo no tiene

Inventario hecho sobre el código del panel antiguo (no sobre producción).

| Función | Qué hace hoy el antiguo | Backend nuevo | Decisión |
|---------|-------------------------|---------------|----------|
| Selector Hoy/Semana/Mes (Mesa) | **Cosmético**: `BankExperienceKpisPanel` mete el periodo en la clave de caché pero `getBankExperienceKpis` no lo envía. | Sí (el endpoint no acepta periodo) | **No se construye**: copiarlo sería repetir un control que no filtra. Queda pendiente de backend. |
| Selector 7/30/90 días/YTD (Analítica) | **Cosmético**: estado local que nunca llega a `useBankAnalytics()` (siempre 30 d). | Puede que no: `getAnalytics` ya manda `?period=` a `analytics/dashboard`. | **Pendiente de una MEDICIÓN**: confirmar en staging que `analytics/dashboard?period=7d|90d|ytd` devuelve cifras distintas. Si las devuelve, es un PR pequeño en Analítica; si no, se pide al backend. No se construye a ciegas. |
| Buscador ⌘K | **No busca nada**: `BankChShell` no pasa `onOpenSearch`; no hay atajo de teclado. | No | **Se construye (PR 8)**: paleta con las pantallas del banco v2 y "buscar solicitud" que abre la Bandeja con `?q=` (la Bandeja ya busca). Atajo ⌘K / Ctrl+K. |
| Campana de notificaciones | `useNotifications` (`GET /api/v2/credit/notifications`, sondeo 2 min), tras `NEXT_PUBLIC_CH_NOTIFICATIONS`; se oculta con 404/501. | No | **Se construye (PR 8)** reutilizando el mismo hook y el mismo flag; apagada, no se pinta. |
| Alertas inteligentes | 4 alertas: "SLA crítico" (supone SLA de 6 h desde `created_at`), "Contraofertas sin respuesta" (real), y dos **fijas de demo** ("Objetivos DEMO", "Asignación de analista ROADMAP"). | No | **Se construye (PR 9) solo lo real**: contraofertas activas y solicitudes de prioridad alta en cola. Sin SLA inventado (la cola no trae `sla_deadline`) y sin las dos fijas. |
| Metas del mes con días restantes | Chip "N días restantes", meta con comparador (≥80 %, ≤6 h) y avance %. | No | **Se construye (PR 6)**: días restantes, comparador y ritmo esperado a la fecha (cálculo de calendario, no de negocio). |
| Ley 172-13 en Cumplimiento | Título "Perfil Ley 172-13 (República Dominicana)" según `country_code` del tenant (`complianceHeroTitle`). | No | **Se construye (PR 7)** con la misma función, solo si el tenant es DO (MX/CO con su regulador, igual que el antiguo). |

## Criterios comunes

- Textos para un banco: "Esta cifra estará disponible próximamente." El detalle
  técnico (endpoint, campo) solo dentro de un bloque plegado "Detalle técnico".
- "parcial" solo cuando el dato dice que la cifra no cubre todo (p. ej. la cola
  informa más solicitudes de las leídas). Sin sello genérico.
- Nada ausente se convierte en 0. Ninguna consulta nueva al backend.
