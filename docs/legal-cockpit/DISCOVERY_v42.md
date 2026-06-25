# Discovery v4.2 — Legal OS Cockpit
## Fecha: 2026-06-25

### Rutas legales existentes (18 pages + 1 legacy redirect)
- app/(forge)/legal/page.tsx
- app/(forge)/legal/audit/page.tsx
- app/(forge)/legal/cases/page.tsx
- app/(forge)/legal/cases/new/page.tsx
- app/(forge)/legal/cases/[id]/page.tsx
- app/(forge)/legal/cases/[id]/archive/page.tsx
- app/(forge)/legal/cases/[id]/deadlines/page.tsx
- app/(forge)/legal/cases/[id]/documents/page.tsx
- app/(forge)/legal/cases/[id]/issues/page.tsx
- app/(forge)/legal/cases/[id]/related/page.tsx
- app/(forge)/legal/cases/[id]/risk/page.tsx
- app/(forge)/legal/cases/[id]/snapshots/page.tsx
- app/(forge)/legal/cases/[id]/strategy/page.tsx
- app/(forge)/legal/cases/[id]/timeline/page.tsx
- app/(forge)/legal/config/page.tsx
- app/(forge)/legal/contracts/page.tsx
- app/(forge)/legal/research/page.tsx
- app/(forge)/legal/strategies/historical/page.tsx
- app/legal-hub/page.tsx (legacy redirect → /legal/cases)

### Discovery Results
- /legal/guide existe: NO — se creará
- /legal/agents existe: NO — se usará /legal/agents como ruta nueva (solo lista, no [id])
- /legal/agents/[id] existe: NO — se usa query param: /legal/agents?agent=<id>
- /legal/quick-check existe: NO — fallback panel proporcionado
- Proxy /api/legal/* confirmado: SI (next.config.js line 287-288, maps to backend /api/v1/legal/*)
- Iconos: LUCIDE — lucide-react ^0.400.0 instalado. Tabler NO instalado.
- Tailwind config: tailwind.config.js (no .ts). Sin colores custom — usa defaults de Tailwind.
- Colores seguros verificados: violet, zinc, emerald, amber, red, blue, teal (todos default Tailwind)
- TenantContext: contexts/TenantContext.tsx — export function useTenant()
- useTenant import correcto: `import { useTenant } from "@/contexts/TenantContext"`
