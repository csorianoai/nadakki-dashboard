"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import {
  ClientTenantApiError,
  createClientTenant,
  listPlatformCores,
  type ClientTenantResult,
  type PlatformCore,
} from "@/lib/admin/client-tenant-api";

type Form = {
  name: string;
  slug: string;
  industry: string;
  country: string;
  currency: string;
  locale: string;
  cores: string[];
  email: string;
  password: string;
};

const EMPTY: Form = {
  name: "", slug: "", industry: "", country: "", currency: "", locale: "", cores: [], email: "", password: "",
};

const INDUSTRIES = ["Bienes raices", "Agencia de marketing", "Comercio", "Servicios", "Otra"];
const COUNTRIES: [string, string][] = [
  ["AR", "Argentina"], ["CL", "Chile"], ["CO", "Colombia"], ["ES", "España"], ["MX", "México"],
  ["PE", "Perú"], ["DO", "República Dominicana"], ["US", "Estados Unidos"], ["UY", "Uruguay"],
];
const CURRENCIES = ["ARS", "CLP", "COP", "DOP", "EUR", "MXN", "PEN", "USD", "UYU"];
const LOCALES: [string, string][] = [["es", "Español"], ["en", "Inglés"], ["pt", "Portugués"]];

const inputClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-purple-400";

export function suggestSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function newAttemptRef(): string {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `ui:client:${id}`;
}

function messageFor(error: unknown): string {
  if (error instanceof ClientTenantApiError) {
    if (error.status === 403) return "Tu usuario no puede dar de alta clientes.";
    if (error.status === 401) return "Su sesión expiró. Inicie sesión de nuevo antes de reintentar.";
    if (error.status === 409 && error.code === "SLUG_EXISTS") return "Ese slug ya está en uso. Pruebe con otro.";
    if (error.status === 409) return "Este intento ya se registró con otros datos. Revise el formulario y envíelo de nuevo.";
    if (error.status === 422 && error.code === "core_not_available") {
      return `Estos cores no están disponibles en la plataforma: ${error.cores.join(", ") || "los elegidos"}. Desmárquelos e intente de nuevo.`;
    }
    if (error.status === 422) return "Revise los datos: alguno no es válido.";
  }
  return "No pudimos crear el cliente. Lo escrito se conservó; vuelva a intentarlo en un momento.";
}

