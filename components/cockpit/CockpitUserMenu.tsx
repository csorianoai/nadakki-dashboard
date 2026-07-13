"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getTenantDashboardHome } from "@/lib/cockpit/tenant-home";

export function CockpitUserMenu() {
  const { user, activeRole, allRoles, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const homePath = getTenantDashboardHome(allRoles);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = (user.email.split("@")[0] ?? "OP").slice(0, 2).toUpperCase();
  const displayName = user.email.split("@")[0] ?? "Operador";
  const roleLabel = activeRole?.display_name ?? activeRole?.role_key ?? "—";

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-cockpit-border/40"
        aria-label="Menú de usuario"
        aria-expanded={open}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cockpit-accent/30 text-xs font-semibold">
          {initials}
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-cockpit-text">{displayName}</p>
          <p className="text-xs text-cockpit-muted">{roleLabel}</p>
        </div>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-cockpit-border bg-cockpit-surface shadow-lg">
          <div className="border-b border-cockpit-border px-4 py-3">
            <p className="truncate text-sm font-medium text-cockpit-text">{user.email}</p>
          </div>
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(homePath);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-cockpit-text transition-colors hover:bg-cockpit-border/40"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-cockpit-accent" aria-hidden />
              Volver al dashboard
            </button>
            <div className="my-1 border-t border-cockpit-border" />
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full px-4 py-2 text-left text-sm text-cockpit-text transition-colors hover:bg-cockpit-border/40"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
