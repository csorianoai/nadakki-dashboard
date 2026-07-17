"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Car,
  MapPin,
  Sparkles,
  Tag,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { DemoModeBadge } from "@/components/search/DemoModeBadge";
import { PersonalShopperOnboarding } from "@/components/shopper/PersonalShopperOnboarding";
import { ShopperMatchCard } from "@/components/shopper/ShopperMatchCard";
import { useShopper } from "@/components/shopper/ShopperProvider";
import { getShopperMatches, refineShopperPreferences } from "@/lib/api/buyer-shopper";
import { fmtRD } from "@/lib/format";
import type { MatchStatus } from "@/lib/shopper/types";
import { cn } from "@/lib/utils";

const HISTORY_FILTERS: { id: MatchStatus | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "viewed", label: "Vistos" },
  { id: "dismissed", label: "Descartados" },
  { id: "converted", label: "Comprados" },
];

export default function MiShopperPage() {
  const { profile, matches, setProfile, setMatches, updateMatch, openOnboarding, onboardingOpen, closeOnboarding, refresh } =
    useShopper();
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<MatchStatus | "all">("all");
  const [editOpen, setEditOpen] = useState(false);

  const loadMatches = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getShopperMatches(profile);
    setMatches(res.data);
    setDemoMode(!res.fromBackend);
    setLoading(false);
  }, [profile, setMatches]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const todayMatches = useMemo(
    () => matches.filter((m) => m.status === "new" || m.status === "viewed").slice(0, 3),
    [matches],
  );

  const historyMatches = useMemo(() => {
    const sorted = [...matches].sort(
      (a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime(),
    );
    if (historyFilter === "all") return sorted;
    return sorted.filter((m) => m.status === historyFilter);
  }, [matches, historyFilter]);

  const toggleActive = async () => {
    if (!profile) return;
    const next = { ...profile, active: !profile.active };
    const res = await refineShopperPreferences({ query: profile.preferences.query }, next);
    setProfile(res.data);
    setDemoMode(!res.fromBackend);
    toast.success(next.active ? "Shopper activado" : "Shopper pausado");
  };

  if (!profile) {
    return (
      <main className="mx-auto max-w-[960px] px-[clamp(16px,3vw,22px)] py-12">
        <div className="rounded-r-sm border border-nk-border bg-nk-surface p-8 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-brand" />
          <h1 className="mt-4 font-manrope text-2xl font-extrabold text-nk-fg">
            Tu AI Personal Shopper
          </h1>
          <p className="mt-2 text-nk-fg-muted">
            Activa tu shopper para que Nadakki AI busque vehículos por ti 24/7.
          </p>
          <button
            type="button"
            onClick={openOnboarding}
            className="mt-6 rounded-full bg-gradient-to-r from-brand to-brand-2 px-6 py-3 text-sm font-bold text-white"
          >
            Activar gratis
          </button>
        </div>
        <PersonalShopperOnboarding open={onboardingOpen} onClose={closeOnboarding} />
      </main>
    );
  }

  const prefs = profile.preferences;

  return (
    <main className="mx-auto max-w-[1100px] px-[clamp(16px,3vw,22px)] py-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand" />
            <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Tu AI Personal Shopper</h1>
            <DemoModeBadge visible={demoMode} />
          </div>
          <p className="mt-1 text-nk-fg-muted">
            Trabajando 24/7 para encontrarte el vehículo perfecto
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-nk-border px-4 py-2">
          <span className="text-sm font-medium text-nk-fg">
            {profile.active ? "Activo" : "Pausado"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={profile.active}
            onClick={toggleActive}
            className={cn(
              "relative h-6 w-11 rounded-full transition",
              profile.active ? "bg-brand" : "bg-nk-surface-3",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                profile.active ? "left-[22px]" : "left-0.5",
              )}
            />
          </button>
        </label>
      </header>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-manrope text-lg font-bold text-nk-fg">Preferencias aprendidas</h2>
          <button
            type="button"
            onClick={() => {
              setEditOpen(true);
              openOnboarding();
            }}
            className="text-sm font-semibold text-brand hover:underline"
          >
            Refinar preferencias
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <PrefCard
            icon={<Car className="h-4 w-4" />}
            label="Tipo de vehículo"
            value={prefs.types.join(", ") || "Cualquiera"}
          />
          <PrefCard
            icon={<Tag className="h-4 w-4" />}
            label="Marcas preferidas"
            value={
              prefs.brands.length ? (
                <span className="flex flex-wrap gap-1">
                  {prefs.brands.map((b) => (
                    <span
                      key={b}
                      className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand"
                    >
                      {b}
                    </span>
                  ))}
                </span>
              ) : (
                "Todas"
              )
            }
          />
          <PrefCard
            icon={<Wallet className="h-4 w-4" />}
            label="Presupuesto mensual"
            value={
              prefs.monthlyBudget
                ? `RD$ ${prefs.monthlyBudget.toLocaleString("en-US")}/mes`
                : "No definido"
            }
          />
          <PrefCard
            icon={<Wallet className="h-4 w-4" />}
            label="Rango de precio"
            value={prefs.maxPrice ? fmtRD(prefs.maxPrice) : "Sin límite"}
          />
          <PrefCard icon={<MapPin className="h-4 w-4" />} label="Provincia" value={prefs.province} />
        </div>
        {prefs.query ? (
          <p className="mt-3 text-sm italic text-nk-fg-subtle">&ldquo;{prefs.query}&rdquo;</p>
        ) : null}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 font-manrope text-lg font-bold text-nk-fg">
          {todayMatches.length} vehículos nuevos que te podrían interesar
        </h2>
        {loading ? (
          <p className="text-sm text-nk-fg-muted">Cargando matches…</p>
        ) : todayMatches.length === 0 ? (
          <p className="rounded-r-sm border border-nk-border bg-nk-surface-2 p-6 text-sm text-nk-fg-muted">
            No hay matches nuevos hoy. Tu AI sigue buscando.
          </p>
        ) : (
          <div className="space-y-6">
            {todayMatches.map((match) => (
              <ShopperMatchCard
                key={match.id}
                match={match}
                onDismiss={() => {
                  updateMatch(match.id, { status: "dismissed" });
                  toast.message("Preferencia registrada — la AI aprende");
                }}
                onInterest={() => {
                  updateMatch(match.id, { status: "converted" });
                  toast.success("¡Excelente elección! Te contactaremos pronto.");
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-manrope text-lg font-bold text-nk-fg">Historial</h2>
          <div className="flex flex-wrap gap-2">
            {HISTORY_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setHistoryFilter(f.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  historyFilter === f.id
                    ? "bg-brand text-white"
                    : "border border-nk-border text-nk-fg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-4 text-sm text-nk-fg-muted">
          AI ha analizado {profile.vehiclesAnalyzedThisMonth} vehículos por ti este mes
        </p>
        <ol className="space-y-3 border-l-2 border-nk-border pl-4">
          {historyMatches.map((match) => (
            <li key={match.id} className="relative">
              <span className="absolute -left-[21px] top-2 h-2.5 w-2.5 rounded-full bg-brand" />
              <div className="rounded-r-sm border border-nk-border bg-nk-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/autos/vehiculo/${match.vehicle.id}`}
                    className="text-sm font-semibold text-nk-fg hover:text-brand"
                  >
                    {match.vehicle.year} {match.vehicle.make} {match.vehicle.model}
                  </Link>
                  <span className="text-xs text-nk-fg-subtle">
                    {new Date(match.matchedAt).toLocaleDateString("es-DO")} · {match.score}% match
                  </span>
                </div>
                <p className="mt-1 text-xs capitalize text-nk-fg-muted">Estado: {match.status}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <PersonalShopperOnboarding
        open={onboardingOpen || editOpen}
        onClose={() => {
          closeOnboarding();
          setEditOpen(false);
          refresh();
        }}
      />
    </main>
  );
}

function PrefCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-r-sm border border-nk-border bg-nk-surface p-4">
      <div className="mb-1 flex items-center gap-2 text-nk-fg-subtle">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-sm font-semibold text-nk-fg">{value}</div>
    </div>
  );
}
