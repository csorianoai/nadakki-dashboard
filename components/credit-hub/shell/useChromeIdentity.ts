"use client";

import { useContext } from "react";
import { AuthContext } from "@/lib/auth/auth-context";

export interface ChromeIdentity {
  /** Display name; explicit non-demo fallback "Usuario" when unknown. */
  name: string;
  /** Avatar initials; "—" when no real name is available. */
  initials: string;
  /** Account email; empty string when unknown (caller hides the line). */
  email: string;
  /** Active role label (e.g. "Analista de riesgo"); empty when unknown. */
  role: string;
}

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

/**
 * Real chrome identity sourced from the auth session (`AuthContext`).
 *
 * Context-safe by design: read directly via `useContext` (not `useAuth`, which
 * throws outside a provider) so the shared shell never crashes in tests/SSR and
 * never falls back to a demo identity like "María Reyes" — only to the explicit
 * "Usuario" / "—" placeholders. PR-FE-1.
 */
export function useChromeIdentity(): ChromeIdentity {
  const auth = useContext(AuthContext);
  const rawName = auth?.user?.name?.trim() ?? "";
  const email = auth?.user?.email?.trim() ?? "";
  const role = auth?.activeRole?.display_name?.trim() ?? "";
  return {
    name: rawName || "Usuario",
    initials: rawName ? toInitials(rawName) : "—",
    email,
    role,
  };
}
