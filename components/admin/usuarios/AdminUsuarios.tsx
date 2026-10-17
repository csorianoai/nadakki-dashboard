"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/fetch-client";
import { useAuth } from "@/hooks/useAuth";
import { esSuperadminDePlataforma } from "@/lib/auth/platform-staff";
import {
  altaUsuario,
  cambiarEstado,
  cambiarRol,
  listarRoles,
  listarUsuarios,
  type Enviar,
  type Rol,
  type Usuario,
} from "./api";
import { ConfirmarBaja } from "./ConfirmarBaja";
import { FormAlta } from "./FormAlta";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Error inesperado.");

/**
 * Gestion de usuarios del tenant activo. Fail-closed: sin sesion de administrador no pinta nada ni llama al API.
 * El backend decide igual: esto solo evita mostrar la pantalla a quien no corresponde.
 */
export function AdminUsuarios({ enviar = apiFetch }: { enviar?: Enviar }) {
  const { isLoading, tenant, allRoles } = useAuth();
  const tenantId = tenant?.id ?? null;
  const permitido = !isLoading && !!tenantId && esSuperadminDePlataforma(allRoles);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baja, setBaja] = useState<Usuario | null>(null);

  const cargar = useCallback(async () => {
    if (!tenantId) return;
    setError(null);
    try {
      const [u, r] = await Promise.all([listarUsuarios(tenantId, enviar), listarRoles(enviar)]);
      setUsuarios(u);
      setRoles(r);
    } catch (e) {
      setUsuarios([]);
      setError(msg(e));
    } finally {
      setCargando(false);
    }
  }, [tenantId, enviar]);

  useEffect(() => {
    if (permitido) void cargar();
  }, [permitido, cargar]);

  const accion = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
      await cargar();
    } catch (e) {
      setError(msg(e));
    }
  };

  if (!permitido) return null;

  return (
    <section data-testid="admin-usuarios" className="mx-auto max-w-4xl space-y-4 p-6 text-white">
      <h1 className="text-2xl font-semibold">Usuarios y roles</h1>
      {error && (
        <p role="alert" className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      <FormAlta roles={roles} onAlta={(email, rol) => accion(() => altaUsuario(enviar, tenantId!, email, rol))} />
      {cargando ? (
        <p role="status" className="text-sm text-gray-400">Cargando usuarios…</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-400">
              <th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-white/10">
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    data-testid={`rol-${u.id}`}
                    aria-label={`Rol de ${u.email}`}
                    className="rounded bg-black/30 px-2 py-1"
                    value={u.role}
                    onChange={(e) => accion(() => cambiarRol(enviar, u.id, e.target.value))}
                  >
                    {!roles.some((r) => r.role_key === u.role) && <option value={u.role}>{u.role || "—"}</option>}
                    {roles.map((r) => (
                      <option key={r.role_key} value={r.role_key}>{r.display_name}</option>
                    ))}
                  </select>
                </td>
                <td>{u.activo ? "Activo" : "Inactivo"}</td>
                <td>
                  {u.activo && (
                    <button data-testid={`baja-${u.id}`} className="text-red-300 hover:text-red-200" onClick={() => setBaja(u)}>
                      Dar de baja
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!cargando && !error && usuarios.length === 0 && <p className="text-sm text-gray-400">Sin usuarios todavía.</p>}
      {baja && (
        <ConfirmarBaja
          usuario={baja}
          onNo={() => setBaja(null)}
          onSi={() => {
            const u = baja;
            setBaja(null);
            void accion(() => cambiarEstado(enviar, u.id, false));
          }}
        />
      )}
    </section>
  );
}
