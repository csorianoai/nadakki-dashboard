"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteTenantBrandingLogo,
  fetchTenantBrandingAdmin,
  postTenantBrandingLogo,
  putTenantBranding,
  type TenantBrandingPatch,
} from "@/lib/api/tenant-branding-admin";
import type { TenantBranding } from "@/lib/credit-hub/types/tenantBranding";
import { tenantBrandingAuthQueryKey } from "@/lib/hooks/useTenantBranding";
import { useToast } from "@/components/ui/Toast";
import { Topbar } from "@/components/forge/layout/Topbar";
import { Button } from "@/components/forge/ui/Button";

const FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Source Sans 3",
  "Georgia",
  "system-ui",
] as const;

function canEditBranding(roleKey: string | undefined): boolean {
  return roleKey === "tenant_admin" || roleKey === "platform_superadmin";
}

export default function AdminBrandingSettingsPage() {
  const router = useRouter();
  const { tenant, activeRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!canEditBranding(activeRole?.role_key)) {
      router.replace("/admin");
    }
  }, [activeRole?.role_key, authLoading, isAuthenticated, router]);

  const tenantId = tenant?.id ?? tenant?.slug ?? "";

  const q = useQuery({
    queryKey: ["tenant-branding-admin-form", tenantId],
    queryFn: () => fetchTenantBrandingAdmin(tenantId),
    enabled: Boolean(tenantId && canEditBranding(activeRole?.role_key)),
    retry: 1,
  });

  const [displayName, setDisplayName] = useState("");
  const [primary, setPrimary] = useState("#2e5f97");
  const [dark, setDark] = useState("#0a1d36");
  const [secondary, setSecondary] = useState("#163660");
  const [accent, setAccent] = useState("#c8940a");
  const [font, setFont] = useState<string>(FONT_OPTIONS[0]);
  const [darkMode, setDarkMode] = useState(false);
  const [customCss, setCustomCss] = useState("");

  const syncFromPayload = useCallback((b: TenantBranding | undefined) => {
    if (!b) return;
    setDisplayName(b.display_name ?? "");
    setPrimary(b.brand_primary ?? "#2e5f97");
    setDark(b.brand_dark ?? "#0a1d36");
    setSecondary(b.secondary_color ?? b.brand_dark ?? "#163660");
    setAccent(b.accent_color ?? "#c8940a");
    setFont((b.font_family as string | undefined) ?? FONT_OPTIONS[0]);
    setDarkMode(Boolean(b.dark_mode_enabled));
    setCustomCss(b.custom_css ?? "");
  }, []);

  useEffect(() => {
    if (q.data) syncFromPayload(q.data);
  }, [q.data, syncFromPayload]);

  const previewStyle = useMemo(
    () =>
      ({
        ["--forge-brand-500"]: primary,
        ["--forge-brand-900"]: dark,
        ["--forge-accent-gold"]: accent,
        ["--forge-font-body"]: `${font}, var(--forge-font-sans), sans-serif`,
      }) as CSSProperties,
    [accent, dark, font, primary],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: TenantBrandingPatch = {
        display_name: displayName.trim() || undefined,
        brand_primary: primary,
        brand_dark: dark,
        accent_color: accent,
        secondary_color: secondary,
        font_family: font,
        dark_mode_enabled: darkMode,
        custom_css: customCss.trim() || undefined,
      };
      await putTenantBranding(tenantId, body);
    },
    onSuccess: async () => {
      toast.success("Branding guardado", "Los cambios se aplicarán en toda la app.");
      await qc.invalidateQueries({ queryKey: [...tenantBrandingAuthQueryKey] });
      await qc.invalidateQueries({ queryKey: ["tenant-branding-admin-form", tenantId] });
    },
    onError: (e: unknown) => {
      toast.error("No se guardó branding", e instanceof Error ? e.message : "Error");
    },
  });

  const logoMutation = useMutation({
    mutationFn: async (file: File) => {
      await postTenantBrandingLogo(tenantId, file);
    },
    onSuccess: async () => {
      toast.success("Logo actualizado");
      await qc.invalidateQueries({ queryKey: [...tenantBrandingAuthQueryKey] });
      await q.refetch();
    },
    onError: (e: unknown) => {
      toast.error("Falló la subida del logo", e instanceof Error ? e.message : "");
    },
  });

  const deleteLogoMutation = useMutation({
    mutationFn: async () => {
      await deleteTenantBrandingLogo(tenantId);
    },
    onSuccess: async () => {
      toast.success("Logo eliminado");
      await qc.invalidateQueries({ queryKey: [...tenantBrandingAuthQueryKey] });
      await q.refetch();
    },
    onError: (e: unknown) => {
      toast.error("No se eliminó el logo", e instanceof Error ? e.message : "");
    },
  });

  if (!tenantId || !canEditBranding(activeRole?.role_key)) return null;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="text-forge-sm text-forgeBrand-600 hover:text-forgeBrand-700">
          ← Panel admin
        </Link>
      </div>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-6 shadow-forge-sm">
          <h2 className="font-display text-forge-lg font-semibold text-forgeGray-800">Identidad institucional</h2>
          <p className="mt-2 text-forge-sm text-forgeGray-500">
            Conectado a GET/PUT <code className="font-mono text-forge-xs">/api/v2/tenants/{"{id}"}/branding</code> (JWT
            Auth V2).
          </p>

          {q.isLoading ? (
            <p className="mt-6 text-forge-sm text-forgeGray-500">Cargando branding...</p>
          ) : (
            <form
              className="mt-6 flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              <label className="flex flex-col gap-1 text-forge-xs font-medium uppercase tracking-wide text-forgeGray-500">
                Nombre institucional
                <input
                  className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-2 text-forge-sm text-forgeGray-900"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
                  Color primario
                  <span className="flex items-center gap-2">
                    <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} aria-label="Color primario" />
                    <input
                      className="flex-1 rounded-forge-md border border-forgeGray-200 px-2 py-2 font-mono text-forge-sm"
                      value={primary}
                      onChange={(e) => setPrimary(e.target.value)}
                    />
                  </span>
                </label>
                <label className="flex flex-col gap-1 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
                  Color oscuro / secundario
                  <span className="flex items-center gap-2">
                    <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} aria-label="Color oscuro" />
                    <input
                      className="flex-1 rounded-forge-md border border-forgeGray-200 px-2 py-2 font-mono text-forge-sm"
                      value={dark}
                      onChange={(e) => setDark(e.target.value)}
                    />
                  </span>
                </label>
                <label className="flex flex-col gap-1 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
                  Secundario (Tokens)
                  <span className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondary}
                      onChange={(e) => setSecondary(e.target.value)}
                      aria-label="Color secundario"
                    />
                    <input
                      className="flex-1 rounded-forge-md border border-forgeGray-200 px-2 py-2 font-mono text-forge-sm"
                      value={secondary}
                      onChange={(e) => setSecondary(e.target.value)}
                    />
                  </span>
                </label>
                <label className="flex flex-col gap-1 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
                  Acento / highlight
                  <span className="flex items-center gap-2">
                    <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} aria-label="Acento" />
                    <input
                      className="flex-1 rounded-forge-md border border-forgeGray-200 px-2 py-2 font-mono text-forge-sm"
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                    />
                  </span>
                </label>
              </div>

              <label className="flex flex-col gap-1 text-forge-xs font-medium uppercase tracking-wide text-forgeGray-500">
                Familia tipográfica UI
                <select
                  className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-2 text-forge-sm"
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex cursor-pointer items-center gap-3 text-forge-sm text-forgeGray-800">
                <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} /> Modo oscuro institucional
                <span className="text-forge-xs font-normal normal-case text-forgeGray-500">(preview local + bandera opcional backend)</span>
              </label>

              <label className="flex flex-col gap-1 text-forge-xs font-medium uppercase tracking-wide text-forgeGray-500">
                CSS personalizado (avanzado)
                <textarea
                  className="min-h-[88px] rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-2 font-mono text-forge-xs"
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  spellCheck={false}
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center rounded-forge-md bg-forgeSurface-sunken px-4 py-2 text-forge-sm text-forgeBrand-700 ring-1 ring-forgeGray-200 hover:bg-forgeGray-50">
                  Subir logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) logoMutation.mutate(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="rounded-forge-md px-4 py-2 text-forge-sm text-forgeDanger-600 ring-1 ring-forgeDanger-200 hover:bg-forgeDanger-50"
                  onClick={() => {
                    if (window.confirm("Eliminar logo institucional?")) deleteLogoMutation.mutate();
                  }}
                >
                  Quitar logo
                </button>
              </div>

              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Guardando…" : "Guardar cambios"}
              </Button>
            </form>
          )}
        </div>

        <div data-theme={darkMode ? "dark" : undefined}>
          <div
            className="forge-app overflow-hidden rounded-forge-lg border border-forgeGray-200 bg-forgeSurface-page shadow-forge-md"
            style={previewStyle}
          >
            {customCss ? <style dangerouslySetInnerHTML={{ __html: `.forge-app.preview-scope { ${customCss} }` }} /> : null}
            <div className={`preview-scope ${darkMode ? "text-forgeGray-800" : ""}`}>
              <Topbar
                title={displayName || "Institución demo"}
                leading={
                  q.data?.logo_url ? (
                    <span className="inline-flex h-8 overflow-hidden rounded-forge-sm bg-forgeSurface-sunken">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={q.data.logo_url} alt="" className="max-h-8 w-auto object-contain" />
                    </span>
                  ) : undefined
                }
                actions={<span className="text-forge-xs text-forgeGray-500">Vista previa</span>}
              />
              <div className="p-4">
                <Button type="button" variant="primary">
                  Botón muestra marca
                </Button>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-forge-xs text-forgeGray-500">
            Los cambios de color aplican aquí antes de guardar para feedback inmediato.
          </p>
        </div>
      </section>
    </div>
  );
}
