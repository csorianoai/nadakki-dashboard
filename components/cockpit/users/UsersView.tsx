"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchRoles, fetchUsers } from "@/lib/cockpit/api/authUsers";
import { useCockpit } from "@/lib/cockpit/context";
import type { AuthUserRecord } from "@/lib/cockpit/types-platform";
import { UserReadOnlyDrawer } from "@/components/cockpit/users/UserReadOnlyDrawer";

export function UsersView() {
  const { tenantFilter } = useCockpit();
  const [users, setUsers] = useState<AuthUserRecord[]>([]);
  const [roles, setRoles] = useState<Array<{ role_key: string; display_name: string }>>([]);
  const [emailSearch, setEmailSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selected, setSelected] = useState<AuthUserRecord | null>(null);

  const load = useCallback(async () => {
    const [u, r] = await Promise.all([fetchUsers(tenantFilter ?? undefined), fetchRoles()]);
    setUsers(u);
    setRoles(r);
  }, [tenantFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = emailSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !u.email.toLowerCase().includes(q) && !u.name.toLowerCase().includes(q)) return false;
      if (roleFilter && u.role_key !== roleFilter) return false;
      return true;
    });
  }, [users, emailSearch, roleFilter]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Usuarios</h1>
      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-[12rem] flex-1 rounded border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm"
          placeholder="Buscar por email o nombre"
          value={emailSearch}
          onChange={(e) => setEmailSearch(e.target.value)}
          data-testid="users-email-search"
        />
        <select
          className="rounded border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          data-testid="users-role-filter"
        >
          <option value="">Todos los roles</option>
          {roles.map((r) => (
            <option key={r.role_key} value={r.role_key}>
              {r.display_name}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-cockpit-border">
        <table className="w-full text-sm">
          <thead className="bg-cockpit-surface text-xs uppercase text-cockpit-muted">
            <tr>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Rol</th>
              <th className="px-3 py-2 text-left">Tenant</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="cursor-pointer border-t border-cockpit-border transition-colors hover:bg-cockpit-border/20"
                onClick={() => setSelected(u)}
                data-testid={`user-row-${u.id}`}
              >
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                <td className="px-3 py-2 font-mono tabular-nums">{u.role_key}</td>
                <td className="px-3 py-2 font-mono text-xs text-cockpit-muted">{u.tenant_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <UserReadOnlyDrawer user={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
