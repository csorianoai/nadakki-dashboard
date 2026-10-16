"use client";

import { QueryClientContext } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listarEmpresasContextoV2, type EmpresaContexto, type VistaContexto } from "@/lib/api/auth-v2";
import { tokenStorage } from "@/lib/auth/token-storage";
import { CLASES } from "./clases";

const VISTAS: { id: VistaContexto; nombre: string }[] = [
  { id: "banco", nombre: "Banco" },
  { id: "concesionario", nombre: "Concesionario" },
  { id: "inmobiliaria", nombre: "Inmobiliaria" },
];
const CLAVE_VISTA = "nadakki:contexto-vista";

function vistaGuardada(): VistaContexto {
  try {
    const v = window.localStorage.getItem(CLAVE_VISTA);
    if (VISTAS.some((x) => x.id === v)) return v as VistaContexto;
  } catch {
    /* sin localStorage: vista por defecto */
  }
  return "banco";
}

/**
 * Selector Empresa + Vista del platform_superadmin (ModuleTopBar solo lo monta para ese rol; aquí también se
 * comprueba). Lista las empresas de /contexto/empresas (con buscador), y al elegir una fija el contexto con
 * `fijarContexto` de useAuth (guarda los tokens nuevos y cambia tenant/roles); luego recarga los datos. La
 * empresa mostrada es el tenant de useAuth: tras recargar, /refresh del backend conserva el contexto.
 */
export function SelectorContexto() {
  const { tenant, allRoles, fijarContexto } = useAuth();
  const router = useRouter();
  const queryClient = useContext(QueryClientContext);
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const [vista, setVista] = useState<VistaContexto>("banco");
  const [empresas, setEmpresas] = useState<EmpresaContexto[]>([]);
  const [estado, setEstado] = useState<"idle" | "cargando" | "error">("idle");
  const [fijando, setFijando] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const esSuperadmin = (allRoles ?? []).some((r) => r.role_key === "platform_superadmin");

  useEffect(() => { setVista(vistaGuardada()); }, []);

  useEffect(() => {
    if (!abierto || !esSuperadmin) return;
    let vigente = true;
    setEstado("cargando");
    const t = setTimeout(async () => {
      const token = tokenStorage.getAccessToken();
      const r = token ? await listarEmpresasContextoV2(token, q) : null;
      if (!vigente) return;
      if (r?.ok && r.data) { setEmpresas(r.data); setEstado("idle"); } else setEstado("error");
    }, q ? 250 : 0);
    return () => { vigente = false; clearTimeout(t); };
  }, [abierto, q, esSuperadmin]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => { if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", tecla); };
  }, [abierto]);

  if (!esSuperadmin || !fijarContexto) return null;

  const elegir = async (id: string, v: VistaContexto) => {
    setFijando(true);
    const r = await fijarContexto(id, v);
    setFijando(false);
    if (!r.ok) { setEstado("error"); return; }
    try { window.localStorage.setItem(CLAVE_VISTA, v); } catch { /* conveniencia, no esencial */ }
    setVista(v);
    setAbierto(false);
    void queryClient?.invalidateQueries();
    router.refresh?.();
  };

  return (
    <div ref={raiz} className="relative" data-testid="selector-contexto">
      <button type="button" aria-haspopup="true" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)} className={`${CLASES.boton} ${abierto ? CLASES.botonActivo : ""}`}>
        <Building2 aria-hidden className="h-4 w-4" />
        <span className="max-w-[10rem] truncate" data-testid="contexto-empresa">{tenant?.display_name ?? "Empresa"}</span>
        <span className="text-zinc-500">· {VISTAS.find((x) => x.id === vista)?.nombre}</span>
        <ChevronDown aria-hidden className="h-3 w-3" />
      </button>
      {abierto ? (
        <div className={CLASES.desplegable} data-testid="selector-contexto-panel">
          <label className="sr-only" htmlFor="contexto-vista">Vista</label>
          <select id="contexto-vista" value={vista} onChange={(e) => setVista(e.target.value as VistaContexto)} className="mb-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200">
            {VISTAS.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </select>
          <input type="search" aria-label="Buscar empresa" placeholder="Buscar empresa…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200" />
          {estado === "error" ? <p role="alert" className="px-2 py-1 text-xs text-red-400">No se pudo cargar o fijar la empresa.</p> : null}
          <ul className="max-h-64 overflow-y-auto" aria-label="Empresas">
            {empresas.map((e) => (
              <li key={e.id}>
                <button type="button" disabled={fijando} onClick={() => void elegir(e.id, vista)} aria-current={tenant?.id === e.id ? "true" : undefined} className={`${CLASES.desplegableItem} w-full text-left ${tenant?.id === e.id ? CLASES.desplegableActivo : ""}`}>
                  {e.display_name}
                </button>
              </li>
            ))}
            {estado === "idle" && empresas.length === 0 ? <li className="px-2 py-1 text-xs text-zinc-500">Sin resultados</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
