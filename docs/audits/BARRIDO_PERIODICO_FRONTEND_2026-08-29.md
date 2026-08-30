# Barrido periodico de frontend · 2026-08-29

Base medida: `origin/staging` en `d4242233`. El barrido fue estatico; no se
modifico staging ni se uso un bundle de produccion. Los PRs quedan abiertos para
no cambiar el bundle mientras Cowork recorre el circuito.

## Barrido 1 · Datos fabricados

Se revisaron defaults numericos y badges con:

```text
git grep -n -E '= 720|= 87|\?\? 17\.5|\?\? 36|\?\? 48' -- components app lib
git grep -n -E 'REAL|SIMULAD|DEMO|VERIFICADO|APROBADO' -- components app lib
```

Hallazgo confirmado en la ruta viva: `components/credit-hub/elite/OfferComparisonCard.tsx`
usaba `best.term_months ?? 60` para calcular y mostrar ahorro durante el plazo
completo. `OfferComparatorSpotlight` llega a ese componente desde
`DealerDashboardView`. Si el backend no entrega plazo, el frontend no puede
calcular ese importe. El cambio evita la cifra y conserva solo la comparación de
tasa. Evidencia maxima previa: L1; la prueba agregada y su mutacion elevan el
caso a L2.

El resto de defaults encontrados pertenece a la copia Forge no importada por la
ruta viva o a valores de presentacion que ya muestran `DEMO`/`ROADMAP`; no se
abrieron PRs para ellos.

## Barrido 2 · Fixtures contra forma de API

Se midieron consumidores de `offers/compare` y el OpenAPI de staging. El contrato
vivo incluye `/api/v2/credit/applications/{application_id}/offers/compare`; los
consumidores activos leen `offers_detail` y `offer_count`. El test existente usa
esa forma real, por lo que no se confirmo un fixture falso nuevo.

## Barrido 3 · Camino que corre

Se enumeraron las paginas y se siguio el arbol de imports del portal vivo
`app/(forge)/credit-hub/**`. El dashboard dealer importa
`OfferComparatorSpotlight`, que importa `OfferComparisonCard`. Las copias
`app/credit/**`, `app/bank/**`, `app/(bank)/**` y
`components/forge/credit-hub/**` no se confundieron con este camino. El guard
`tools/ci/validate-copy-intent.js` ya cubre paginas y componentes, con tests de
mutacion; no se confirmo un hueco adicional.

## Barrido 4 · Mensajes

Se busco `Failed to fetch`, errores de red, reintentos, conflictos y JSON de
error en las rutas vivas. Los casos historicos ya registrados no se reabrieron.
No se confirmo un mensaje nuevo cuyo codigo HTTP contradiga su texto.

## Barrido 5 · Estado local

Se revisaron los usos de `localStorage` y `sessionStorage` en el portal. Los
drafts del wizard se guardan localmente para reanudacion y tambien se persisten
en el servidor; `purgeAllWizardDrafts()` se invoca durante logout. Los tokens y
claves de tenant tienen limpieza centralizada. No se confirmo una fuga nueva en
este barrido.

## Barrido 6 · Guardas propias

Se revisaron `copy-intent-guard` y `pii-registry-guard`. Ambos tienen pruebas de
mutacion. No se encontro una lista que pase solo por resolver vacio en el
alcance revisado; no se modificaron guardas.

## Hallazgos y descarte

| prioridad | hallazgo | evidencia | resultado |
| --- | --- | --- | --- |
| MIENTE | ahorro de plazo con fallback de 60 meses | `OfferComparisonCard.tsx` y ruta importadora viva | PR de correccion preparado |
| DESCARTADO | defaults en componentes Forge no importados por el dashboard vivo | arbol de imports de `app/(forge)/credit-hub/**` | no abrir PR |
| DESCARTADO | fixtures de comparacion con forma vieja | consumidores y OpenAPI usan `offers_detail` | no abrir PR |
| DESCARTADO | estado local no purgado | logout invoca `purgeAllWizardDrafts` y limpieza de sesion | no abrir PR |

## Estado

El unico hallazgo confirmado genero el PR de correccion. No hay cambios
mergeados ni desplegados desde el inicio del barrido. La verificacion de
staging queda pendiente de Cowork para no invalidar su medicion de bundle.
