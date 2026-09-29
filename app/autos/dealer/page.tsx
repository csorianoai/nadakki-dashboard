"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  BarChart3,
  Car,
  CircleDollarSign,
  Clock,
  HandCoins,
  MessageSquare,
  PackagePlus,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react";
import { CORE_NAV_CAPABILITY_KEYS, isAccessQueryFailClosed } from "@/components/dealer/CoreNavigation";
import { DealerSponsorshipBanner } from "@/components/dealer/DealerSponsorshipBanner";
import { UpgradeModal } from "@/components/dealer/UpgradeModal";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { DealerModuleGrid } from "@/components/dealer-management/DealerModuleGrid";
import { DealerOperationsHeader } from "@/components/dealer-management/DealerOperationsHeader";
import { BloqueEstadoView } from "@/components/dealer-management/inicio/BloqueEstado";
import { KpiCard } from "@/components/dealer-management/inicio/KpiCard";
import { getAccessClientContext } from "@/lib/access/client";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import type { BloqueEstado } from "@/lib/dealer-management/bloque-estado";
import { formateaDias, formateaEntero, localeDeTenant } from "@/lib/dealer-management/formato";
import {
  PEDIDOS_INICIO,
  TOPE_ANTIGUEDAD,
  fetchAntiguedad,
  fetchLeads,
  fetchMensajesSinLeer,
} from "@/lib/dealer-management/inicio-datos";

/** Estado de un bloque a partir de una query de react-query. */
function estadoDeQuery(query: {
  isPending: boolean;
  isLoading: boolean;
  isError: boolean;
  data: unknown;
}): BloqueEstado {
  if (query.isPending || query.isLoading) return { caso: "cargando" };
  if (query.isError || query.data == null) return { caso: "error" };
  return { caso: "ok" };
}

const NO_DISPONIBLE = (pedido: string): BloqueEstado => ({ caso: "no_disponible", pedido });

