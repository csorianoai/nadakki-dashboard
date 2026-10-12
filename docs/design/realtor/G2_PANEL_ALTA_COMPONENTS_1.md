# G2-PANEL-ALTA · PARTE 1 · Licencia y Broker
COMPONENTS_ONLY / NO_RUNTIME_EXPOSURE.
DESIGN_IN_REVIEW · CONTRACT_PENDING · BLOCKED_SECURITY_DEPENDENCY.
Referencia de censo: PR #772, HEAD 7f51bee96fd7cf64b35346dcb3f6aec72a715b75; sin modificar.
Base: 5c7acd85ef5b3185948e2b4fa8f1ebbaedc7146e (origin/main verificado).
Rama: codex/realtor-alta-license-broker. HEAD final: metadatos del PR de esta parte.

## Diseño identificado
ZIP externo: Nadakki realtor OS design loop 03 (14).zip.
SHA256: C883E9B226CE59831AFB22D0922914A4CB64855684CB636683A727C8358EF311.
Identificador interno: Nadakki_Realtor_OS_DL10A_FINAL_GATE, versión Design Loop 10A, 2026-10-11.
Leídos: DL10A_FINAL_GATE_REPORT.md, MATRIZ_CONTRACTUAL_DL10A.md, LIMITACIONES_DL10A.md;
inspeccionados Nadakki Realtor OS DL10A.dc.html y Nadakki_Realtor_OS_DL10A_autonomo.html.
Final Gate declara CONDITIONAL_ACCEPT y DESIGN_APPROVED: NO; no es VISUAL_ACCEPT del frontend.
La matriz trata Listing/Buyer Director y autonomía propuesta, no especifica un asistente de alta.
El editable conserva title «Design Loop 09 DEMO»: el informe y carpeta identifican 10A.
No se reutiliza la simulación del HTML, sus roles, almacenamiento ni datos.

Patrones adaptados: fondo #F3F5F7, tinta #13202B, acento #6FD3DC/#0B6E78;
tarjetas blancas, borde #DCE2E8, radios 8/12px, controles >=44px, etiquetas y errores inline.
Tipografía declarada IBM Plex Sans y Space Grotesk con Arial de respaldo.
No se empaquetan fuentes del ZIP en producto; integración tipográfica exacta pendiente.
Foco reforzado con #0B6E78 sobre blanco. Grilla de dos columnas pasa a una a <=480px.
Sin centros nuevos, navegación global ni controles de Marca/Canales.

## Autoridades consultadas
Backend snapshot: 82f03941fa5fb17a98742a45f2e70074b40b6e40.
- C-RE-KERNEL 1.0.0 congelado: docs/contracts/C-RE-KERNEL/schema.json y openapi.yaml.
  Cierre API #1807; merge cec7f79dc09b7f18717062f50ec6cd498198a19f.
- C-RE-ALTA 1.0.0 parcial: docs/contracts/C-RE-ALTA/schema.json (parte 1/4, #1811)
  y openapi.yaml (parte 2/4, #1826). #1826 ahora mergeado; no estaba en el censo anterior.
  OpenAPI sigue con 301 líneas, sin components ni rutas posteriores; contrato completo pendiente.
  Schema idéntico al censo (blob a79d1fb2a41c886d2364f8d1734693f6aa5db548).
No se confunde una definición contractual con una integración operativa.

| UI | Campo / autoridad | Validación local |
|---|---|---|
| Jurisdicción | KERNEL LicenseCreate.jurisdiction_code | Opción suministrada desde catálogo |
| Tipo de licencia | KERNEL LicenseCreate.license_type | Opción del pack de jurisdicción seleccionado |
| Número | KERNEL LicenseCreate.license_number | 1–64 caracteres; no verifica licencia |
| Firma opcional | ALTA AgentCreate.brokerage_id | UUID y pertenencia a opciones recibidas |
| Supervisor | ALTA SupervisionCreate.supervisor_agent_id | UUID y opción; obligatorio según SupervisionRequirement.required |
| Estado licencia | KERNEL LicenseStatus | Solo lectura; sin estado por defecto |
| Estado agente | ALTA AgentStatus | Solo lectura; ninguna transición local |

No se forma payload de negocio. holder_person_id/person_id/supervised_agent_id y tenant se resuelven
en futura integración autorizada. Fechas opcionales de licencia quedan fuera de esta parte.
La elegibilidad del supervisor, relación brokerage/tenant y aprobación son responsabilidad backend.
Los catálogos vacíos, pack ausente y capacidades no disponibles no habilitan acciones.
Las opciones por props son datos de presentación, nunca autoridad de acceso.
ES inicial; copia EN inyectable, sin crear proveedor, detector ni persistencia de idioma.

## Aislamiento y compuertas
Componentes no importados por app, layouts ni navegación. No fetch, credenciales, storage o callbacks de negocio.
«Revisar datos» valida y muestra el borrador local; «Continuar/Volver» cambia entre los dos pasos.
La revisión nunca cambia un estado de licencia, agente o broker.
Sin ruta de acceso: no se pretende resolver el gate de seguridad con un flag o componente cliente.
Integración bloqueada hasta backend verificable, contrato completo y diseño aprobado.
No se solicita VISUAL_ACCEPT ni TECH_ACCEPT. Sin merge; Marca/Canales requieren autorización posterior.

## Evidencias ejecutadas
PASS: Jest, 20 casos; TypeScript acotado a componentes/pruebas, sin emit; ESLint, cero advertencias.
PASS: React SSR renderToString + hydrateRoot en Chromium offline a 390/768/1024/1440px, flujo teclado/ratón.
PASS: errores, corrección, revisión, ida/vuelta y preservación de licencia/firma/supervisor; 28 capturas en evidence/part1.
PASS: firma y supervisión opcionales, pack/jurisdicciones/supervisores ausentes; axe WCAG 2/2.1 A/AA sin infracciones.
PASS: foco por teclado/cambio/error, outline visible >=3px, sin desbordamiento ni errores de consola/hidratación.
NOT_EXECUTED: integración backend, gate runtime, build global, CI remoto y navegación productiva.
Los resultados del ZIP no se presentan como pruebas de esta implementación. Fuentes de respaldo en capturas.
Comandos: Jest --runInBand --roots tests/realtor --runTestsByPath tests/realtor/license-broker.test.tsx;
tsc --noEmit --incremental false (entradas locales y css-modules.d.ts); eslint --max-warnings 0;
node tests/realtor/isolated-qa.cjs (webpack + loader local, temporales fuera de app, fuentes de respaldo).
