"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
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

  if (!user) return null;

  const initials = user.email.split("@")[0].slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-forge-sm px-3 py-1.5 transition-colors hover:bg-forgeSurface-sunken"
        aria-label="User menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forgeBrand-600 text-forge-sm font-semibold text-forgeGray-50">
          {initials}
        </div>
        <span className="hidden text-forge-sm text-forgeGray-800 md:inline">{user.email.split("@")[0]}</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card shadow-forge-lg">
          <div className="border-b border-forgeGray-200 px-4 py-3">
            <p className="truncate text-forge-sm font-medium text-forgeGray-800">{user.email}</p>
            <p className="mt-1 text-forge-xs text-forgeGray-500">
              {user.is_active ? "Cuenta activa" : "Cuenta inactiva"}
            </p>
          </div>
          <div className="py-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-forge-sm text-forgeGray-800 transition-colors hover:bg-forgeSurface-sunken"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
