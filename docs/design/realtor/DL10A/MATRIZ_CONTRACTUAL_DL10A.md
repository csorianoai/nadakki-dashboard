# Matriz contractual antes / después · Design Loop 10A

## 1. Etapas del Listing Director
| # | Loop 10 (antes) | Loop 10A (después, ola 2) | Qué determina que la etapa está completa | Compuertas internas |
|---|---|---|---|---|
| 1 | CAPTACION · Captación | `acquire` · Captar | Consulta registrada y calificación guardada | La **calificación** (antes era la etapa 2) |
| 2 | CALIFICACION · Calificación | `cma` · CMA | El agente revisó el CMA y decidió el precio | La **revisión del precio** (antes era la etapa 4) |
| 3 | CMA | `agreement` · Acuerdo | El broker aprobó el acuerdo | — |
| 4 | REVISION_PRECIO | `prepare_publish` · Preparar y publicar | Publicación simulada preparada | — |
| 5 | ACUERDO_LISTING | `marketing_showings` · Marketing y visitas | El broker aprobó la campaña y hay una visita agendada | — |
| 6 | PUBLICACION | `offers` · Ofertas | El agente registró la oferta | — |
| 7 | MARKETING_VISITAS | `contract_contingencies` · Contrato y contingencias | Las 3 contingencias están levantadas (la plantilla del contrato sigue pendiente) | — |
| 8 | OFERTAS_CIERRE | `closing` · Cierre | Cierre simulado | Exige oferta y contingencias |

**Conservación:**
- El estado guardado (`wf.lst`) tiene los mismos 13 campos que en Loop 10, con la misma clave de almacenamiento. El avance se recalcula y no se pierde nada.
- Se mantienen todas las acciones y sus identificadores de prueba: `ls-lead`, `ls-qual`, `ls-cma`, `ls-cma-review`, `ls-price-save`, `ls-agr`, `ls-agr-req`, `ls-pub`, `ls-mkt`, `ls-visit`, `ls-offer-save`, `ls-cont-*` y `ls-close`.
- Se mantienen la invalidación del acuerdo cuando cambia el precio y las aprobaciones del broker.

**Lo nuevo en la interfaz:** un bloque «Compuertas de la etapa» con cada compuerta interna (cumplida o pendiente). Las compuertas se aplican tanto en los botones como en la lógica.

## 2. Autonomía (G1-AUTONOMIA, propuesta)
| Aspecto | Loop 10 | Loop 10A |
|---|---|---|
| Fuente de la escala | Definición propia | G1-AUTONOMIA, citada como autoridad propuesta en la interfaz y en la documentación |
| A5 | «No permitido en DEMO» (solo texto) | Deshabilitado también en la lógica: `wfMake` rechaza cualquier trabajo de un equipo en A5 (T100) |
| Permisos desde la interfaz | Ninguno | Ninguno. No hay ningún control para cambiar la autonomía (T100) |
| Acciones externas | Requerían aprobación | Igual, y la regla se muestra en el Router: consentimiento vigente más la aprobación que corresponda |

**Limitación:** el documento G1-AUTONOMIA no está en el proyecto. La escala de A0 a A5 conserva las definiciones de Loop 10 y hay que contrastarla con ese documento.

## 3. AI Workforce Router
| Campo | Loop 10 | Loop 10A |
|---|---|---|
| Equipo, responsable, prioridad, estado y próxima acción | Sí | Sí (T101) |
| **Evidencia** | Implícita en «Por qué» | Fila propia con fuente, fecha y hora, y consentimiento. En la sugerencia que viene de la llamada se indica que la llamada fue simulada y no se realizó |
| Recorrido completo por equipo | T90 (pm) y T91 (la) | T102 cubre los tres equipos |

## 4. Conversation Intelligence
Sin cambios funcionales. Se verificó con T103 (lo simulado nunca aparece como ejecutado) y T104 (recorrido completo), además de T86–T89.
