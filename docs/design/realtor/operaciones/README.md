# Operaciones (O2-P-OPERACIONES)

Pantalla `/realtor/operaciones` sobre el armazón DL10A; referencia visual `../DL10A/ref/operaciones.png`.
- Pipeline de las 7 etapas del alquiler (Propiedad → Cierre) con el número de expedientes por etapa.
- La venta no tiene expediente en la Ola 2 (D2-3): aparece solo como «Oportunidades de venta», sin etapa.
- Filtro: tipo de operación. Ningún dato ni filtro de clase protegida (el idioma preferido tampoco filtra).
- Sin fuente conectada (fuera de DEMO): «Sin datos todavía», sin cifras. DEMO solo con `NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1"`.
- Sin backend propio en la Ola 2: la única llamada es `/acceso`, sin tenant.
- Finanzas (O2-F-OPERACIONES): bloque bajo el pipeline con comisión bruta, comisión, reparto y cierres (`fin-*`). Datos SYNTH solo en DEMO; fuera de DEMO no se pinta (cae en «Sin datos todavía»).
