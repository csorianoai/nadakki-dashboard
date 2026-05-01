"use client";

/**
 * Marketing calendar: campañas desde GET /api/marketing/campaigns (tenant por X-Tenant-ID).
 * UI basada en app/content/calendar/page.tsx — datos reales del backend, sin inventar filas.
 */
import { useMemo, useState, useCallback } from "react";
import { motion } from "@/lib/motion-stub";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import { useTenant } from "@/contexts/TenantContext";
import { useMarketingCampaigns } from "@/hooks/useMarketingCampaigns";
import { patchMarketingCampaignStatus } from "@/lib/api/marketing";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  email: "#22c55e",
  meta: "#1877F2",
  default: "#a78bfa",
};

function getPublishDate(row: Record<string, unknown>): Date | null {
  const sched = row.schedule;
  if (!sched || typeof sched !== "object") return null;
  const at = (sched as Record<string, unknown>).publish_at;
  if (typeof at !== "string" || !at.trim()) return null;
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? null : d;
}

function typeToPlatform(type: string): string {
  const t = type.toLowerCase();
  if (t === "email") return "email";
  if (t === "meta" || t.includes("facebook") || t.includes("instagram")) return "instagram";
  return "email";
}

/** Shape esperado por la rejilla (como SCHEDULED_POSTS en content/calendar). */
type CalendarCellItem = {
  day: number;
  platform: string;
  title: string;
  id: string;
  status: string;
};

function campaignId(row: Record<string, unknown>): string {
  return String(row.id ?? "").trim();
}

function mapRowToCellItem(
  row: Record<string, unknown>,
  month: number,
  year: number
): CalendarCellItem | null {
  const id = campaignId(row);
  if (!id) return null;
  const d = getPublishDate(row);
  if (!d || d.getUTCMonth() !== month || d.getUTCFullYear() !== year) return null;
  return {
    day: d.getUTCDate(),
    platform: typeToPlatform(String(row.type ?? "email")),
    title: String(row.name ?? "—"),
    id,
    status: String(row.status ?? ""),
  };
}

