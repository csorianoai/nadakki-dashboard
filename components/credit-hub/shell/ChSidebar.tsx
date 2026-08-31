"use client";

import { useState } from "react";
import {
  BarChart3,
  Bell,
  Clock,
  FileText,
  Grid3X3,
  Home,
  Inbox,
  LogOut,
  PanelLeft,
  Plus,
  Scale,
  User,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChBottomNavProps, ChNavGroup, ChNavItem, ChSidebarProps, PersonaType } from "@/lib/credit-hub/ch-types";

/**
 * Navigation structure only (labels + icons + ids). PR-FE-1: badge counts,
 * user identity and tenant names were removed from here — they are demo data.
 * Real badge counts come via the `navBadges` prop; real user via the `user`
 * prop; real institution via `institutionName`. Absent ⇒ hidden / "Usuario" /
 * "Institución no disponible", never demo.
 */
export const CH_NAV: Record<PersonaType, { groups: ChNavGroup[] }> = {
  bank: {
    groups: [
      {
        label: "Operación",
        items: [
          { id: "panel", label: "Panel", icon: Grid3X3 },
          { id: "bandeja", label: "Bandeja", icon: Inbox },
        ],
      },
      {
        label: "Inteligencia",
        items: [{ id: "analitica", label: "Analítica", icon: BarChart3 }],
      },
      {
        label: "Control",
        items: [
          { id: "auditoria", label: "Auditoría", icon: Clock },
          { id: "cumplimiento", label: "Cumplimiento", icon: Scale },
        ],
      },
    ],
  },
  dealer: {
    groups: [
      {
        label: "Mostrador",
        items: [
          { id: "inicio", label: "Inicio", icon: Home },
          { id: "solicitudes", label: "Solicitudes", icon: FileText },
          { id: "nueva", label: "Nueva", icon: Plus },
          { id: "preaprobacion", label: "Preaprobación", icon: Zap },
        ],
      },
      {
        label: "Cuenta",
        items: [
          { id: "notificaciones", label: "Notificaciones", icon: Bell },
          { id: "perfil", label: "Perfil", icon: User },
        ],
      },
    ],
  },
};

function TenantMark({ initials, size = 30 }: { initials: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        background: "var(--ch-persona)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.36,
        letterSpacing: "0.02em",
        flexShrink: 0,
        fontFamily: "var(--ch-font-sans)",
      }}
    >
      {initials}
    </div>
  );
}

function NavItemButton({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: ChNavItem;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: collapsed ? "9px 0" : "8px 11px",
        justifyContent: collapsed ? "center" : "flex-start",
        border: "none",
        background: active ? "var(--ch-accent-soft)" : "transparent",
        borderRadius: "var(--ch-r-md)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "var(--ch-text-sm)",
        fontWeight: active ? 600 : 500,
        color: active ? "var(--ch-accent-text)" : "var(--ch-text-2)",
        marginBottom: 2,
        transition: "background var(--ch-t-fast) var(--ch-ease)",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--ch-surface-2)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {active ? (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 6,
            bottom: 6,
            width: 3,
            borderRadius: "0 3px 3px 0",
            background: "var(--ch-persona)",
          }}
        />
      ) : null}
      <Icon
        className="shrink-0"
        style={{ width: 18, height: 18, color: active ? "var(--ch-persona)" : "var(--ch-text-3)" }}
        strokeWidth={active ? 2 : 1.7}
        aria-hidden
      />
      {!collapsed ? (
        <span style={{ flex: 1, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.label}
        </span>
      ) : null}
      {!collapsed && item.badge ? (
        <span
          className="ch-mono"
          style={{
            fontSize: 10,
            fontWeight: 600,
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: active ? "var(--ch-persona)" : "var(--ch-surface-3)",
            color: active ? "#fff" : "var(--ch-text-3)",
          }}
        >
          {item.badge}
        </span>
      ) : null}
      {collapsed && item.badge ? (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 8,
            width: 7,
            height: 7,
            borderRadius: 999,
            background: "var(--ch-persona)",
            border: "1.5px solid var(--ch-surface)",
          }}
        />
      ) : null}
    </button>
  );
}

