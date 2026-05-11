"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export function TenantSwitcher() {
  const { tenant } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!tenant) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--forge-border-default)] hover:bg-[var(--forge-bg-hover)] transition-colors text-sm"
      >
        <span className="text-[var(--forge-text-muted)]">Tenant:</span>
        <span className="font-medium text-[var(--forge-text-default)]">
          {tenant.display_name}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--forge-bg-surface)] border border-[var(--forge-border-default)] rounded-md shadow-lg z-50">
          <div className="px-4 py-2 border-b border-[var(--forge-border-default)]">
            <p className="text-xs text-[var(--forge-text-muted)]">Tenant activo</p>
            <p className="text-sm font-medium text-[var(--forge-text-default)] mt-1">
              {tenant.display_name}
            </p>
            <p className="text-xs text-[var(--forge-text-muted)] mt-1">
              {tenant.subscribed_cores.length} cores activos
            </p>
          </div>
          <div className="px-4 py-2">
            <p className="text-xs text-[var(--forge-text-muted)] mb-1">Cores:</p>
            <div className="flex flex-wrap gap-1">
              {tenant.subscribed_cores.map((core) => (
                <span
                  key={core}
                  className="px-2 py-0.5 bg-[var(--forge-bg-hover)] rounded text-xs text-[var(--forge-text-default)]"
                >
                  {core}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