export default function DealerInicioPage() {
  const contexto = getAccessClientContext();
  const dealerId = contexto?.dealerId ?? null;
  const tenantId = contexto?.tenantId ?? null;
  const branding = useDealerManagementBranding();
  const locale = localeDeTenant(branding.data);

  const antiguedad = useQuery({
    queryKey: ["dealer-inicio-antiguedad", dealerId ?? "none"],
    queryFn: () => fetchAntiguedad(dealerId as string),
    enabled: Boolean(dealerId),
    retry: false,
    staleTime: 60_000,
  });

  const leads = useQuery({
    queryKey: ["dealer-inicio-leads", tenantId ?? "none", dealerId ?? "none"],
    queryFn: () => fetchLeads(tenantId as string, dealerId as string),
    enabled: Boolean(tenantId && dealerId),
    retry: false,
    staleTime: 60_000,
  });

  const mensajes = useQuery({
    queryKey: ["dealer-inicio-mensajes", tenantId ?? "none"],
    queryFn: fetchMensajesSinLeer,
    enabled: Boolean(tenantId),
    retry: false,
    staleTime: 60_000,
  });

  const stock = antiguedad.data;
  const estadoStock = estadoDeQuery(antiguedad);
  const estadoLeads = estadoDeQuery(leads);
  const estadoMensajes = estadoDeQuery(mensajes);

  const vehiculosMas90 = stock?.tramos.mas90 ?? 0;

  return (
    <main className="space-y-6">
      <DealerOperationsHeader />

      {/* ── Los dos minutos: que gano, que gasto, que debo ───────────────── */}
      <section aria-labelledby="inicio-kpis" className="space-y-3">
        <h2 id="inicio-kpis" className="font-dealer-display text-lg font-bold text-[var(--fg)]">
          Tu negocio hoy
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            etiqueta="Vehículos en stock"
            icono={Car}
            tono="neutro"
            href="/autos/dealer/inventario"
            estado={estadoStock}
            onReintentar={() => void antiguedad.refetch()}
            valor={stock ? formateaEntero(stock.total, locale) : undefined}
            contexto={stock ? `${formateaEntero(stock.medidos, locale)} con antigüedad medida` : undefined}
          />

          <KpiCard
            etiqueta="Días promedio en stock"
            icono={Clock}
            tono={stock?.promedioDias != null && stock.promedioDias > 90 ? "revisar" : "neutro"}
            href="/autos/dealer/inventario?antiguedad=90"
            estado={
              estadoStock.caso === "ok" && stock?.promedioDias == null
                ? { caso: "vacio", motivo: "Ningún vehículo tiene fecha de compra registrada todavía." }
                : estadoStock
            }
            onReintentar={() => void antiguedad.refetch()}
            valor={stock?.promedioDias != null ? formateaDias(stock.promedioDias, locale) : undefined}
            contexto={
              stock?.truncado
                ? `Medido sobre los primeros ${formateaEntero(TOPE_ANTIGUEDAD, locale)} vehículos`
                : undefined
            }
          />

          <KpiCard
            etiqueta="Carros vendidos (mes)"
            icono={TrendingUp}
            tono="ok"
            href="/autos/dealer/finanzas"
            estado={NO_DISPONIBLE(PEDIDOS_INICIO.resumenFinanciero)}
          />

          <KpiCard
            etiqueta="Beneficio y gastos (mes)"
            icono={CircleDollarSign}
            tono="ok"
            href="/autos/dealer/finanzas"
            estado={NO_DISPONIBLE(PEDIDOS_INICIO.resumenFinanciero)}
          />

          <KpiCard
            etiqueta="Comisiones a vendedores"
            icono={HandCoins}
            tono="revisar"
            href="/autos/dealer/finanzas"
            estado={NO_DISPONIBLE(PEDIDOS_INICIO.costosPorVehiculo)}
          />

          <KpiCard
            etiqueta="Cuentas por pagar"
            icono={ReceiptText}
            tono="urgente"
            href="/autos/dealer/finanzas"
            estado={NO_DISPONIBLE(PEDIDOS_INICIO.cuentasPorPagar)}
          />
        </div>
      </section>

      {/* ── Alertas con accion directa (ficha 1.2) ───────────────────────── */}
      {estadoStock.caso === "ok" && vehiculosMas90 > 0 ? (
        <section aria-labelledby="inicio-alertas">
          <h2 id="inicio-alertas" className="sr-only">
            Alertas
          </h2>
          <div
            className="flex flex-wrap items-center gap-3 rounded-[var(--r)] border p-4"
            style={{ borderColor: "var(--warning)", background: "var(--warning-soft)" }}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: "var(--warning)" }}
              aria-hidden="true"
            />
            <p className="min-w-0 flex-1 text-sm text-[var(--fg)]">
              <span className="font-bold" style={{ color: "var(--warning)" }}>
                Atención ·{" "}
              </span>
              <span className="font-semibold">
                {formateaEntero(vehiculosMas90, locale)}{" "}
                {vehiculosMas90 === 1 ? "vehículo lleva" : "vehículos llevan"} más de 90 días en
                stock
              </span>
            </p>
            <Link
              href="/autos/dealer/inventario?antiguedad=90"
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-[var(--on-brand)] hover:bg-[var(--brand-strong)] focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
            >
              Ver {formateaEntero(vehiculosMas90, locale)}
            </Link>
          </div>
        </section>
      ) : null}

      {/* ── Tareas de hoy: derivadas del estado real, un clic al caso ────── */}
      <section aria-labelledby="inicio-tareas" className="space-y-3">
        <h2 id="inicio-tareas" className="font-dealer-display text-lg font-bold text-[var(--fg)]">
          Qué tienes que hacer hoy
        </h2>
        <ul className="grid gap-3 md:grid-cols-3">
          <TareaCard
            icono={Users}
            titulo="Leads sin contactar"
            descripcion="Personas que preguntaron por un vehículo y aún no tienen respuesta."
            href="/autos/dealer/leads?estado=nuevo"
            estado={estadoLeads}
            onReintentar={() => void leads.refetch()}
            cantidad={leads.data?.sinContactar}
            locale={locale}
            vacio="No hay leads pendientes de contactar."
          />
          <TareaCard
            icono={MessageSquare}
            titulo="Mensajes sin leer"
            descripcion="Respuestas del banco en tus solicitudes de financiamiento."
            href="/credit-hub/dealer"
            estado={estadoMensajes}
            onReintentar={() => void mensajes.refetch()}
            cantidad={mensajes.data}
            locale={locale}
            vacio="No tienes mensajes sin leer."
          />
          <TareaCard
            icono={Banknote}
            titulo="Vehículos sin costo completo"
            descripcion="Autos a los que les falta registrar lo que costaron."
            href="/autos/dealer/finanzas"
            estado={NO_DISPONIBLE(PEDIDOS_INICIO.costosPorVehiculo)}
            locale={locale}
            vacio=""
          />
        </ul>
      </section>

      {/* ── Accesos a modulos, solo los habilitados (ficha 1.5) ──────────── */}
      <DealerModuleGrid />

      {/* ── Accesos rapidos privilegiados ────────────────────────────────
          Se conservan de la version anterior: son la superficie que fija
          DealerQuickLinks (fail-closed, sin KPI inventados). */}
      <AccesosRapidos />
    </main>
  );
}