export function ClientTenantForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugEdited, setSlugEdited] = useState(false);
  const [available, setAvailable] = useState<PlatformCore[] | null>(null);
  const [coresFailed, setCoresFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClientTenantResult | null>(null);
  const inFlight = useRef(false);
  const attemptRef = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    listPlatformCores()
      .then((cores) => alive && setAvailable(cores))
      .catch(() => alive && setCoresFailed(true));
    return () => { alive = false; };
  }, []);

  // Editing anything starts a new attempt; a plain retry keeps the same reference.
  const edit = (patch: Partial<Form>) => {
    attemptRef.current = null;
    setForm((current) => ({ ...current, ...patch }));
  };

  const toggleCore = (core: string) =>
    edit({ cores: form.cores.includes(core) ? form.cores.filter((c) => c !== core) : [...form.cores, core] });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    setError(null);
    setResult(null);
    if (form.cores.length === 0) {
      setError("Marque al menos un core para el cliente.");
      return;
    }
    inFlight.current = true;
    setLoading(true);
    attemptRef.current ??= newAttemptRef();
    try {
      const created = await createClientTenant({
        tenant_name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        organization_archetype: "client",
        industry: form.industry.trim(),
        country_code: form.country,
        currency: form.currency,
        locale: form.locale,
        cores_enabled: form.cores,
        admin_email: form.email.trim(),
        admin_password: form.password,
        external_ref: attemptRef.current,
      });
      setResult(created);
      setForm(EMPTY);
      setSlugEdited(false);
      attemptRef.current = null;
    } catch (caught) {
      setError(messageFor(caught));
      // A definitive rejection created nothing: next try is a new attempt. Network/5xx keeps the reference.
      if (caught instanceof ClientTenantApiError && caught.status < 500) attemptRef.current = null;
    } finally {
      setForm((current) => ({ ...current, password: "" }));
      inFlight.current = false;
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 md:grid-cols-2">
      <label className="text-sm text-gray-300">Nombre del cliente<input data-testid="client-name" required className={inputClass} value={form.name} onChange={(e) => edit({ name: e.target.value, ...(slugEdited ? {} : { slug: suggestSlug(e.target.value) }) })} /></label>
      <label className="text-sm text-gray-300">Slug (identificador corto)<input data-testid="client-slug" required pattern="[a-z0-9][a-z0-9-]*[a-z0-9]" className={inputClass} value={form.slug} onChange={(e) => { setSlugEdited(true); edit({ slug: e.target.value }); }} /></label>
      <label className="text-sm text-gray-300">Industria<input data-testid="client-industry" required list="client-industries" minLength={2} className={inputClass} value={form.industry} onChange={(e) => edit({ industry: e.target.value })} /><datalist id="client-industries">{INDUSTRIES.map((i) => <option key={i} value={i} />)}</datalist></label>
      <label className="text-sm text-gray-300">País<select data-testid="client-country" required className={inputClass} value={form.country} onChange={(e) => edit({ country: e.target.value })}><option value="">Elija…</option>{COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
      <label className="text-sm text-gray-300">Moneda<select data-testid="client-currency" required className={inputClass} value={form.currency} onChange={(e) => edit({ currency: e.target.value })}><option value="">Elija…</option>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
      <label className="text-sm text-gray-300">Idioma<select data-testid="client-locale" required className={inputClass} value={form.locale} onChange={(e) => edit({ locale: e.target.value })}><option value="">Elija…</option>{LOCALES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>

      <fieldset className="md:col-span-2">
        <legend className="text-sm text-gray-300">Cores a activar</legend>
        {coresFailed ? <p className="mt-1 text-sm text-red-300">No pudimos cargar los cores disponibles. Recargue la página.</p> : null}
        {!coresFailed && available === null ? <p className="mt-1 text-sm text-gray-400">Cargando cores…</p> : null}
        <div className="mt-2 flex flex-wrap gap-4">
          {(available ?? []).map((core) => (
            <label key={core.core_name} className="flex items-center gap-2 text-sm text-white">
              <input type="checkbox" data-testid={`client-core-${core.core_name}`} checked={form.cores.includes(core.core_name)} onChange={() => toggleCore(core.core_name)} />
              {core.display_name}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="text-sm text-gray-300">Correo del administrador<input data-testid="client-email" required type="email" className={inputClass} value={form.email} onChange={(e) => edit({ email: e.target.value })} /></label>
      <label className="text-sm text-gray-300">Contraseña temporal (mínimo 12 caracteres)<input data-testid="client-password" required minLength={12} type="password" autoComplete="new-password" className={inputClass} value={form.password} onChange={(e) => edit({ password: e.target.value })} /></label>

      <div className="md:col-span-2">
        {error ? <div role="alert" className="mb-4 flex gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div> : null}
        {result ? (
          <div role="status" data-testid="client-result" className="mb-4 flex gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>
              {result.idempotent ? "Ese cliente ya existía; no se duplicó." : "Cliente creado."} Slug: <strong>{result.slug}</strong>
              {result.tenant_id ? ` · Identificador: ${result.tenant_id}` : ""}. Recuerde: el administrador deberá cambiar la contraseña al entrar.
            </span>
          </div>
        ) : null}
        <button data-testid="submit-client" disabled={loading || coresFailed || available === null} className="rounded-lg bg-purple-600 px-5 py-2.5 font-medium text-white disabled:opacity-50">
          {loading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Creando…</span> : "Crear cliente o agencia"}
        </button>
        <p className="mt-3 text-xs text-gray-500">La contraseña temporal solo viaja en la solicitud autenticada y se borra del formulario tras cada intento.</p>
      </div>
    </form>
  );
}
