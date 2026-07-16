"use client";

import { AutosPortalShell } from "@/components/system/AutosPortalShell";
import { useTheme } from "@/components/system/ThemeProvider";
import { useTenant } from "@/components/system/TenantProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TENANT_OPTIONS, TENANTS } from "@/lib/tenants";
import { VEHICLES_SEED } from "@/lib/vehicles";
import { fmtRD } from "@/lib/format";
import { cuota } from "@/lib/finance";
import { Moon, Sun } from "lucide-react";

/** Phase 1 smoke surface — full search UI lands in Fase 3. */
export default function VehiculosPage() {
  const { theme, toggleTheme } = useTheme();
  const { tenant, config, setTenant } = useTenant();
  const sample = VEHICLES_SEED[0]!;
  const monthly = Math.round(cuota(sample.price, 20, 60));

  return (
    <AutosPortalShell>
      <div className="mx-auto max-w-[1440px] px-[22px] py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">{config.sub}</p>
            <h1 className="font-manrope text-[clamp(28px,4vw,40px)] font-extrabold text-nk-fg">
              {config.name}
            </h1>
            <p className="mt-1 text-sm text-nk-fg-muted">
              Setup Fase 1 — design system listo ({VEHICLES_SEED.length} vehículos seed)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Tenant"
              className="h-10 min-h-10 rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm"
              value={tenant}
              onChange={(e) => setTenant(e.target.value as typeof tenant)}
            >
              {TENANT_OPTIONS.map((slug) => (
                <option key={slug} value={slug}>
                  {TENANTS[slug].name}
                </option>
              ))}
            </select>
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="transition hover:-translate-y-1 hover:shadow-nk-lg">
            <CardHeader>
              <CardTitle className="font-manrope">
                {sample.year} {sample.make} {sample.model}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className="aspect-[4/3] rounded-r"
                style={{ background: sample.grad }}
                aria-hidden
              />
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="font-manrope text-lg font-extrabold tabular-nums">{fmtRD(sample.price)}</p>
                  <p className="text-sm font-semibold text-brand tabular-nums">
                    {fmtRD(monthly)}/mes · 60 meses · 13.5% APR
                  </p>
                </div>
                <Badge variant="brandSoft">{sample.match}% match</Badge>
              </div>
              <Button variant="brand" className="w-full">
                Aplicar financiamiento
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-manrope">Tokens activos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-nk-fg-muted">
              <p>
                Tema: <strong className="text-nk-fg">{theme}</strong>
              </p>
              <p>
                Tenant: <strong className="text-nk-fg">{tenant}</strong>
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="h-8 w-8 rounded-r-sm bg-brand" title="brand" />
                <span className="h-8 w-8 rounded-r-sm bg-brand-2" title="brand-2" />
                <span className="h-8 w-8 rounded-r-sm bg-nk-success" title="success" />
                <span className="h-8 w-8 rounded-r-sm bg-nk-warning" title="warning" />
                <span className="h-8 w-8 rounded-r-sm bg-nk-danger" title="danger" />
              </div>
              <div className="mt-4 h-10 animate-nkShimmer rounded-r-sm bg-nk-surface-2" />
            </CardContent>
          </Card>
        </div>
      </div>
    </AutosPortalShell>
  );
}
