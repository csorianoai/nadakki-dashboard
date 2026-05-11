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
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[var(--forge-bg-hover)] transition-colors"
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-[var(--forge-accent-primary)] text-white flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
        <span className="text-sm text-[var(--forge-text-default)] hidden md:inline">
          {user.email.split("@")[0]}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-[var(--forge-bg-surface)] border border-[var(--forge-border-default)] rounded-md shadow-lg z-50">
          <div className="px-4 py-3 border-b border-[var(--forge-border-default)]">
            <p className="text-sm font-medium text-[var(--forge-text-default)] truncate">
              {user.email}
            </p>
            <p className="text-xs text-[var(--forge-text-muted)] mt-1">
              {user.is_active ? "Cuenta activa" : "Cuenta inactiva"}
            </p>
          </div>
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-[var(--forge-text-default)] hover:bg-[var(--forge-bg-hover)] transition-colors"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
