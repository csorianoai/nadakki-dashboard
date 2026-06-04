# Provisioning demo.admin para nadakki-demo tenant

## Objetivo
demo.admin@nadakki-demo.com debe poder operar en tenant nadakki-demo
con roles admin, bank_analyst, dealer, platform_superadmin.

## Pre-requisitos
- Supabase dashboard access
- Tenant nadakki-demo ya existe (UUID d3b00111-0000-0000-0000-000000d3b001)
- User demo.admin ya existe (UUID 7bc892ef-76c1-4e21-bda9-cc79ce6b5f3d)

## SQL VERIFICACION (ejecutar primero)

```sql
-- Verificar usuario existe
SELECT id, email, created_at FROM users
WHERE email = 'demo.admin@nadakki-demo.com';

-- Verificar memberships actuales
SELECT utm.*, t.name AS tenant_name
FROM user_tenant_memberships utm
  JOIN tenants t ON t.id = utm.tenant_id
WHERE utm.user_id = '7bc892ef-76c1-4e21-bda9-cc79ce6b5f3d';

-- Verificar tenant nadakki-demo
SELECT id, slug, name FROM tenants
WHERE id = 'd3b00111-0000-0000-0000-000000d3b001';
```

## SQL FIX (ejecutar despues de verificar)

```sql
-- Upsert membership en nadakki-demo con roles completos:
INSERT INTO user_tenant_memberships (
  user_id,
  tenant_id,
  roles,
  status,
  is_default,
  created_at,
  updated_at
) VALUES (
  '7bc892ef-76c1-4e21-bda9-cc79ce6b5f3d',
  'd3b00111-0000-0000-0000-000000d3b001',
  ARRAY['admin', 'bank_analyst', 'dealer', 'platform_superadmin']::text[],
  'active',
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  roles = EXCLUDED.roles,
  status = 'active',
  is_default = TRUE,
  updated_at = NOW();
```

## SQL VERIFICACION POST-FIX

```sql
-- Confirmar membership activa con is_default = TRUE
SELECT utm.*, t.name AS tenant_name
FROM user_tenant_memberships utm
  JOIN tenants t ON t.id = utm.tenant_id
WHERE utm.user_id = '7bc892ef-76c1-4e21-bda9-cc79ce6b5f3d'
  AND utm.tenant_id = 'd3b00111-0000-0000-0000-000000d3b001';
```

## POST-FIX (manual)
1. demo.admin debe hacer logout + login fresco
2. Verificar localStorage tiene tenant_id = d3b00111-0000-0000-0000-000000d3b001
3. Probar bank queue carga datos
4. Probar /api/v2/credit/applications returns 200
