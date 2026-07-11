"use client";

import { useCallback, useEffect, useState } from "react";
import { createUser, fetchRoles, fetchUsers, resetUserPassword } from "@/lib/cockpit/api/authUsers";
import { useCockpit } from "@/lib/cockpit/context";
import type { AuthUserRecord } from "@/lib/cockpit/types-platform";
import { PasswordTokenModal } from "@/components/cockpit/users/PasswordTokenModal";

export function UsersView() {
  const { tenantFilter } = useCockpit();
  const [users, setUsers] = useState<AuthUserRecord[]>([]);
  const [roles, setRoles] = useState<Array<{ role_key: string; display_name: string }>>([]);
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role_key: "", password: "" });

  const load = useCallback(async () => {
    const [u, r] = await Promise.all([fetchUsers(tenantFilter ?? undefined), fetchRoles()]);
    setUsers(u);
    setRoles(r);
  }, [tenantFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Usuarios</h1>
      <div className="grid gap-2 rounded-xl border border-cockpit-border bg-cockpit-surface p-4 sm:grid-cols-2">
        <input className="rounded border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm" placeholder="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <input className="rounded border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        <select className="rounded border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm" value={form.role_key} onChange={(e) => setForm((p) => ({ ...p, role_key: e.target.value }))}>
          <option value="">Rol</option>
          {roles.map((r) => (
            <option key={r.role_key} value={r.role_key}>{r.display_name}</option>
          ))}
        </select>
        <input className="rounded border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm" type="password" placeholder="Contraseña (opcional)" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
        <button
          type="button"
          className="rounded bg-cockpit-accent px-4 py-2 text-sm text-cockpit-bg sm:col-span-2 sm:w-fit"
          onClick={() =>
            void createUser({
              name: form.name,
              email: form.email,
              role_key: form.role_key,
              tenant_id: tenantFilter ?? users[0]?.tenant_id ?? "",
              password: form.password || undefined,
            }).then((res) => {
              if (res.reset_token) setToken(res.reset_token);
              void load();
            })
          }
        >
          Crear usuario
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-cockpit-muted">
          <tr>
            <th className="py-2 text-left">Nombre</th>
            <th className="py-2 text-left">Email</th>
            <th className="py-2 text-left">Rol</th>
            <th className="py-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-cockpit-border">
              <td className="py-2">{u.name}</td>
              <td className="py-2">{u.email}</td>
              <td className="py-2">{u.role_key}</td>
              <td className="py-2">
                <button
                  type="button"
                  className="text-xs text-cockpit-accent"
                  onClick={() =>
                    void resetUserPassword(u.id).then((r) => setToken(r.reset_token))
                  }
                >
                  Reset password
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <PasswordTokenModal token={token} onClose={() => setToken(null)} />
    </div>
  );
}
