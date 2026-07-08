"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  LogOut,
  Search,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChTopbarProps } from "@/lib/credit-hub/ch-types";

function Breadcrumb({ trail = [] }: { trail?: string[] }) {
  return (
    <nav aria-label="Migas" style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
      {trail.map((t, i) => {
        const last = i === trail.length - 1;
        return (
          <span key={`${t}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
            {i > 0 ? <ChevronRight className="h-3 w-3 shrink-0" style={{ color: "var(--ch-text-4)" }} aria-hidden /> : null}
            {last ? (
              <span
                style={{
                  fontSize: "var(--ch-text-sm)",
                  fontWeight: 600,
                  color: "var(--ch-text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t}
              </span>
            ) : (
              <button
                type="button"
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "var(--ch-text-sm)",
                  color: "var(--ch-text-3)",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--ch-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--ch-text-3)";
                }}
              >
                {t}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function Dropdown({
  open,
  onClose,
  children,
  align = "right",
  width = 220,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: "left" | "right";
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        [align]: 0,
        width,
        background: "var(--ch-surface)",
        border: "1px solid var(--ch-line)",
        borderRadius: "var(--ch-r-lg)",
        boxShadow: "var(--ch-sh-3)",
        zIndex: "var(--ch-z-modal)",
        padding: 6,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon?: LucideIcon;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "var(--ch-text-sm)",
        borderRadius: "var(--ch-r-sm)",
        color: danger ? "var(--ch-danger-text)" : "var(--ch-text-2)",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--ch-surface-2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {Icon ? <Icon className="h-[15px] w-[15px]" aria-hidden /> : null}
      {label}
    </button>
  );
}

export function ChTopbar({
  trail = ["Credit Hub", "Panel"],
  breadcrumbs,
  multiTenant = true,
  tenantName,
  notif,
  showNotificationsBell = true,
  user,
  userEmail,
  notifications,
  tenants,
  onSelectTenant,
  onOpenSearch,
  onSearchClick,
  compact = false,
  userInitials,
  className,
}: ChTopbarProps) {
  const [menu, setMenu] = useState<"tenant" | "bell" | "avatar" | null>(null);
  const resolvedTrail = trail.length ? trail : breadcrumbs?.map((b) => b.label) ?? ["Credit Hub", "Panel"];
  const resolvedUser = user ?? { name: "Usuario", initials: userInitials ?? "—" };
  const resolvedTenantName = tenantName?.trim() ? tenantName : "Institución no disponible";
  const notifCount = notif ?? notifications?.length ?? 0;
  const canSwitchTenant = !!tenants && tenants.length > 0;
  const openSearch = onOpenSearch ?? onSearchClick;

  return (
    <header
      className={cn(className)}
      style={{
        height: 56,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 16px",
        background: "var(--ch-surface)",
        borderBottom: "1px solid var(--ch-line)",
        position: "sticky",
        top: 0,
        zIndex: "var(--ch-z-base)",
      }}
    >
      <div style={{ flexShrink: 1, minWidth: 0 }}>
        <Breadcrumb trail={resolvedTrail} />
      </div>

      {!compact ? (
        <button
          type="button"
          onClick={openSearch}
          style={{
            flex: 1,
            maxWidth: 460,
            marginLeft: "auto",
            marginRight: "auto",
            display: "flex",
            alignItems: "center",
            gap: 9,
            height: 34,
            padding: "0 12px",
            borderRadius: "var(--ch-r-md)",
            background: "var(--ch-bg)",
            border: "1px solid var(--ch-line-2)",
            cursor: "pointer",
            color: "var(--ch-text-3)",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--ch-line-strong)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--ch-line-2)";
          }}
        >
          <Search className="h-[15px] w-[15px]" aria-hidden />
          <span
            style={{
              flex: 1,
              textAlign: "left",
              fontSize: "var(--ch-text-sm)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Buscar solicitudes, dealers, comités…
          </span>
          <span
            className="ch-mono"
            style={{
              fontSize: 10,
              padding: "2px 6px",
              border: "1px solid var(--ch-line-2)",
              borderRadius: 4,
              color: "var(--ch-text-3)",
            }}
          >
            ⌘K
          </span>
        </button>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: compact ? "auto" : 0, flexShrink: 0 }}>
        {multiTenant ? (
          <div style={{ position: "relative" }}>
            {canSwitchTenant ? (
              <>
                <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={() => setMenu(menu === "tenant" ? null : "tenant")}>
                  <Building2 className="h-3.5 w-3.5" aria-hidden />
                  <span style={{ maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resolvedTenantName}</span>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                </button>
                <Dropdown open={menu === "tenant"} onClose={() => setMenu(null)} width={220}>
                  <div className="ch-eyebrow" style={{ padding: "6px 10px 4px" }}>
                    Cambiar institución
                  </div>
                  {tenants!.map((t) => (
                    <MenuItem
                      key={t.id}
                      icon={Building2}
                      label={t.name}
                      onClick={() => {
                        onSelectTenant?.(t.id);
                        setMenu(null);
                      }}
                    />
                  ))}
                </Dropdown>
              </>
            ) : (
              <div
                className="ch-btn ch-btn-secondary ch-btn-sm"
                style={{ cursor: "default" }}
                aria-label={`Institución: ${resolvedTenantName}`}
              >
                <Building2 className="h-3.5 w-3.5" aria-hidden />
                <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resolvedTenantName}</span>
              </div>
            )}
          </div>
        ) : null}

        <div style={{ position: "relative" }}>
          {showNotificationsBell ? (
            <>
              <button type="button" className="ch-icon-btn" aria-label="Notificaciones" onClick={() => setMenu(menu === "bell" ? null : "bell")}>
                <Bell className="h-[17px] w-[17px]" aria-hidden />
                {notifCount > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      top: 5,
                      right: 6,
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      background: "var(--ch-danger)",
                      border: "1.5px solid var(--ch-surface)",
                    }}
                  />
                ) : null}
              </button>
              <Dropdown open={menu === "bell"} onClose={() => setMenu(null)} width={280}>
                <div className="ch-eyebrow" style={{ padding: "6px 10px 4px" }}>
                  Notificaciones · {notifCount}
                </div>
                {notifications && notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <div key={n.id ?? i} style={{ padding: "8px 10px", fontSize: "var(--ch-text-sm)", color: "var(--ch-text-2)", borderRadius: "var(--ch-r-sm)" }}>
                      <strong style={{ fontWeight: 600 }}>{n.title}</strong>
                      {n.body ? <> — {n.body}</> : null}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "10px", fontSize: "var(--ch-text-sm)", color: "var(--ch-text-3)" }}>Sin notificaciones nuevas.</div>
                )}
              </Dropdown>
            </>
          ) : null}
        </div>

        <div style={{ width: 1, height: 20, background: "var(--ch-line)", margin: "0 6px" }} />

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMenu(menu === "avatar" ? null : "avatar")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 2,
              borderRadius: 999,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                background: "var(--ch-persona)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {resolvedUser.initials}
            </div>
          </button>
          <Dropdown open={menu === "avatar"} onClose={() => setMenu(null)} width={210}>
            <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid var(--ch-line)", marginBottom: 4 }}>
              <div style={{ fontSize: "var(--ch-text-sm)", fontWeight: 600 }}>{resolvedUser.name}</div>
              {userEmail ? <div style={{ fontSize: 11, color: "var(--ch-text-3)" }}>{userEmail}</div> : null}
            </div>
            <MenuItem icon={User} label="Mi perfil" onClick={() => setMenu(null)} />
            <MenuItem icon={Settings} label="Configuración" onClick={() => setMenu(null)} />
            <div className="ch-divider" style={{ margin: "4px 0" }} />
            <MenuItem icon={LogOut} label="Cerrar sesión" danger onClick={() => setMenu(null)} />
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