const ACCESOS_RAPIDOS = [
  {
    href: "/autos/dealer/publicar-rapido" as const,
    capability: "autos.inventory.create",
    icon: PackagePlus,
    title: "Publicar vehículo",
    desc: "Abre el flujo de publicación existente.",
  },
  {
    href: "/autos/dealer/leads" as const,
    capability: "autos.leads.crm",
    icon: Users,
    title: "Leads",
    desc: "Gestiona los leads disponibles para este dealer.",
  },
  {
    href: "/autos/dealer/insights" as const,
    capability: "autos.analytics.basic",
    icon: BarChart3,
    title: "Insights",
    desc: "Consulta señales operativas disponibles.",
  },
];

const CAPACIDADES_ACCESOS = Array.from(
  new Set([...CORE_NAV_CAPABILITY_KEYS, ...ACCESOS_RAPIDOS.map((card) => card.capability)]),
);

function AccesosRapidos() {
  const query = useAccessEntitlementsBatch(CAPACIDADES_ACCESOS);
  const failClosed = isAccessQueryFailClosed(query);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const hayUpgrade = Object.values(query.data?.results ?? {}).some(
    (decision) => decision.allowed === false && decision.reason_code === "UPGRADE_REQUIRED",
  );

  return (
    <>
      {hayUpgrade ? (
        <div className="flex justify-end">
          <button
            type="button"
            data-testid="dealer-upgrade-cta"
            onClick={() => setUpgradeOpen(true)}
            className="inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] px-4 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
          >
            Mejora tu plan
          </button>
        </div>
      ) : null}

      {upgradeOpen && hayUpgrade ? (
        <UpgradeModal
          decision={{ allowed: false, reason_code: "UPGRADE_REQUIRED" }}
          onClose={() => setUpgradeOpen(false)}
        />
      ) : null}

      <DealerSponsorshipBanner />

      <section data-testid="dealer-quick-links" data-fail-closed={failClosed ? "true" : "false"}>
        <h2 className="mb-3 font-dealer-display text-base font-bold text-[var(--fg)]">
          Accesos rápidos
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {ACCESOS_RAPIDOS.map((card) => {
            const allowed = !failClosed && query.data?.results[card.capability]?.allowed === true;
            if (!allowed) return null;
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                data-testid="privileged-quick-link"
                data-capability={card.capability}
                data-allowed="true"
                className="rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
              >
                <Icon className="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
                <p className="mt-3 font-dealer-display text-sm font-bold text-[var(--fg)]">
                  {card.title}
                </p>
                <p className="mt-1 text-xs text-[var(--fg-muted)]">{card.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

function TareaCard({
  icono: Icono,
  titulo,
  descripcion,
  href,
  estado,
  onReintentar,
  cantidad,
  locale,
  vacio,
}: {
  icono: typeof Users;
  titulo: string;
  descripcion: string;
  href: string;
  estado: BloqueEstado;
  onReintentar?: () => void;
  cantidad?: number;
  locale: ReturnType<typeof localeDeTenant>;
  vacio: string;
}) {
  const resuelto = estado.caso === "ok";
  const sinPendientes = resuelto && (cantidad ?? 0) === 0;

  const cuerpo = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <Icono className="h-4 w-4" aria-hidden="true" />
        </span>
        {resuelto && !sinPendientes ? (
          <span className="font-dealer-numeric text-2xl font-bold text-[var(--brand)]">
            {formateaEntero(cantidad ?? 0, locale)}
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-dealer-display text-sm font-bold text-[var(--fg)]">{titulo}</p>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">{descripcion}</p>
      <div className="mt-2">
        {sinPendientes ? (
          <p className="text-xs text-[var(--fg-muted)]">{vacio}</p>
        ) : (
          <BloqueEstadoView estado={estado} titulo={titulo} onReintentar={onReintentar} />
        )}
      </div>
    </>
  );

  const clases =
    "block h-full rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]";

  return (
    <li>
      {resuelto && !sinPendientes ? (
        <Link
          href={href}
          className={`${clases} transition hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:shadow-[var(--ring)]`}
        >
          {cuerpo}
        </Link>
      ) : (
        <div className={clases}>{cuerpo}</div>
      )}
    </li>
  );
}
