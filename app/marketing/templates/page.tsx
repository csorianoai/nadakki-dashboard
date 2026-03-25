"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Brain,
  ChevronRight,
  Home,
  RefreshCw,
  Wand2,
  X,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import type { FetchSource } from "@/lib/api/client";
import { normalizeMarketingTemplates } from "@/lib/api/marketing";
import { MARKETING_ENDPOINTS } from "@/lib/api/endpoints";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";

const OBJECTIVES = [
  { value: "convert", label: "Convertir" },
  { value: "recover", label: "Recuperar carrito" },
  { value: "reactivate", label: "Reactivar" },
  { value: "onboard", label: "Onboarding" },
  { value: "promo", label: "Promo / oferta" },
] as const;

const CHANNELS = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

type TemplateRow = Record<string, unknown>;

function sourceBadgeClass(src: string): string {
  const map: Record<string, string> = {
    system: "bg-slate-500/25 text-slate-200",
    manual: "bg-sky-500/25 text-sky-200",
    imported: "bg-amber-500/25 text-amber-200",
    "ai-generated": "bg-violet-500/25 text-violet-200",
  };
  return map[src] ?? "bg-white/10 text-gray-300";
}

export default function TemplatesPage() {
  const { tenantId } = useTenant();
  const [data, setData] = useState<unknown>({});
  const [source, setSource] = useState<FetchSource>("fallback");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  /** Ephemeral rows when IA genera con persist=false */
  const [sessionExtras, setSessionExtras] = useState<TemplateRow[]>([]);
  const [generateSubmitting, setGenerateSubmitting] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [persistAfterGenerate, setPersistAfterGenerate] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [formObjective, setFormObjective] = useState<string>("convert");
  const [formChannel, setFormChannel] = useState<string>("email");
  const [formKeyMessage, setFormKeyMessage] = useState("");
  const [formAudience, setFormAudience] = useState("");
  const [formTone, setFormTone] = useState("profesional cercano");
  const [formCompany, setFormCompany] = useState("");
  const [formOffer, setFormOffer] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("email");
  const [editObjective, setEditObjective] = useState("convert");
  const [editChannel, setEditChannel] = useState("email");
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCta, setEditCta] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!tenantId?.trim()) {
        setLoading(false);
        setSource("fallback");
        setError(null);
        setData({});
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(MARKETING_ENDPOINTS.TEMPLATES, {
          method: "GET",
          signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Tenant-ID": tenantId.trim(),
          },
        });
        if (res.status === 429) {
          setSource("fallback");
          setError("HTTP 429");
          setData({});
          return;
        }
        if (!res.ok) {
          setSource("fallback");
          setError(`HTTP ${res.status}`);
          setData({});
          return;
        }
        const json = (await res.json().catch(() => null)) as unknown;
        setData(json ?? {});
        setSource("live");
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        setSource("fallback");
        setError((e as Error)?.message ?? String(e));
        setData({});
      } finally {
        setLoading(false);
      }
    },
    [tenantId]
  );

  useEffect(() => {
    if (!tenantId?.trim()) {
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [tenantId, refreshKey, load]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const { templates } = normalizeMarketingTemplates(source === "live" ? data : {});

  const displayList = useMemo(
    () => [...sessionExtras, ...templates] as TemplateRow[],
    [sessionExtras, templates]
  );

  const openAiModal = useCallback(() => {
    setGenerateError(null);
    setAiModalOpen(true);
  }, []);

  const closeAiModal = useCallback(() => {
    if (generateSubmitting) return;
    setAiModalOpen(false);
    setGenerateError(null);
  }, [generateSubmitting]);

  const submitGenerate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!tenantId?.trim()) {
        setGenerateError("Selecciona un tenant para generar.");
        return;
      }
      if (!formKeyMessage.trim()) {
        setGenerateError("El mensaje clave es obligatorio.");
        return;
      }
      setGenerateSubmitting(true);
      setGenerateError(null);
      try {
        const res = await fetch(MARKETING_ENDPOINTS.TEMPLATES_GENERATE, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Tenant-ID": tenantId.trim(),
          },
          body: JSON.stringify({
            objective: formObjective,
            channel: formChannel,
            key_message: formKeyMessage.trim(),
            audience: formAudience.trim(),
            tone: formTone.trim(),
            company_name: formCompany.trim(),
            offer: formOffer.trim() || undefined,
            tenant_id: tenantId.trim(),
            persist: persistAfterGenerate,
          }),
        });
        const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        if (!res.ok) {
          const detail =
            typeof json?.detail === "string"
              ? json.detail
              : `Error HTTP ${res.status}`;
          setGenerateError(detail);
          return;
        }
        const tpl = json?.template;
        if (!tpl || typeof tpl !== "object") {
          setGenerateError("Respuesta inválida del servidor.");
          return;
        }
        const persisted = json?.persisted === true;
        if (persisted) {
          refresh();
          setSessionExtras([]);
        } else {
          setSessionExtras((prev) => [tpl as TemplateRow, ...prev]);
        }
        setAiModalOpen(false);
        setToast(persisted ? "Plantilla generada y guardada" : "Plantilla generada (solo esta sesión)");
        window.setTimeout(() => setToast(null), 4000);
      } catch (err) {
        setGenerateError((err as Error)?.message ?? String(err));
      } finally {
        setGenerateSubmitting(false);
      }
    },
    [
      tenantId,
      formObjective,
      formChannel,
      formKeyMessage,
      formAudience,
      formTone,
      formCompany,
      formOffer,
      persistAfterGenerate,
      refresh,
    ]
  );

  const openEdit = useCallback((row: TemplateRow) => {
    const id = String(row.id ?? "");
    if (!id || row.editable !== true) return;
    setEditId(id);
    setEditName(String(row.name ?? ""));
    setEditType(String(row.type ?? "email"));
    setEditObjective(String(row.objective ?? "convert"));
    setEditChannel(String(row.channel ?? row.type ?? "email"));
    setEditSubject(String(row.subject ?? ""));
    setEditContent(String(row.content ?? ""));
    setEditDescription(String(row.description ?? ""));
    setEditCta(String(row.cta_text ?? ""));
    setEditError(null);
    setEditOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    if (editSubmitting) return;
    setEditOpen(false);
    setEditId(null);
    setEditError(null);
  }, [editSubmitting]);

  const submitEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!tenantId?.trim() || !editId) return;
      setEditSubmitting(true);
      setEditError(null);
      try {
        const res = await fetch(MARKETING_ENDPOINTS.TEMPLATE_BY_ID(editId), {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Tenant-ID": tenantId.trim(),
          },
          body: JSON.stringify({
            name: editName.trim(),
            type: editType.trim(),
            objective: editObjective.trim(),
            channel: editChannel.trim(),
            subject: editSubject,
            content: editContent,
            description: editDescription,
            cta_text: editCta,
          }),
        });
        const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        if (!res.ok) {
          setEditError(typeof json?.detail === "string" ? json.detail : `HTTP ${res.status}`);
          return;
        }
        setEditOpen(false);
        setEditId(null);
        refresh();
        setToast("Plantilla actualizada");
        window.setTimeout(() => setToast(null), 3000);
      } catch (err) {
        setEditError((err as Error)?.message ?? String(err));
      } finally {
        setEditSubmitting(false);
      }
    },
    [
      tenantId,
      editId,
      editName,
      editType,
      editObjective,
      editChannel,
      editSubject,
      editContent,
      editDescription,
      editCta,
      refresh,
    ]
  );

  const confirmDelete = useCallback(async () => {
    if (!tenantId?.trim() || !deleteTargetId) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const res = await fetch(MARKETING_ENDPOINTS.TEMPLATE_BY_ID(deleteTargetId), {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "X-Tenant-ID": tenantId.trim(),
        },
      });
      const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (!res.ok) {
        setDeleteError(typeof json?.detail === "string" ? json.detail : `HTTP ${res.status}`);
        return;
      }
      setDeleteTargetId(null);
      refresh();
      setToast("Plantilla eliminada");
      window.setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setDeleteError((err as Error)?.message ?? String(err));
    } finally {
      setDeleteSubmitting(false);
    }
  }, [tenantId, deleteTargetId, refresh]);

  const displayTotal = displayList.length;

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">
      {toast ? (
        <div
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-emerald-500/40 bg-emerald-950/90 px-4 py-2 text-sm text-emerald-100 shadow-lg"
          role="status"
        >
          {toast}
        </div>
      ) : null}

      {deleteTargetId ? (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white m-0">¿Eliminar plantilla?</h3>
            <p className="text-sm text-gray-400 mt-2 m-0">
              Esta acción no se puede deshacer. Solo aplica a plantillas de tu tenant.
            </p>
            {deleteError ? (
              <p className="text-sm text-red-300 mt-3 m-0">{deleteError}</p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => {
                  setDeleteTargetId(null);
                  setDeleteError(null);
                }}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-200 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => void confirmDelete()}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleteSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-xl">
            <button
              type="button"
              onClick={closeEdit}
              className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-white/10"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-white pr-10 m-0">Editar plantilla</h2>
            <form onSubmit={submitEdit} className="mt-4 space-y-3">
              <input
                value={editName}
                onChange={(ev) => setEditName(ev.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                placeholder="Nombre"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={editType}
                  onChange={(ev) => setEditType(ev.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  placeholder="Tipo (email…)"
                />
                <input
                  value={editChannel}
                  onChange={(ev) => setEditChannel(ev.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  placeholder="Canal"
                />
              </div>
              <input
                value={editObjective}
                onChange={(ev) => setEditObjective(ev.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                placeholder="Objetivo"
              />
              <input
                value={editSubject}
                onChange={(ev) => setEditSubject(ev.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                placeholder="Asunto"
              />
              <textarea
                value={editContent}
                onChange={(ev) => setEditContent(ev.target.value)}
                rows={5}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                placeholder="Contenido"
              />
              <textarea
                value={editDescription}
                onChange={(ev) => setEditDescription(ev.target.value)}
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                placeholder="Descripción"
              />
              <input
                value={editCta}
                onChange={(ev) => setEditCta(ev.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                placeholder="CTA"
              />
              {editError ? <p className="text-sm text-red-300 m-0">{editError}</p> : null}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeEdit} className="rounded-lg border border-white/15 px-4 py-2 text-sm">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {editSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {aiModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-template-title"
        >
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-xl">
            <button
              type="button"
              onClick={closeAiModal}
              className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 id="ai-template-title" className="text-lg font-semibold text-white pr-10">
              Generar plantilla con IA
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              <code className="text-xs text-violet-300">{MARKETING_ENDPOINTS.TEMPLATES_GENERATE}</code>
            </p>

            <form onSubmit={submitGenerate} className="mt-6 space-y-4">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={persistAfterGenerate}
                  onChange={(ev) => setPersistAfterGenerate(ev.target.checked)}
                  className="rounded border-white/20"
                />
                Guardar en base de datos del tenant
              </label>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Objetivo</label>
                <select
                  value={formObjective}
                  onChange={(ev) => setFormObjective(ev.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  {OBJECTIVES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Canal</label>
                <select
                  value={formChannel}
                  onChange={(ev) => setFormChannel(ev.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  {CHANNELS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Mensaje clave *</label>
                <textarea
                  required
                  rows={3}
                  value={formKeyMessage}
                  onChange={(ev) => setFormKeyMessage(ev.target.value)}
                  placeholder="Ej. Preaprobación disponible en minutos"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Audiencia</label>
                <input
                  type="text"
                  value={formAudience}
                  onChange={(ev) => setFormAudience(ev.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Tono</label>
                <input
                  type="text"
                  value={formTone}
                  onChange={(ev) => setFormTone(ev.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Empresa / marca</label>
                <input
                  type="text"
                  value={formCompany}
                  onChange={(ev) => setFormCompany(ev.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Oferta / CTA (opcional)</label>
                <input
                  type="text"
                  value={formOffer}
                  onChange={(ev) => setFormOffer(ev.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
              </div>

              {generateError ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {generateError}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAiModal}
                  disabled={generateSubmitting}
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-200 hover:bg-white/5 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={generateSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  {generateSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando…
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Generar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f1c]/95 backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
            <Link href="/" className="inline-flex items-center gap-1 hover:text-gray-300">
              <Home className="w-4 h-4" />
              Inicio
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/marketing" className="hover:text-gray-300">
              Marketing
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-violet-400 font-medium">Templates</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/marketing"
                className="p-2 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 m-0">
                  <Brain className="w-7 h-7 text-violet-400" />
                  Plantillas
                </h1>
                <p className="text-sm text-gray-400 m-0 mt-1 flex flex-wrap items-center gap-2">
                  <DataSourceBadge source={source} error={error} />
                  {loading ? (
                    <span>Cargando…</span>
                  ) : (
                    <span>
                      {displayTotal} mostradas ·{" "}
                      <code className="text-xs text-gray-500">{MARKETING_ENDPOINTS.TEMPLATES}</code>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => refresh()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-sm text-gray-200 hover:bg-white/15"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
              <button
                type="button"
                onClick={openAiModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-sm font-medium text-white hover:bg-violet-500"
              >
                <Wand2 className="w-4 h-4" />
                Generar con IA
              </button>
              <Link
                href="/marketing/templates/create"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-sm text-gray-300 hover:bg-white/5"
              >
                Crear manual
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {error && source === "fallback" && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            No se pudo cargar el API ({error}). Sin datos mock locales.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24 text-gray-500 text-sm">Cargando plantillas…</div>
        ) : displayList.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-16 text-center">
            <p className="text-gray-300 text-lg m-0">No hay plantillas todavía</p>
            <p className="text-gray-500 text-sm mt-2 m-0">
              Las plantillas base aparecen aquí cuando el API responde. Crea una manual o genera con IA.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={openAiModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-500"
              >
                <Wand2 className="w-4 h-4" />
                Generar con IA
              </button>
              <Link
                href="/marketing/templates/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-sm text-gray-200 hover:bg-white/5"
              >
                Crear manual
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {displayList.map((t, i) => {
              const id = String(t.id ?? t.template_id ?? i);
              const name = String(t.name ?? t.title ?? "Sin nombre");
              const desc = String(t.description ?? t.preview ?? "");
              const subject = t.subject != null ? String(t.subject) : "";
              const src = t.source != null ? String(t.source) : "";
              const canEdit = t.editable === true;
              const canDelete = t.deletable === true;
              const persisted = t.persisted === true;
              return (
                <li
                  key={`${id}-${i}`}
                  className={`rounded-xl border p-4 transition-colors ${
                    src === "ai-generated"
                      ? "border-violet-500/40 bg-violet-950/15"
                      : src === "system"
                        ? "border-slate-500/30 bg-slate-950/20"
                        : "border-white/10 bg-white/5 hover:border-violet-500/40"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-white">{name}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${sourceBadgeClass(src)}`}
                        >
                          {src || "—"}
                        </span>
                        {persisted ? (
                          <span className="text-[10px] uppercase text-emerald-400/90">persistido</span>
                        ) : null}
                      </div>
                      {subject ? (
                        <p className="text-xs text-violet-300/90 mt-1 m-0 font-medium line-clamp-2">{subject}</p>
                      ) : null}
                      {desc ? (
                        <p className="text-sm text-gray-400 mt-1 m-0 line-clamp-3">{desc}</p>
                      ) : null}
                      {typeof t.content === "string" && t.content.trim() ? (
                        <pre className="mt-2 max-h-32 overflow-auto rounded-lg border border-white/5 bg-black/30 p-3 text-left text-xs text-gray-300 whitespace-pre-wrap m-0">
                          {t.content}
                        </pre>
                      ) : null}
                    </div>
                    {(canEdit || canDelete) && (
                      <div className="flex shrink-0 gap-1">
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => openEdit(t)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTargetId(id);
                            }}
                            className="rounded-lg p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-200"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
