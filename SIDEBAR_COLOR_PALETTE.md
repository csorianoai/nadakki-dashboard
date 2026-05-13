# Sidebar color palette (PR: vibrant redesign)

Design reference for `ForgeGlobalCoresSidebar` and `forge-sidebar-core-themes.ts`.

## Principles

- **Dark rail**: `bg-zinc-950`, borders `zinc-800`, body text `zinc-200` / muted `zinc-400`.
- **One accent family per hub** (icon tile, expanded rail, active link, glow).
- **Badges**: emerald (NEW), amber (BETA), pink (POPULAR).
- **Brand strip**: gradient wordmark `violet → fuchsia → pink` when no tenant logo.

## Core identities

| Hub | Primary (Tailwind) | Hex (approx.) | Icon | Notes |
|-----|---------------------|---------------|------|--------|
| **Credit** | `amber-400` / `amber-500` | #FBBF24 / #F59E0B | `Building2` | Gold / financial |
| **Legal** | `violet-400` / `violet-500` | #A78BFA / #8B5CF6 | `Scale` | Product legal thread |
| **Marketing** | `pink-400` / `pink-500` | #F472B6 / #EC4899 | `Megaphone` | Creative / growth |
| **SIC** | `emerald-400` / `emerald-500` | #34D399 / #10B981 | `Wallet` | Cobros / money |
| **Workflows** | `cyan-400` / `cyan-500` | #22D3EE / #06B6D4 | `Workflow` | Automation |
| **Admin** | `slate-300` / `slate-400` | #CBD5E1 / #94A3B8 | `Settings` | Platform / neutral |

## Applied tokens (implementation)

Each theme in `SIDEBAR_CORE_THEMES` defines:

- **`iconBox` / `iconText`**: rounded tile behind the section icon (`*/15` opacity backgrounds).
- **`borderExpanded`**: `border-l-*` on the open section header.
- **`linkActiveBg` / `linkActiveText` / `linkActiveBorder`**: active route row (`border-l-2`, soft shadow `shadow-*-500/20`).
- **`sectionTint`**: subtle inset tint when a block is expanded.
- **`gradient`**: reserved for future headers / marketing (not all used in v1).

## Role chip (footer)

Maps `activeRole.core_name` via `roleAccentClasses`:

| `core_name` | Style |
|-------------|--------|
| `credit` | Amber border / fill |
| `legal` | Violet |
| `marketing` | Pink |
| `sic` | Emerald |
| `platform` | Slate |
| default | Zinc |

## Persistence

Expand/collapse state: `localStorage` key `forge-global-sidebar-expanded-v1` (unchanged).

## Files

- `components/forge/layout/forge-sidebar-core-themes.ts` — palette + `getSidebarTheme`
- `components/forge/layout/ForgeGlobalCoresSidebar.tsx` — UI
- `components/forge/layout/forge-global-sidebar-nav.ts` — structure / RBAC (unchanged URLs)
