"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  actualizarUsuario, crearUsuario, enviarAutenticado, listarRoles, listarUsuarios,
  type Enviar, type Usuario,
} from "./api";

interface Props {
  tenantId: string;
  enviar?: Enviar;
}

const msg = (e: unknown) => (e instanceof Error ? e.message : "Error inesperado.");

export function UsuariosAdmin({ tenantId, enviar = enviarAutenticado }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [correo, setCorreo] = useState("");
  const [rolAlta, setRolAlta] = useState("");
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [temporal, setTemporal] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [u, r] = await Promise.all([listarUsuarios(enviar, tenantId), listarRoles(enviar).catch(() => [])]);
      setUsuarios(u);
      setRoles(r);
      setError(null);
    } catch (e) {
      setUsuarios(null);
      setError(msg(e));
    }
  }, [enviar, tenantId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const opcionesRol = Array.from(new Set([...roles, ...(usuarios ?? []).map((u) => u.rol)])).filter(Boolean);

  async function ejecutar(accion: () => Promise<void>) {
    setOcupado(true);
    try {
      await accion();
      await cargar();
    } catch (e) {
      setError(msg(e));
    } finally {
      setOcupado(false);
    }
  }

  const alta = (ev: FormEvent) => {
    ev.preventDefault();
    const rol = rolAlta || opcionesRol[0] || "";
    if (!correo.trim() || !rol) return;
    void ejecutar(async () => {
      setTemporal(await crearUsuario(enviar, tenantId, correo.trim(), rol));
      setCorreo("");
    });
  };

  const cambiarRol = (u: Usuario, rol: string) => ejecutar(() => actualizarUsuario(enviar, u.id, { role: rol }));
  const baja = (u: Usuario) =>
    ejecutar(async () => {
      setConfirmando(null);
      await actualizarUsuario(enviar, u.id, { is_active: false });
    });

  return (
    <section data-testid="usuarios-admin" className="space-y-4">
      <h1 className="text-2xl font-semibold">Usuarios y roles</h1>
      {error && (
        <p role="alert" data-testid="usuarios-error" className="rounded border border-red-500/40 p-3 text-red-400">
          {error}
        </p>
      )}
      {temporal && (
        <p data-testid="usuarios-temporal" className="rounded border border-amber-500/40 p-3 text-amber-400">
          Usuario creado. Clave temporal (se muestra una sola vez): <code>{temporal}</code>
          <button type="button" className="ml-3 underline" onClick={() => setTemporal(null)}>Cerrar</button>
        </p>
      )}
      <form onSubmit={alta} className="flex flex-wrap gap-2" data-testid="usuarios-alta">
        <input
          type="email" required aria-label="Correo del nuevo usuario" placeholder="correo@empresa.com"
          value={correo} onChange={(e) => setCorreo(e.target.value)}
          className="min-w-[14rem] flex-1 rounded border px-3 py-2 text-sm text-black"
        />
        <select
          aria-label="Rol del nuevo usuario" value={rolAlta || opcionesRol[0] || ""}
          onChange={(e) => setRolAlta(e.target.value)} className="rounded border px-3 py-2 text-sm text-black"
        >
          {opcionesRol.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="submit" disabled={ocupado} className="rounded bg-blue-600 px-4 py-2 text-sm text-white">
          Crear usuario
        </button>
      </form>
      {usuarios === null && !error && <p data-testid="usuarios-cargando">Cargando usuarios…</p>}
      {usuarios !== null && usuarios.length === 0 && <p data-testid="usuarios-vacio">Sin usuarios todavía.</p>}
      {usuarios !== null && usuarios.length > 0 && (
        <table className="w-full text-left text-sm" data-testid="usuarios-tabla">
          <thead>
            <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th /></tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} data-testid={`usuario-${u.id}`}>
                <td>{u.nombre}</td>
                <td>{u.correo}</td>
                <td>
                  <select
                    aria-label={`Rol de ${u.correo}`} value={u.rol} disabled={ocupado}
                    onChange={(e) => void cambiarRol(u, e.target.value)} className="rounded border px-2 py-1 text-black"
                  >
                    {opcionesRol.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td>{u.activo ? "Activo" : "Inactivo"}</td>
                <td>
                  {u.activo && confirmando !== u.id && (
                    <button type="button" onClick={() => setConfirmando(u.id)} className="text-red-400 underline">
                      Desactivar
                    </button>
                  )}
                  {confirmando === u.id && (
                    <span role="group" aria-label={`Confirmar baja de ${u.correo}`}>
                      ¿Desactivar a {u.correo}?{" "}
                      <button type="button" onClick={() => void baja(u)} className="text-red-400 underline">Confirmar</button>{" "}
                      <button type="button" onClick={() => setConfirmando(null)} className="underline">Cancelar</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
