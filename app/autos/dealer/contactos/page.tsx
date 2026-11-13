"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { contactosApi, ContactosError } from "./contactos-api";
import { ContactoFicha } from "./ContactoFicha";
import { ContactoForm } from "./ContactoForm";
import type { Contacto, ContactoPayload } from "./contactos-tipos";

function fallo(e: unknown) { return e instanceof ContactosError ? e : new ContactosError(0, null, null); }

export default function ContactosPantalla() {
  const [items, setItems] = useState<Contacto[]>([]);
  const [actual, setActual] = useState<Contacto>();
  const [modo, setModo] = useState<"lista" | "nuevo" | "editar">("lista");
  const [cargando, setCargando] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ContactosError | null>(null);
  const [motivo, setMotivo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("dni");
  const version = useRef(0);
  const listar = useCallback(async () => {
    const v = ++version.current;
    setCargando(true); setError(null); setActual(undefined);
    try { const r = await contactosApi.listar(); if (v === version.current) setItems(r.items); }
    catch (e) { if (v === version.current) setError(fallo(e)); }
    finally { if (v === version.current) setCargando(false); }
  }, []);
  useEffect(() => { const contador = version; void listar(); return () => { ++contador.current; }; }, [listar]);
  async function operar(fn: () => Promise<Contacto>) {
    setBusy(true); setError(null);
    try {
      const c = await fn();
      setActual(c); setModo("lista"); setMotivo("");
      setItems((prev) => c.deactivated_at ? prev.filter((i) => i.id !== c.id) : [...prev.filter((i) => i.id !== c.id), c]);
    } catch (e) { setError(fallo(e)); } finally { setBusy(false); }
  }
  async function buscar(ev: React.FormEvent) {
    ev.preventDefault(); if (!busqueda.trim()) { await listar(); return; }
    setBusy(true); setError(null); setActual(undefined);
    try { setItems((await contactosApi.buscarDocumento({ [tipo]: busqueda.trim() })).items); }
    catch (e) { setError(fallo(e)); } finally { setBusy(false); }
  }
  const guardar = (p: ContactoPayload) => void operar(() => modo === "editar" && actual ? contactosApi.editar(actual.id, p) : contactosApi.crear(p));
  return <main className="space-y-4 text-nk-fg">
    <h1 className="text-2xl font-bold">Contactos del concesionario</h1>
    <a href="/autos/dealer/inventario" className="underline">Volver al inventario</a>
    {error && <p role="alert">{error.message}</p>}
    <button disabled={busy} onClick={() => { setActual(undefined); setError(null); setModo("nuevo"); }}>Nuevo contacto</button>
    {modo !== "lista" ? <ContactoForm key={actual?.id ?? "nuevo"} inicial={modo === "editar" ? actual : undefined} onSubmit={guardar} onCancel={() => setModo("lista")} enviando={busy} errorServidor={error} /> : <>
      <form onSubmit={buscar} className="flex flex-wrap gap-2">
        <label>Documento<select value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="dni">DNI</option><option value="cuit">CUIT</option></select></label>
        <label>Buscar por documento<input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></label>
        <button disabled={busy || cargando}>Buscar</button><button type="button" disabled={busy} onClick={() => { setBusqueda(""); void listar(); }}>Ver todos</button>
      </form>
      {cargando ? <p role="status">Cargando contactos…</p> : !error && !items.length ? <p>No hay contactos vigentes.</p> : <ul>{items.map((c) => <li key={c.id}><button disabled={busy} onClick={() => void operar(() => contactosApi.obtener(c.id))}>{c.display_name} {c.dni || c.cuit}</button></li>)}</ul>}
      {actual && <fieldset disabled={busy}>
        <ContactoFicha contacto={actual} onEditar={() => { setError(null); setModo("editar"); }} onReactivar={() => void operar(() => contactosApi.editar(actual.id, { reactivate: true }))} />
        {!actual.deactivated_at && <form onSubmit={(e) => { e.preventDefault(); if (motivo.trim()) void operar(() => contactosApi.editar(actual.id, { deactivation_reason: motivo.trim() })); }}>
          <label>Motivo de baja<input required value={motivo} onChange={(e) => setMotivo(e.target.value)} /></label><button>Dar de baja</button>
        </form>}
      </fieldset>}
    </>}
  </main>;
}
