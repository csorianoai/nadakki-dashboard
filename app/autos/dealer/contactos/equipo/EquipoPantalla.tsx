"use client";

import { useCallback, useEffect, useState } from "react";
import {
  desactivarMiembro,
  invitarVendedor,
  listarEquipo,
  mensajeError,
  NOMBRE_ROL,
  validarEmail,
  type Miembro,
  type ResultadoInvitacion,
} from "./equipo-api";

const BTN = "rounded-md border border-nk-border px-3 py-1.5 text-sm text-nk-fg disabled:opacity-50";

const AVISO_ESTADO: Record<ResultadoInvitacion["status"], string> = {
  created: "Listo: el vendedor ya tiene usuario.",
  reactivated: "Listo: el usuario estaba desactivado y lo volvimos a activar.",
  already_member: "Esa persona ya estaba en tu equipo. No cambiamos nada.",
  added_to_dealer: "Esa persona ya tenía usuario; ahora también está en este concesionario.",
};

/** Equipo del concesionario: lista, invitar vendedor (clave temporal mostrada una sola vez) y desactivar. */
export function EquipoPantalla() {
  const [items, setItems] = useState<Miembro[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [errEmail, setErrEmail] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoInvitacion | null>(null);
  const [aConfirmar, setAConfirmar] = useState<Miembro | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setItems(await listarEquipo());
    } catch (e) {
      setItems(null);
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);
  useEffect(() => void cargar(), [cargar]);

  async function invitar(ev: React.FormEvent) {
    ev.preventDefault();
    const problema = validarEmail(email);
    setErrEmail(problema);
    if (problema) return;
    setEnviando(true);
    setError(null);
    setAviso(null);
    setResultado(null);
    try {
      const r = await invitarVendedor(email);
      setResultado(r);
      setEmail("");
      void cargar();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarDesactivar() {
    if (!aConfirmar) return;
    const m = aConfirmar;
    setEnviando(true);
    setError(null);
    try {
      await desactivarMiembro(m.user_id);
      setAviso(`${m.email} quedó desactivado. Ya no puede entrar.`);
      setAConfirmar(null);
      void cargar();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-nk-fg">Equipo</h1>
        <p className="text-sm text-nk-muted">Invitá a tus vendedores. Cada uno entra con su propio usuario.</p>
      </header>

      <section aria-labelledby="titulo-invitar" className="space-y-2 rounded-lg border border-nk-border p-4">
        <h2 id="titulo-invitar" className="font-medium text-nk-fg">Invitar vendedor</h2>
        <form onSubmit={invitar} noValidate className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col text-sm text-nk-fg">
            Correo del vendedor
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-nk-border px-2 py-1"
              autoComplete="off"
              aria-invalid={errEmail ? true : undefined}
            />
          </label>
          <button type="submit" className={BTN} disabled={enviando}>
            {enviando ? "Invitando…" : "Invitar"}
          </button>
        </form>
        {errEmail && <p role="alert" className="text-sm text-red-600">{errEmail}</p>}
        {resultado && (
          <div role="status" className="space-y-1 rounded-md bg-nk-surface p-3 text-sm text-nk-fg">
            <p>{AVISO_ESTADO[resultado.status]}</p>
            {resultado.temporary_password && (
              <>
                <p>
                  Pasale a <strong>{resultado.email}</strong> esta clave temporal. Al entrar le vamos a pedir que la
                  cambie. <strong>Anotala ahora: no la vas a poder ver de nuevo.</strong>
                </p>
                <p>
                  Clave temporal: <code data-testid="clave-temporal">{resultado.temporary_password}</code>
                </p>
                <button type="button" className={BTN} onClick={() => setResultado(null)}>
                  Ya la anoté
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {aviso && <p role="status" className="text-sm text-nk-fg">{aviso}</p>}

      <section aria-labelledby="titulo-lista">
        <h2 id="titulo-lista" className="mb-2 font-medium text-nk-fg">Personas del equipo</h2>
        {cargando && <p className="text-sm text-nk-muted">Cargando equipo…</p>}
        {!cargando && items && items.length === 0 && (
          <p className="text-sm text-nk-muted">Todavía no hay nadie en el equipo.</p>
        )}
        {!cargando && items && items.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.user_id}>
                  <td>{m.email}{m.is_self ? " (vos)" : ""}</td>
                  <td>{m.is_admin ? "Administrador" : NOMBRE_ROL[m.autos_role] ?? m.autos_role}</td>
                  <td>{m.is_active ? "Activo" : "Desactivado"}</td>
                  <td>
                    {m.is_active && !m.is_self && !m.is_admin && (
                      <button type="button" className={BTN} disabled={enviando} onClick={() => setAConfirmar(m)}>
                        Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {aConfirmar && (
        <div role="dialog" aria-modal="true" aria-labelledby="titulo-confirmar" className="rounded-lg border border-nk-border p-4">
          <h2 id="titulo-confirmar" className="font-medium text-nk-fg">¿Desactivar a {aConfirmar.email}?</h2>
          <p className="text-sm text-nk-muted">
            No se borra nada: deja de poder entrar. Si después lo volvés a invitar, se reactiva con una clave nueva.
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" className={BTN} disabled={enviando} onClick={() => void confirmarDesactivar()}>
              Sí, desactivar
            </button>
            <button type="button" className={BTN} disabled={enviando} onClick={() => setAConfirmar(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
