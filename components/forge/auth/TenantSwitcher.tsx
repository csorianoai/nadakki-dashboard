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
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-forge-sm border border-forgeGray-200 px-3 py-1.5 text-forge-sm transition-colors hover:bg-forgeSurface-sunken"
      >
        <span className="text-forgeGray-500">Tenant:</span>
        <span className="font-medium text-forgeGray-800">{tenant.display_name}</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card shadow-forge-lg">
          <div className="border-b border-forgeGray-200 px-4 py-2">
            <p className="text-forge-xs text-forgeGray-500">Tenant activo</p>
            <p className="mt-1 text-forge-sm font-medium text-forgeGray-800">{tenant.display_name}</p>
            <p className="mt-1 text-forge-xs text-forgeGray-500">
              {tenant.subscribed_cores.length} cores activos
            </p>
          </div>
          <div className="px-4 py-2">
            <p className="mb-1 text-forge-xs text-forgeGray-500">Cores:</p>
            <div className="flex flex-wrap gap-1">
              {tenant.subscribed_cores.map((core) => (
                <span
                  key={core}
                  className="rounded-forge-sm bg-forgeSurface-sunken px-2 py-0.5 text-forge-xs text-forgeGray-800"
                >
                  {core}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
