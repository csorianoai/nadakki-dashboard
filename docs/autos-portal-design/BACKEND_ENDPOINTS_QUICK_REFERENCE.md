# Backend Endpoints Quick Reference

## Base URL
http://localhost:8000

## Autenticacion
Header: X-Tenant-ID: <uuid del tenant>
Header: Authorization: Bearer <JWT> (para endpoints protegidos)

## Endpoints principales

### Vehiculos

- POST /api/v1/autos/vehicles/search
  Body: { query?, brands[], types[], provinces[], years[], fuels[], maxMonthly?, initial?, sort?, page?, per_page? }
  Response: { vehicles[], total, page, per_page }

- GET /api/v1/autos/vehicles/{vehicle_id}
  Response: { vehicle: Vehicle }

- GET /api/v1/autos/vehicles/search/facets
  Response: { makes[], types[], provinces[], years[], fuels[] }

- GET /api/v1/autos/vin/{vin}/decode
  Response: { make, model, year, engine, transmission, ... }

### Financiamiento

- POST /api/v1/autos/tenants/{tenant_id}/dealers/{dealer_id}/leads
  Body: { vehicle_id, buyer_data }

- POST /api/v1/autos/finance/calculate
  Body: { price, down_pct, term_months }
  Response: { monthly_payment, apr, total }

### AI Endpoints

- POST /api/v1/autos_ai/conversational_search
  Body: { query, session_id? }
  Response: { vehicles[], intent, message }

- POST /api/v1/autos_ai/concierge/message
  Body: { session_id, message, context: { vehicle_id? } }
  Response: { message, recommendations[] }

- POST /api/v1/autos_ai/match_my_approval
  Body: { approval_data }
  Response: { compatible_vehicles[] }

- POST /api/v1/autos_ai/price_confidence
  Body: { vehicle_id }
  Response: { status, range: { lo, mid, hi, top }, message }

- POST /api/v1/autos_ai/voice_search
  Body: { audio_transcript }
  Response: { vehicles[], parsed_filters }

## Errores comunes

- 401: Falta JWT o invalido - mostrar toast, redirigir a /login
- 403: Falta X-Tenant-ID - configurar en interceptor
- 404: Vehicle no existe - mostrar 404 page
- 500: Backend error - fallback a mock, mostrar toast

## Fallback pattern

try { const data = await api.searchVehicles(filters); return data; }
catch (error) { console.warn("Backend down, using mock"); return { vehicles: VEHICLES_SEED, total: 10 }; }

## Fuente autoritativa

Ver backend-openapi.json en este mismo directorio para la spec
OpenAPI 3.1 completa exportada del backend en ejecucion.
