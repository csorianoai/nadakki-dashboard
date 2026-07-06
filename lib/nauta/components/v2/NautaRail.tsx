"use client";

import {
  brandInitial,
  resolveBrandDisplayName,
  resolveVisiblePlatformTitle,
} from "@/lib/white-label/brand-display";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { S } from "@/lib/nauta/strings";
import type { PisoMode } from "./SegmentedControl";

export type NautaViewId = "piso" | "tablero" | "expediente" | "expediente-e2" | "super";

function resolveUserDisplayName(name: string | undefined, email: string | undefined): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const local = email?.split("@")[0]?.trim();
  return local || "Usuario";
}

function resolveUserInitials(displayName: string): string {
  const parts = displayName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
  }
  return brandInitial(displayName);
}

export function NautaRail({
  view,
  pisoMode,
  pendingCount,
  onNavigate,
}: {
  view: NautaViewId;
  pisoMode: PisoMode;
  pendingCount: number;
  onNavigate: (view: NautaViewId, pisoMode?: PisoMode) => void;
}) {
  const { user, tenant, activeRole } = useAuth();
  const { data: branding } = useTenantBranding();
  const institution = resolveVisiblePlatformTitle(branding, tenant);
  const markLabel = resolveBrandDisplayName(branding, tenant) ?? institution;
  const userName = resolveUserDisplayName(user?.name, user?.email);
  const userRole = activeRole?.display_name ?? "";
  const userInitials = resolveUserInitials(userName);

  const navClass = (v: NautaViewId, mode?: PisoMode) => {
    if (v === "piso" && mode === "planes") return view === "piso" && pisoMode === "planes" ? "on" : "";
    if (mode) return "";
    return view === v ? "on" : "";
  };

  return (
    <aside className="rail">
      <div className="brand">
        <div className="mk" aria-hidden>
          {branding?.logo_url ? (
            <img src={branding.logo_url} alt="" className="brand-logo" />
          ) : (
            brandInitial(markLabel)
          )}
        </div>
        <div>
          <div className="nm">{S.brand.name}</div>
          <div className="sb">{S.brand.subtitle}</div>
        </div>
      </div>
      <div className="navsec">{S.nav.operacion}</div>
      <nav className="nav" aria-label="Operación Nauta">
        <button type="button" className={`navBtn ${navClass("piso")}`} onClick={() => onNavigate("piso", "dept")}>
          <span className="ic" aria-hidden>
            ◧
          </span>
          {S.nav.piso}
          <span className="cnt">16</span>
        </button>
        <button type="button" className={`navBtn ${navClass("tablero")}`} onClick={() => onNavigate("tablero")}>
          <span className="ic" aria-hidden>
            ▤
          </span>
          {S.nav.tablero}
        </button>
        <button type="button" className={`navBtn ${navClass("expediente")}`} onClick={() => onNavigate("expediente")}>
          <span className="ic" aria-hidden>
            ▭
          </span>
          {S.nav.expedientes}
        </button>
        <button type="button" className={`navBtn ${navClass("super")}`} onClick={() => onNavigate("super")}>
          <span className="ic" aria-hidden>
            ◈
          </span>
          {S.nav.super}
          <span className="cnt">{pendingCount}</span>
        </button>
      </nav>
      <div className="navsec">{S.nav.admin}</div>
      <nav className="nav" aria-label="Administración Nauta">
        <button
          type="button"
          className={`navBtn ${navClass("piso", "planes")}`}
          onClick={() => onNavigate("piso", "planes")}
        >
          <span className="ic" aria-hidden>
            ₽
          </span>
          {S.nav.planes}
        </button>
        <button type="button" className="navBtn" disabled>
          <span className="ic" aria-hidden>
            ▦
          </span>
          {S.nav.evidencia}
        </button>
        <button type="button" className="navBtn" disabled>
          <span className="ic" aria-hidden>
            ⚙
          </span>
          {S.nav.config}
        </button>
      </nav>
      <div className="railftr">
        <div className="tenant">{S.rail.tenantLabel}</div>
        <div className="institution-name">{institution}</div>
        <div className="me">
          <div className="av" aria-hidden>
            {userInitials}
          </div>
          <div>
            <div className="nm">{userName}</div>
            {userRole ? <div className="rl">{userRole}</div> : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