export default function MarketingCalendarPage() {
  const { tenantId } = useTenant();
  const { campaigns, total, loading, error, source, refresh } = useMarketingCampaigns();
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [patchingId, setPatchingId] = useState<string | null>(null);

  const cellItems = useMemo(() => {
    return campaigns
      .map((row) => mapRowToCellItem(row, currentMonth, currentYear))
      .filter((x): x is CalendarCellItem => x !== null);
  }, [campaigns, currentMonth, currentYear]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const campaignsForSelectedDay = useMemo(() => {
    if (selectedDay === null) return [];
    return cellItems.filter((p) => p.day === selectedDay);
  }, [cellItems, selectedDay]);

  const unscheduledRows = useMemo(() => {
    return campaigns.filter((row) => {
      const id = campaignId(row);
      if (!id) return false;
      const d = getPublishDate(row);
      return d === null;
    });
  }, [campaigns]);

  const onPatch = useCallback(
    async (id: string, status: "approved" | "rejected") => {
      if (!tenantId) {
        setPatchError("Selecciona un tenant para actualizar la campaña.");
        return;
      }
      setPatchError(null);
      setPatchingId(id);
      const r = await patchMarketingCampaignStatus(tenantId, id, status);
      setPatchingId(null);
      if (!r.ok) {
        setPatchError(r.error ?? `HTTP ${r.status}`);
        return;
      }
      await refresh();
    },
    [tenantId, refresh]
  );

  const noTenant = !tenantId;

  return (
    <div className="ndk-page ndk-fade-in min-h-screen text-white p-6">
      <NavigationBar backHref="/marketing">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400">Calendario de campañas</span>
          <DataSourceBadge source={source} error={error} />
        </div>
      </NavigationBar>

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-4 mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white m-0">Calendario</h1>
            <p className="text-gray-400 text-sm m-0 mt-1">
              {noTenant
                ? "Selecciona un tenant en la barra superior"
                : loading
                  ? "Cargando campañas…"
                  : `${total} campaña(s) · programación según schedule.publish_at`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading || noTenant}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-gray-200 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Actualizar
        </button>
      </motion.div>

      {noTenant && (
        <GlassCard className="p-6 mb-6 border-amber-500/30 bg-amber-500/5">
          <p className="text-amber-100/90 text-sm m-0">
            No hay <code className="text-amber-200/90">tenant</code> activo. El calendario usa el mismo
            contexto multi-tenant que el resto del dashboard (<code className="text-amber-200/90">X-Tenant-ID</code>).
          </p>
        </GlassCard>
      )}

      {error && source === "fallback" && !noTenant && (
        <GlassCard className="p-4 mb-6 border-amber-500/30 bg-amber-500/5">
          <p className="text-amber-200/90 text-sm m-0">
            No se pudo cargar el API ({error}). Revisa conexión o proxy.
          </p>
        </GlassCard>
      )}

      {patchError && (
        <GlassCard className="p-4 mb-6 border-red-500/40 bg-red-500/10">
          <p className="text-red-200 text-sm m-0">{patchError}</p>
        </GlassCard>
      )}

      {loading && !noTenant ? (
        <div className="flex justify-center py-20 text-gray-400 text-sm">Cargando calendario…</div>
      ) : !noTenant && campaigns.length === 0 && source === "live" ? (
        <GlassCard className="p-12 text-center border-white/10">
          <p className="text-gray-400 m-0">No hay campañas para este tenant.</p>
          <p className="text-gray-500 text-xs mt-2 m-0">
            Datos desde <code className="text-gray-400">GET /api/marketing/campaigns</code>.
          </p>
        </GlassCard>
      ) : noTenant ? null : (
        <>
          <GlassCard className="p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 hover:bg-white/10 rounded-lg"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h2 className="text-xl font-bold text-white">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 hover:bg-white/10 rounded-lg"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const posts = cellItems.filter((p) => p.day === day);
                const isToday =
                  day === new Date().getDate() &&
                  currentMonth === new Date().getMonth() &&
                  currentYear === new Date().getFullYear();
                const isSelected = selectedDay === day;

                return (
                  <motion.button
                    type="button"
                    key={day}
                    onClick={() => setSelectedDay(posts.length ? day : null)}
                    whileHover={{ scale: 1.02 }}
                    className={`aspect-square p-2 rounded-xl text-left transition-colors border ${
                      isSelected
                        ? "bg-purple-500/25 border-purple-500/50"
                        : isToday
                          ? "bg-purple-500/15 border-purple-500/40"
                          : "bg-white/5 border-transparent hover:bg-white/10"
                    }`}
                  >
                    <div
                      className={`text-sm font-medium ${isToday || isSelected ? "text-purple-300" : "text-gray-400"}`}
                    >
                      {day}
                    </div>
                    <div className="mt-1 space-y-1 max-h-16 overflow-hidden">
                      {posts.slice(0, 4).map((post) => {
                        const color =
                          PLATFORM_COLORS[post.platform] ?? PLATFORM_COLORS.default;
                        return (
                          <div
                            key={post.id}
                            className="w-full h-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                            title={`${post.title} (${post.status})`}
                          />
                        );
                      })}
                      {posts.length > 4 && (
                        <div className="text-[10px] text-gray-500">+{posts.length - 4}</div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-6 border-t border-white/10">
              {Object.entries(PLATFORM_COLORS)
                .filter(([k]) => k !== "default")
                .map(([platform, color]) => (
                  <div key={platform} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-400 capitalize">{platform}</span>
                  </div>
                ))}
            </div>
          </GlassCard>

          {selectedDay !== null && (
            <GlassCard className="p-6 mb-8 border-white/10">
              <h3 className="text-lg font-semibold text-white mt-0 mb-4">
                Día {selectedDay} — {campaignsForSelectedDay.length} campaña(s)
              </h3>
              {campaignsForSelectedDay.length === 0 ? (
                <p className="text-gray-500 text-sm m-0">Nada programado este día.</p>
              ) : (
                <ul className="space-y-3 list-none p-0 m-0">
                  {campaignsForSelectedDay.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
                    >
                      <div>
                        <div className="font-medium text-white">{p.title}</div>
                        <div className="text-xs text-gray-400">
                          {p.platform} · estado: {p.status}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={patchingId === p.id}
                          onClick={() => void onPatch(p.id, "approved")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/85 hover:bg-emerald-500 text-white text-xs font-medium disabled:opacity-50"
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          disabled={patchingId === p.id}
                          onClick={() => void onPatch(p.id, "rejected")}
                          className="px-3 py-1.5 rounded-lg bg-red-500/25 hover:bg-red-500/35 border border-red-500/40 text-red-100 text-xs font-medium disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          )}

          <GlassCard className="p-6 mb-8 border-white/10">
            <h3 className="text-lg font-semibold text-white mt-0 mb-2">Todas las campañas</h3>
            <p className="text-gray-500 text-sm mb-4 m-0">
              Aprobar o rechazar actualiza el estado vía{" "}
              <code className="text-gray-400">PATCH /api/marketing/campaigns/{"{id}"}</code>.
            </p>
            <ul className="space-y-3 list-none p-0 m-0">
              {campaigns
                .filter((r) => campaignId(r))
                .map((row) => {
                  const id = campaignId(row);
                  const d = getPublishDate(row);
                  const title = String(row.name ?? "—");
                  const st = String(row.status ?? "—");
                  return (
                    <li
                      key={id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
                    >
                      <div>
                        <div className="font-medium text-white">{title}</div>
                        <div className="text-xs text-gray-400">
                          {d ? d.toISOString() : "Sin publish_at"} · {st}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={patchingId === id}
                          onClick={() => void onPatch(id, "approved")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/85 hover:bg-emerald-500 text-white text-xs font-medium disabled:opacity-50"
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          disabled={patchingId === id}
                          onClick={() => void onPatch(id, "rejected")}
                          className="px-3 py-1.5 rounded-lg bg-red-500/25 hover:bg-red-500/35 border border-red-500/40 text-red-100 text-xs font-medium disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </GlassCard>

          {unscheduledRows.length > 0 && (
            <GlassCard className="p-6 border-amber-500/20 bg-amber-500/5">
              <h3 className="text-lg font-semibold text-amber-100 mt-0 mb-2">
                Sin fecha programada ({unscheduledRows.length})
              </h3>
              <p className="text-amber-100/70 text-xs m-0 mb-3">
                Estas filas no tienen <code>schedule.publish_at</code>; siguen en el listado general arriba.
              </p>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
