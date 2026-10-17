# Property Intelligence (PI-D2)

Ruta `/realtor/property-intel/<propiedad>[?unit=<unidad>]`, construida contra C-PI 1.0.0 (congelado) por el BFF `/api/v1/realestate/property-intel`.
Secciones: señales (signal-refs), hechos (conteos derivados, nunca inventados), competidores (advertiser-links; proposed → confirmed/rejected solo por clic humano con motivo), documentos (pending/stored; pending nunca se pinta como almacenado) y gate de registro (broker-policies).
Estados: 200 ok · 401 sesión terminada · 404 sección oculta · 503 no disponible · otros error. Sin Bearer no se envía la petición. El navegador no envía tenant.
DEMO: solo con `NEXT_PUBLIC_REALTOR_ALLOW_DEMO=1`, solo si no hubo llamada al backend y solo para el HQ sintético del tenant QA.

NECESITA_DECISION (DASH-REALTOR): este PR no toca el registro de centros ni la barra. Entrada propuesta: en `lib/realtor/propiedades/center.ts` no hace falta cambio; añadir en la ficha de propiedad un enlace a `/realtor/property-intel/<id>`.
