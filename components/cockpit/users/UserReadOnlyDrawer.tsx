"use client";

import type { AuthUserRecord } from "@/lib/cockpit/types-platform";
import { AdminPanelLink } from "@/components/cockpit/AdminPanelLink";
import { adminUserEditUrl } from "@/lib/cockpit/consolidation";

export function UserReadOnlyDrawer({
  user,
  onClose,
}: {
  user: AuthUserRecord | null;
  onClose: () => void;
}) {
  if (!user) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-cockpit-border bg-cockpit-surface shadow-xl"
        role="dialog"
        aria-labelledby="user-drawer-title"
      >
        <header className="flex items-center justify-between border-b border-cockpit-border px-4 py-3">
          <h2 id="user-drawer-title" className="text-lg font-semibold text-cockpit-text">
            Usuario
          </h2>
          <button
            type="button"
            className="text-cockpit-muted hover:text-cockpit-text"
            onClick={onClose}
            aria-label="Cerrar panel"
          >
            ✕
          </button>
        </header>
        <dl className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
          <div>
            <dt className="text-xs uppercase text-cockpit-muted">Nombre</dt>
            <dd className="mt-1 text-cockpit-text">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-cockpit-muted">Email</dt>
            <dd className="mt-1 font-mono text-cockpit-text">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-cockpit-muted">Rol</dt>
            <dd className="mt-1 font-mono tabular-nums text-cockpit-text">{user.role_key}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-cockpit-muted">Tenant ID</dt>
            <dd className="mt-1 break-all font-mono text-xs text-cockpit-muted">{user.tenant_id}</dd>
          </div>
          {user.core_codes?.length ? (
            <div>
              <dt className="text-xs uppercase text-cockpit-muted">Cores</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {user.core_codes.map((c) => (
                  <span key={c} className="rounded bg-cockpit-accent/15 px-1.5 text-xs">
                    {c}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
        <footer className="border-t border-cockpit-border p-4">
          <AdminPanelLink href={adminUserEditUrl(user.tenant_id, user.id)}>
            Editar en Panel admin →
          </AdminPanelLink>
        </footer>
      </aside>
    </>
  );
}
