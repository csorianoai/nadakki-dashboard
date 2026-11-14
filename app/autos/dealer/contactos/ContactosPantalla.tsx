"use client";

import { useCallback, useEffect, useState } from "react";
import { ContactoFicha } from "./ContactoFicha";
import { ContactoForm } from "./ContactoForm";
import { actualizarContacto, buscarContactos, crearContacto, darDeBaja, errorContacto, reactivar, type ErrorContacto } from "./contactos-api";
import type { Contacto, ContactoPayload } from "./contactos-tipos";

type Modo = "ficha" | "nuevo" | "editar" | "baja";
const BTN = "rounded-md border border-nk-border px-3 py-1.5 text-sm text-nk-fg";

/** Lista, ficha, alta/edicion y baja logica de contactos del dealer. Sin boton de borrado. */
export function ContactosPantalla() {
  const [items, setItems] = useState<Contacto[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ErrorContacto | null>(null);
  const [sel, setSel] = useState<Contacto | null>(null);
  const [modo, setModo] = useState<Modo>("ficha");
  const [enviando, setEnviando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [errMotivo, setErrMotivo] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setItems(await buscarContactos(""));
    } catch (e) {
      setItems(null);
      setError(errorContacto(e));
    } finally {
      setCargando(false);
    }
  }, []);
  useEffect(() => void cargar(), [cargar]);

  async function ejecutar(accion: () => Promise<Contacto>, siguiente: Modo = "ficha") {
    setEnviando(true);
    setError(null);
    try {
      setSel(await accion());
      setModo(siguiente);
      void cargar();
    } catch (e) {
      setError(errorContacto(e));
    } finally {
      setEnviando(false);
    }
  }

  function confirmarBaja() {
    if (!sel) return;
    if (!motivo.trim()) return setErrMotivo("El motivo de la baja es obligatorio.");
    setErrMotivo(null);
    void ejecutar(() => darDeBaja(sel.id, motivo.trim())).then(() => setMotivo(""));
  }

  const guardar = (p: ContactoPayload) => ejecutar(() => (modo === "editar" && sel ? actualizarContacto(sel.id, p) : crearContacto(p)));
  const abrir = (c: Contacto | null, m: Modo) => (setSel(c), setModo(m), setError(null));

  return (
    <main className="mx-auto grid max-w-5xl gap-6 p-4 md:grid-cols-[18rem_1fr]">
      <section aria-label="Lista de contactos">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-nk-fg">Contactos</h1>
          <button type="button" onClick={() => abrir(null, "nuevo")} className={BTN}>Nuevo contacto</button>
        </div>
        {cargando && <p role="status" className="mt-3 text-sm text-nk-fg-muted">Cargando contactos…</p>}
        {!cargando && items?.length === 0 && <p className="mt-3 text-sm text-nk-fg-muted">No hay contactos todavía.</p>}
        {items && items.length > 0 && (
          <ul className="mt-3 divide-y divide-nk-border rounded-md border border-nk-border">
            {items.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => abrir(c, "ficha")} aria-current={sel?.id === c.id || undefined} className="w-full px-3 py-2 text-left text-sm text-nk-fg">
                  {c.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div>
        {error && (
          <div role="alert" className="mb-3 rounded-md border border-red-700 p-3 text-sm font-medium text-red-700">
            {error.message}{" "}
            {modo === "ficha" && !sel && <button type="button" onClick={() => void cargar()} className="underline">Reintentar</button>}
          </div>
        )}
        {(modo === "nuevo" || modo === "editar") && (
          <ContactoForm inicial={modo === "editar" ? sel ?? undefined : undefined} onSubmit={guardar} onCancel={() => setModo("ficha")} enviando={enviando} errorServidor={error} />
        )}
        {sel && (modo === "ficha" || modo === "baja") && (
          <>
            <ContactoFicha contacto={sel} onEditar={() => setModo("editar")} onBaja={() => setModo("baja")} onReactivar={() => void ejecutar(() => reactivar(sel.id))} />
            {modo === "baja" && (
              <div className="mt-3 space-y-2">
                <label htmlFor="motivo-baja" className="text-sm font-medium text-nk-fg">Motivo de la baja</label>
                <input id="motivo-baja" value={motivo} aria-invalid={errMotivo ? "true" : undefined} onChange={(e) => setMotivo(e.target.value)} className="w-full rounded-md border border-nk-border bg-nk-surface px-2 py-1.5 text-sm text-nk-fg" />
                {errMotivo && <p role="alert" className="text-xs font-medium text-red-700">{errMotivo}</p>}
                <div className="flex gap-2">
                  <button type="button" disabled={enviando} onClick={confirmarBaja} className={BTN}>Confirmar baja</button>
                  <button type="button" onClick={() => setModo("ficha")} className={BTN}>Cancelar</button>
                </div>
              </div>
            )}
          </>
        )}
        {!sel && modo === "ficha" && !error && !cargando && <p className="text-sm text-nk-fg-muted">Elige un contacto o crea uno nuevo.</p>}
      </div>
    </main>
  );
}