export function ChSidebar({
  persona = "bank",
  active,
  activePath,
  onNavigate,
  collapsed: cProp,
  onToggleCollapse,
  institutionName,
  logoUrl,
  user,
  onLogout,
  navBadges,
  className,
}: ChSidebarProps) {
  const [cState, setCState] = useState(false);
  const collapsed = cProp !== undefined ? cProp : cState;
  const toggle = onToggleCollapse ?? (() => setCState((c) => !c));
  const cfg = CH_NAV[persona];
  const firstId = cfg.groups[0]?.items[0]?.id ?? "panel";
  const act = active ?? activePath ?? firstId;
  const institutionLabel = institutionName?.trim() ? institutionName : "Institución no disponible";
  const footerUser = {
    name: user?.name?.trim() ? user.name : "Usuario",
    role: user?.role?.trim() ? user.role : "",
    initials: user?.initials?.trim() ? user.initials : "—",
  };

  return (
    <aside
      className={cn(className)}
      role="navigation"
      aria-label={`${persona === "bank" ? "Bank" : "Dealer"} navigation`}
      style={{
        width: collapsed ? 64 : 240,
        flexShrink: 0,
        borderRight: "1px solid var(--ch-line)",
        background: "var(--ch-surface)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "width var(--ch-t-base) var(--ch-ease)",
      }}
    >
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: collapsed ? "0" : "0 14px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid var(--ch-line)",
          flexShrink: 0,
        }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" style={{ height: 30, width: "auto" }} aria-hidden />
        ) : (
          <TenantMark initials={institutionName?.slice(0, 2).toUpperCase() ?? "CH"} />
        )}
        {!collapsed ? (
          <div style={{ minWidth: 0, lineHeight: 1.25 }}>
            <div
              style={{
                fontSize: "var(--ch-text-sm)",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {institutionLabel}
            </div>
            <div className="ch-mono" style={{ fontSize: 10, color: "var(--ch-text-3)", whiteSpace: "nowrap" }}>
              CREDIT HUB · {persona === "bank" ? "BANCO" : "DEALER"}
            </div>
          </div>
        ) : null}
      </div>

      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 8px" }}>
        {cfg.groups.map((g, gi) => (
          <div key={g.label} style={{ marginBottom: 8 }}>
            {!collapsed ? <div className="ch-eyebrow" style={{ padding: "10px 11px 6px" }}>{g.label}</div> : null}
            {collapsed && gi > 0 ? <div className="ch-divider" style={{ margin: "8px 10px" }} /> : null}
            {g.items.map((it) => {
              const injected = navBadges?.[it.id];
              const item =
                injected !== undefined && injected !== null && injected !== "" && injected !== 0
                  ? { ...it, badge: String(injected) }
                  : it;
              return (
                <NavItemButton
                  key={it.id}
                  item={item}
                  active={act === it.id || act === it.href}
                  collapsed={collapsed}
                  onClick={() => onNavigate?.(it.id)}
                />
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ borderTop: "1px solid var(--ch-line)", padding: collapsed ? "8px 0" : 10, flexShrink: 0 }}>
        <button
          type="button"
          className="ch-icon-btn"
          onClick={toggle}
          title={collapsed ? "Expandir" : "Colapsar"}
          style={{ width: collapsed ? "100%" : 30, marginBottom: collapsed ? 8 : 10 }}
        >
          <PanelLeft className="h-4 w-4" aria-hidden />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start" }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              background: "var(--ch-surface-3)",
              color: "var(--ch-text-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {footerUser.initials}
          </div>
          {!collapsed ? (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {footerUser.name}
              </div>
              {footerUser.role ? (
                <div style={{ fontSize: 10.5, color: "var(--ch-text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {footerUser.role}
                </div>
              ) : null}
            </div>
          ) : null}
          {!collapsed && onLogout ? (
            <button
              type="button"
              className="ch-icon-btn"
              title="Cerrar sesión"
              onClick={() => void onLogout()}
              style={{ width: 28, height: 28 }}
            >
              <LogOut className="h-[15px] w-[15px]" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function ChBottomNav({ persona = "dealer", active, activePath, onNavigate, className }: ChBottomNavProps) {
  const cfg = CH_NAV[persona];
  const items = cfg.groups.flatMap((g) => g.items).slice(0, 5);
  const act = active ?? activePath ?? items[0]?.id;

  return (
    <nav
      className={cn(className)}
      aria-label="Mobile navigation"
      style={{ display: "flex", borderTop: "1px solid var(--ch-line)", background: "var(--ch-surface)", height: 60, flexShrink: 0 }}
    >
      {items.map((it) => {
        const on = act === it.id || act === it.href;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onNavigate?.(it.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontFamily: "inherit",
              position: "relative",
              color: on ? "var(--ch-persona-text)" : "var(--ch-text-3)",
            }}
          >
            {on ? (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  left: "30%",
                  right: "30%",
                  height: 2.5,
                  borderRadius: 3,
                  background: "var(--ch-persona)",
                }}
              />
            ) : null}
            <div style={{ position: "relative" }}>
              <Icon
                className="h-5 w-5"
                style={{ color: on ? "var(--ch-persona)" : "var(--ch-text-3)" }}
                strokeWidth={on ? 2 : 1.7}
                aria-hidden
              />
              {it.badge ? (
                <span
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -6,
                    minWidth: 14,
                    height: 14,
                    padding: "0 3px",
                    borderRadius: 999,
                    background: "var(--ch-danger)",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {it.badge}
                </span>
              ) : null}
            </div>
            <span style={{ fontSize: 10, fontWeight: on ? 600 : 500 }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
