"use client";

import { useCallback, useEffect, useState } from "react";
import { createUser, fetchRoles, fetchUsers, resetUserPassword } from "../api/authUsers";
import { useCockpit } from "../context";
import { PanelFrame, PanelSkeleton } from "../components/PanelFrame";
import type { AuthUserRecord } from "../types-platform";
import { PasswordTokenModal } from "./PasswordTokenModal";

export function UsersPanel() {
  const { tenantFilter, isPlatformSuperadmin } = useCockpit();
  const [users, setUsers] = useState<AuthUserRecord[]>([]);
  const [roles, setRoles] = useState<Array<{ role_key: string; display_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role_key: "", password: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [u, r] = await Promise.all([fetchUsers(tenantFilter ?? undefined), fetchRoles()]);
    setUsers(u);
    setRoles(r);
    setLoading(false);
  }, [tenantFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async () => {
    if (!tenantFilter && !isPlatformSuperadmin) return;
    try {
      const res = await createUser({
        name: form.name,
        email: form.email,
        role_key: form.role_key,
        tenant_id: tenantFilter ?? users[0]?.tenant_id ?? "",
        password: form.password || undefined,
      });
      if (res.reset_token) setToken(res.reset_token);
      setForm({ name: "", email: "", role_key: "", password: "" });
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    }
  };

  const onReset = async (userId: string) => {
    if (!window.confirm("¿Generar token de restablecimiento?")) return;
    try {
      const res = await resetUserPassword(userId);
      setToken(res.reset_token);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <PanelFrame title="Usuarios">
      <div className="mb-3 grid gap-2 sm:grid-cols-2 text-sm">
        <input className="ch-input" placeholder="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <input className="ch-input" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        <select className="ch-input" value={form.role_key} onChange={(e) => setForm((p) => ({ ...p, role_key: e.target.value }))}>
          <option value="">Rol</option>
          {roles.map((r) => (
            <option key={r.role_key} value={r.role_key}>{r.display_name}</option>
          ))}
        </select>
        <input className="ch-input" placeholder="Contraseña (opcional)" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
        <button type="button" className="ch-btn ch-btn-persona ch-btn-sm" onClick={() => void onCreate()}>Crear usuario</button>
      </div>
      {loading ? <PanelSkeleton /> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[var(--ch-text-3)] border-b">
              <th className="py-2 text-left">Nombre</th>
              <th className="py-2 text-left">Email</th>
              <th className="py-2 text-left">Rol</th>
              <th className="py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[var(--ch-line)]">
                <td className="py-2">{u.name}</td>
                <td className="py-2">{u.email}</td>
                <td className="py-2">{u.role_key}</td>
                <td className="py-2">
                  <button type="button" className="text-xs text-[var(--ch-persona)]" onClick={() => void onReset(u.id)}>Reset password</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <PasswordTokenModal token={token} onClose={() => setToken(null)} />
    </PanelFrame>
  );
}
