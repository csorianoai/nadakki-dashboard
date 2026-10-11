# Superloop Dashboard G2-PANEL-ALTA V2 · checkpoint reanudable

Tablero único: https://github.com/csorianoai/nadakki-dashboard/issues/774
Registro inicial UTC: 2026-10-11 13:15:43 UTC. Dueño builder: Codex.
Base dashboard: `5c7acd85ef5b3185948e2b4fa8f1ebbaedc7146e`.
Backend leído: `4f8f1568fb6223e7a569fa4bb99de24980359c79`, exclusivamente lectura.
Rama documental: `codex/realtor-dl10a-package`, nacida de origin/main.
Worktree relativo: `.worktrees/realtor-dl10a-package`.
HEAD/PR exactos y resultados CI: comentario de cierre/PRE_AUDIT en #774 y metadatos del PR.
No sustituye contratos, zonas ni autoridad de merge.

## 14. LECCIONES DE OPERACIÓN DEL BACKEND · versión operativa recibida

Esta sección incorpora todas las reglas transmitidas por César en la actualización operativa.
Las agrupa en 12 reglas, conservando ambos requisitos cuando comparten una regla.
Sustituye la sección 14 operativa anterior; no revoca independencia, doble aceptación ni compuertas.

1. Publicar `VIVO <hora UTC> <tarea>` cada máximo 60 minutos. A los 90 minutos sin
   progreso medible, registrar `STALLED`; el latido por sí solo no cuenta como progreso.
2. Primera acción verificable dentro de 30 minutos. Todas las horas y comparaciones en UTC.
3. Si la cola CI supera 10 trabajos durante 20 minutos, suspender apertura de nuevos PRs.
   Medir trabajos y duración, no declarar congestión por un único snapshot de runs.
4. Reintentar solo checks cancelados o fallidos por infraestructura, una sola vez.
   Un fallo de código no se reejecuta sin reparar; registrar run/check y número de intento.
5. Un dueño por tarea. Buscar un PR existente antes de crear otro; máximo tres PRs abiertos del loop.
6. Nunca mergear dependencias fuera de orden. Releer after/merge_after y comprobar su integración.
7. No declarar DONE hasta merge y CI verde en main, con SHA medido.
8. Previews únicamente con datos sintéticos y flag Realtor apagado. Ninguna ruta productiva habilitada.
9. No exponer secretos ni modificar variables Vercel, backend o autenticación desde este carril.
10. Tras dos fallos idénticos, cambiar estrategia o registrar NEEDS_DECISION con evidencia.
11. Antes de terminar la sesión, publicar un checkpoint reanudable en #774. Reportar cada seis
    horas y al cierre; preservar tarea, rama, HEAD, pruebas, dependencias y siguiente acción.
12. Antes de cada tarea, releer contratos vigentes y SHA backend, exclusivamente en modo lectura.

## Secuencia de estados e independencia

PLANNED → BUILDING → BUILT → PRE_AUDIT → VISUAL_ACCEPT + TECH_ACCEPT →
MERGED → VERIFIED_ON_MAIN → DONE.
Los bloqueos se registran aparte; no deben impedir tareas independientes autorizadas.
Codex es builder: no autoemite ACCEPT ni ejecuta merge.
ChatGPT visual y Claude técnico deben revisar el HEAD exacto como auditores independientes,
sin autoría de sus commits. Un cambio de HEAD invalida las aprobaciones afectadas.
Claude conserva la responsabilidad exclusiva de merges autorizados: ambas aceptaciones,
CI requerido verde, HEAD releído/esperado, dependencias integradas y GR-12/zonas satisfechos.
GR-11.3 continúa pendiente de integración de #1848 al momento del censo; no se presume vigente.
No hay bypass, activación productiva ni resolución de human gates por el builder.

## Estado medido al construir este checkpoint

| Tarea | Dueño | Estado | Evidencia / bloqueo separado |
|---|---|---|---|
| Censo/índice #772 | Codex | BUILT | HEAD 7f51bee96fd7cf64b35346dcb3f6aec72a715b75; seguridad pendiente |
| Licencia/Broker #773 | Codex | PRE_AUDIT | HEAD db47bf14484066a714d04e5f335178ac99f789ae; CI verde medido |
| Paquete DL10A | Codex | BUILT | Integridad PASS; siguiente PRE_AUDIT tras push y HEAD medido |
| Marca | Sin asignación activa | PLANNED | Serialización de zona, límite de PRs, contrato parcial |
| Canales | Sin asignación activa | PLANNED | Serialización de zona, límite de PRs, contrato integración ausente |

#772 y #773 siguen abiertos/draft; no se modifican sus ramas.
#1853 abierto propone globs compartidos, max_concurrent_writers=1 e incompatibilidad.
Sin mapa efectivo independiente, no se inicia Marca/Canales en paralelo.
CONTRACT_PENDING, DESIGN_IN_REVIEW y BLOCKED_SECURITY_DEPENDENCY siguen separados.
CI #773: next production build/typecheck and changedSince tests PASS sobre su HEAD exacto;
Vercel PASS no significa permiso Realtor ni integración de seguridad verificada.
Cola queued de GitHub Actions medida: cero runs; sin evidencia de umbral de congestión sostenido.

## Dependencias de orquestación y reanudación

No se localizó el texto completo del prompt maestro V2/sección 13 en las autoridades consultadas.
Se aplican las instrucciones explícitas de esta conversación y las reglas operativas de arriba;
no se inventa el contenido ausente. Petición documental: adjuntar/publicar esa versión exacta.
No hay canal directo verificable para despachar a sesiones ChatGPT/Claude ni scheduler persistente
habilitado para este tablero. Solicitudes se publican en GitHub; aceptación/despacho no se presume.
NEEDS_DECISION: orquestador autorizado debe consumir #774, despachar auditores y ejecutar cadencia.
No se modifica infraestructura global para fingir que el loop continúa tras cerrar esta sesión.

Al reanudar: leer #774/comentarios, origin/main, backend main/contratos/ZONES y #1853/#1848;
buscar PRs abiertos y medir cola CI; confirmar dueño exclusivo y espacio <=3;
verificar HEAD remoto y CI del paquete, completar auditorías independientes;
cuando se libere una plaza y la zona lo permita, construir Marca en rama nueva desde main,
después Canales en serie salvo nueva autoridad que pruebe independencia efectiva.
No tocar rutas/auth/backend; mantener capacidades incompletas UNAVAILABLE.
