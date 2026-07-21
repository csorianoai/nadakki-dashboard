# useCartStore

Hook exportado desde `components/autos/CartProvider.tsx`. Requiere `CartProvider` en el árbol (layout `/autos`).

## Acciones

- `addVehicle(input)` — deduplica por `vehicle_id`, valida `tenant_id`
- `removeVehicle(vehicleId)`
- `toggleCompare()`, `addToCompare(id)`, `removeFromCompare(id)`, `clearCompare()`
- `generateShareUrl()` / `getShareToken()` / `loadFromShareUrl(token)`
- `cartCount()`, `compareCount()`, `isInCart(id)`

## Storage

Clave: `autos_cart_${tenantUuid}` en **sessionStorage**.
