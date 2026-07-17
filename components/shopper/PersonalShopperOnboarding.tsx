"use client";

import { useCallback, useState } from "react";
import { Bell, Loader2, Mail, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { FixedModal } from "@/components/system/ModalRoot";
import { DemoModeBadge } from "@/components/search/DemoModeBadge";
import { useShopper } from "@/components/shopper/ShopperProvider";
import {
  analyzeShopperQuery,
  getShopperMatches,
  registerShopperProfile,
} from "@/lib/api/buyer-shopper";
import { fmtRD } from "@/lib/format";
import type { ShopperNotificationChannel, ShopperPreferences } from "@/lib/shopper/types";
import { cn } from "@/lib/utils";

const PROVINCES = [
  "Todas",
  "Distrito Nacional",
  "Santiago",
  "La Vega",
  "San Cristóbal",
  "Puerto Plata",
] as const;

const TYPE_OPTIONS = ["SUV", "Sedán", "SUV Premium", "Premium"] as const;

const BRAND_OPTIONS = [
  "Toyota",
  "Honda",
  "Hyundai",
  "Kia",
  "Nissan",
  "BMW",
  "Mercedes-Benz",
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PersonalShopperOnboarding({ open, onClose }: Props) {
  const { setProfile, setMatches, refresh } = useShopper();
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [prefs, setPrefs] = useState<ShopperPreferences>({
    query: "",
    types: [],
    brands: [],
    province: "Todas",
  });
  const [notifications, setNotifications] = useState<ShopperNotificationChannel[]>([
    "in_app",
  ]);

  const reset = useCallback(() => {
    setStep(1);
    setQuery("");
    setPrefs({ query: "", types: [], brands: [], province: "Todas" });
    setNotifications(["in_app"]);
    setDemoMode(false);
  }, []);

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setAnalyzing(true);
    try {
      const { data, fromBackend } = await analyzeShopperQuery(query.trim());
      setPrefs(data);
      setDemoMode(!fromBackend);
      if (!fromBackend) toast.message("Modo demo — conectar backend para uso real");
      setStep(2);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleBrand = (brand: string) => {
    setPrefs((p) => ({
      ...p,
      brands: p.brands.includes(brand)
        ? p.brands.filter((b) => b !== brand)
        : [...p.brands, brand],
    }));
  };

  const toggleNotification = (channel: ShopperNotificationChannel) => {
    setNotifications((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel],
    );
  };

  const handleActivate = async () => {
    setSubmitting(true);
    try {
      const { data, fromBackend } = await registerShopperProfile(query.trim(), notifications);
      const refined = { ...data.profile, preferences: prefs };
      setProfile(refined);
      setDemoMode(!fromBackend);

      const matchesRes = await getShopperMatches(refined);
      setMatches(matchesRes.data);
      if (!fromBackend || !matchesRes.fromBackend) setDemoMode(true);

      toast.success("¡Listo! Nadakki AI está trabajando para ti 24/7");
      refresh();
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FixedModal
      open={open}
      onClose={handleClose}
      title={
        step === 1
          ? "¿Qué buscas?"
          : step === 2
            ? "Ajusta preferencias"
            : "Activa notificaciones"
      }
      subtitle={
        step === 1
          ? "Cuéntanos en lenguaje natural — la AI aprende para siempre."
          : step === 2
            ? "La AI extrajo estas preferencias. Edítalas si quieres."
            : "¿Cómo quieres saber cuando aparezca un match?"
      }
      icon={<Sparkles className="h-5 w-5 text-brand" />}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <DemoModeBadge visible={demoMode} />
          <div className="ml-auto flex gap-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-full px-4 py-2 text-sm font-medium text-nk-fg-muted hover:bg-nk-surface-2"
              >
                Atrás
              </button>
            ) : null}
            {step === 1 ? (
              <button
                type="button"
                disabled={!query.trim() || analyzing}
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Analizar con AI
              </button>
            ) : step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-full bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Confirmar preferencias
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || notifications.length === 0}
                onClick={handleActivate}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Activar mi AI Personal Shopper
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-2 pb-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              n <= step ? "bg-brand" : "bg-nk-surface-3",
            )}
          />
        ))}
      </div>

      {step === 1 ? (
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          placeholder="Ej: yipeta familiar bajo 30 mil/mes, prefiero Toyota o Honda"
          className="w-full resize-none rounded-r-sm border border-nk-border bg-nk-surface-2 px-4 py-3 text-sm text-nk-fg placeholder:text-nk-fg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <PreferenceCard label="Tipo">
            <select
              value={prefs.types[0] ?? ""}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, types: e.target.value ? [e.target.value] : [] }))
              }
              className="w-full rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm"
            >
              <option value="">Cualquiera</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </PreferenceCard>

          <PreferenceCard label="Marcas">
            <div className="flex flex-wrap gap-2">
              {BRAND_OPTIONS.map((brand) => {
                const active = prefs.brands.includes(brand);
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => toggleBrand(brand)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition",
                      active
                        ? "bg-brand text-white"
                        : "border border-nk-border bg-nk-surface-2 text-nk-fg-muted",
                    )}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
          </PreferenceCard>

          <PreferenceCard label="Presupuesto mensual">
            <input
              type="range"
              min={10000}
              max={80000}
              step={1000}
              value={prefs.monthlyBudget ?? 30000}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, monthlyBudget: Number(e.target.value) }))
              }
              className="w-full accent-brand"
            />
            <p className="mt-1 text-sm font-semibold text-brand">
              RD$ {(prefs.monthlyBudget ?? 30000).toLocaleString("en-US")}/mes
            </p>
          </PreferenceCard>

          {prefs.maxPrice ? (
            <PreferenceCard label="Precio máximo">
              <p className="text-sm font-semibold">{fmtRD(prefs.maxPrice)}</p>
            </PreferenceCard>
          ) : null}

          <PreferenceCard label="Provincia">
            <select
              value={prefs.province}
              onChange={(e) => setPrefs((p) => ({ ...p, province: e.target.value }))}
              className="w-full rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm"
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </PreferenceCard>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <NotificationOption
            icon={<MessageCircle className="h-5 w-5 text-green-600" />}
            title="WhatsApp"
            desc="Ideal para RD — respuesta rápida"
            checked={notifications.includes("whatsapp")}
            onChange={() => toggleNotification("whatsapp")}
          />
          <NotificationOption
            icon={<Mail className="h-5 w-5 text-brand" />}
            title="Email"
            desc="Recibe resumen diario"
            checked={notifications.includes("email")}
            onChange={() => toggleNotification("email")}
          />
          <NotificationOption
            icon={<Bell className="h-5 w-5 text-brand-2" />}
            title="In-app"
            desc="Notificación cuando entres a Nadakki"
            checked={notifications.includes("in_app")}
            onChange={() => toggleNotification("in_app")}
          />
        </div>
      ) : null}
    </FixedModal>
  );
}

function PreferenceCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-r-sm border border-nk-border bg-nk-surface-2 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-nk-fg-subtle">{label}</p>
      {children}
    </div>
  );
}

function NotificationOption({
  icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-r-sm border p-3 transition",
        checked ? "border-brand bg-brand-soft/30" : "border-nk-border bg-nk-surface-2",
      )}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="mt-1 accent-brand" />
      <span className="shrink-0">{icon}</span>
      <span>
        <span className="block text-sm font-bold text-nk-fg">{title}</span>
        <span className="block text-xs text-nk-fg-muted">{desc}</span>
      </span>
    </label>
  );
}
