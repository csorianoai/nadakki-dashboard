"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  Play,
  X,
  Mail,
  MessageSquare,
  Bell,
  Smartphone,
  Image,
  Calendar,
  Users,
  Target,
  FileText,
  Loader2,
  Tag,
  Clock,
  Zap,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import {
  fetchMarketingTemplates,
  fetchMarketingSegments,
  createMarketingCampaign,
  activateMarketingCampaign,
  postMarketingLaunchPilot,
} from "@/lib/api/marketing";
import {
  rowTemplateId,
  rowSegmentId,
  templateOriginLabel,
  segmentOriginLabel,
  buildSegmentSnapshot,
  buildTemplateSnapshot,
} from "@/lib/marketing/campaignAssets";
import {
  WIZARD_TITLE,
  GOOGLE_ADS_HREF,
  ZERO_AUDIENCE_NOTICE,
  OBJECTIVE_LABELS,
  SCHEDULE_LABELS,
  CONVERSION_LABELS,
  objectiveLabel,
  segmentTypeLabel,
  channelLabel,
  templateDisplayName,
  fillPreviewExample,
} from "@/lib/marketing/campaignWizardCopy";

const STEPS = [
  { id: 1, name: "Redactar", label: "Redactar el mensaje", icon: FileText },
  { id: 2, name: "Programar", label: "Programar el envío", icon: Calendar },
  { id: 3, name: "Público", label: "Elegir el público", icon: Users },
  { id: 4, name: "Resultados", label: "Medir resultados", icon: Target },
  { id: 5, name: "Revisar", label: "Revisar y enviar", icon: Check },
];

const CAMPAIGN_TYPES: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  email: { icon: Mail, color: "#3b82f6", label: "Correo" },
  sms: { icon: MessageSquare, color: "#22c55e", label: "SMS" },
  push: { icon: Bell, color: "#f59e0b", label: "Notificación push" },
  "in-app": { icon: Smartphone, color: "#8b5cf6", label: "Mensaje en la app" },
  banner: { icon: Image, color: "#ec4899", label: "Banner" },
  whatsapp: { icon: MessageSquare, color: "#25D366", label: "WhatsApp" },
};

const OBJECTIVES = [
  { id: "convert", label: OBJECTIVE_LABELS.convert },
  { id: "engage", label: OBJECTIVE_LABELS.engage },
  { id: "retain", label: OBJECTIVE_LABELS.retain },
  { id: "awareness", label: OBJECTIVE_LABELS.awareness },
];

const CONVERSION_EVENTS = [
  { id: "purchase", name: CONVERSION_LABELS.purchase, icon: "💰" },
  { id: "signup", name: CONVERSION_LABELS.signup, icon: "✅" },
  { id: "upgrade", name: CONVERSION_LABELS.upgrade, icon: "⬆️" },
  { id: "referral", name: CONVERSION_LABELS.referral, icon: "👥" },
  { id: "review", name: CONVERSION_LABELS.review, icon: "⭐" },
];

function formatApiError(detail: unknown): string {
  if (detail == null) return "No se pudo completar la solicitud";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (typeof d === "object" && d && "msg" in d ? String((d as { msg: unknown }).msg) : String(d)))
      .join("; ");
  }
  if (typeof detail === "object" && detail !== null && "error" in detail) {
    return String((detail as { error: unknown }).error);
  }
  return JSON.stringify(detail);
}

function CampaignWizardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tenantId } = useTenant();
  const campaignType = searchParams.get("type") || "email";

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Record<string, unknown>[]>([]);
  const [segments, setSegments] = useState<Record<string, unknown>[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const [marketingObjective, setMarketingObjective] = useState("convert");
  const [pilotLoading, setPilotLoading] = useState(false);
  const [pilotMessage, setPilotMessage] = useState<string | null>(null);

  const [campaign, setCampaign] = useState({
    name: "",
    description: "",
    type: campaignType,
    tags: [] as string[],
    selectedTemplate: "",
    selectedSegmentId: "",
    scheduleType: "immediate" as "immediate" | "scheduled" | "action-based" | "recurring",
    scheduledDate: "",
    scheduledTime: "",
    timezone: "America/New_York",
    recurringFrequency: "daily",
    conversionEvents: [] as string[],
    conversionWindow: 7,
  });

  const typeConfig = CAMPAIGN_TYPES[campaign.type] || CAMPAIGN_TYPES.email;
  const TypeIcon = typeConfig.icon;

  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!tenantId) {
      setAssetsLoading(false);
      return;
    }
    (async () => {
      setAssetsLoading(true);
      setAssetsError(null);
      const [t, s] = await Promise.all([
        fetchMarketingTemplates(tenantId),
        fetchMarketingSegments(tenantId),
      ]);
      if (!alive) return;
      setTemplates(t.templates);
      setSegments(s.segments);
      const parts = [t.error, s.error].filter(Boolean);
      setAssetsError(parts.length ? parts.join(" ") : null);
      setAssetsLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [tenantId]);

  useEffect(() => {
    setCampaign((prev) => (prev.type === campaignType ? prev : { ...prev, type: campaignType }));
  }, [campaignType]);

  const selectedTemplateRow = useMemo(
    () => templates.find((x) => rowTemplateId(x) === campaign.selectedTemplate),
    [templates, campaign.selectedTemplate]
  );

  const selectedSegmentRow = useMemo(
    () => segments.find((x) => rowSegmentId(x) === campaign.selectedSegmentId),
    [segments, campaign.selectedSegmentId]
  );

  const updateCampaign = (field: string, value: unknown) => {
    setCampaign((prev) => ({ ...prev, [field]: value }));
  };

  const setChannelType = (type: string) => {
    setCampaign((prev) => ({ ...prev, type }));
    const q = new URLSearchParams(searchParams.toString());
    q.set("type", type);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  const addTag = () => {
    if (newTag && !campaign.tags.includes(newTag)) {
      updateCampaign("tags", [...campaign.tags, newTag]);
      setNewTag("");
      setShowTagInput(false);
    }
  };

  const removeTag = (tag: string) => {
    updateCampaign(
      "tags",
      campaign.tags.filter((t) => t !== tag)
    );
  };

  const toggleConversion = (eventId: string) => {
    const current = campaign.conversionEvents;
    if (current.includes(eventId)) {
      updateCampaign(
        "conversionEvents",
        current.filter((e) => e !== eventId)
      );
    } else {
      updateCampaign("conversionEvents", [...current, eventId]);
    }
  };

  const buildSchedule = (): Record<string, unknown> | undefined => {
    if (campaign.scheduleType !== "scheduled" || !campaign.scheduledDate) return undefined;
    return {
      type: "scheduled",
      date: campaign.scheduledDate,
      time: campaign.scheduledTime || "09:00",
      timezone: campaign.timezone,
    };
  };

  function validateForSave(): string | null {
    if (!tenantId) return "Elige una cuenta antes de guardar.";
    if (assetsError) return "Resuelve los errores de plantillas y segmentos antes de guardar.";
    if (!campaign.name.trim()) return "Escribe un nombre para la campaña.";
    if (!marketingObjective.trim()) return "Elige un objetivo.";
    if (!campaign.type) return "Elige un canal.";
    if (!campaign.selectedTemplate) return "Elige una plantilla de mensaje.";
    if (!campaign.selectedSegmentId) return "Elige un segmento de público.";
    return null;
  }

  function buildCreatePayload(): Record<string, unknown> {
    const seg = segments.find((s) => rowSegmentId(s) === campaign.selectedSegmentId);
    const tpl = templates.find((t) => rowTemplateId(t) === campaign.selectedTemplate);
    const segmentId = seg ? rowSegmentId(seg) : "";
    const templateId = tpl ? rowTemplateId(tpl) : "";
    const segment_snapshot = buildSegmentSnapshot(seg);
    const template_snapshot = buildTemplateSnapshot(tpl);
    return {
      name: campaign.name.trim(),
      objective: marketingObjective,
      channel: campaign.type,
      segment_id: segmentId,
      template_id: templateId,
      segment_snapshot,
      template_snapshot,
      description: campaign.description || "",
      schedule: buildSchedule(),
    };
  }

  const saveDraft = async () => {
    const v = validateForSave();
    if (v) {
      setFormError(v);
      return;
    }
    if (!tenantId) return;
    setFormError(null);
    setSaving(true);
    const res = await createMarketingCampaign(tenantId, buildCreatePayload());
    setSaving(false);
    if (!res.ok) {
      setFormError(formatApiError(res.error));
      return;
    }
    const id = res.data?.id != null ? String(res.data.id) : null;
    if (id) {
      setCreatedCampaignId(id);
      router.push(`/marketing/campaigns/${id}`);
    } else {
      setFormError("La campaña se creó pero no se recibió su identificador.");
    }
  };

  const launchCampaign = async () => {
    const v = validateForSave();
    if (v) {
      setFormError(v);
      return;
    }
    if (!tenantId) return;
    setFormError(null);
    setSaving(true);
    let id = createdCampaignId;
    if (!id) {
      const res = await createMarketingCampaign(tenantId, buildCreatePayload());
      if (!res.ok) {
        setFormError(formatApiError(res.error));
        setSaving(false);
        return;
      }
      id = res.data?.id != null ? String(res.data.id) : null;
      if (id) setCreatedCampaignId(id);
    }
    if (!id) {
      setFormError("No se pudo crear la campaña.");
      setSaving(false);
      return;
    }
    const act = await activateMarketingCampaign(tenantId, id);
    if (!act.ok) {
      setFormError(act.error || "No se pudo activar la campaña.");
      setSaving(false);
      return;
    }
    setSaving(false);
    router.push(`/marketing/campaigns/${id}`);
  };

  const runPilotDryRun = async () => {
    if (!tenantId) return;
    const v = validateForSave();
    if (v) {
      setFormError(v);
      return;
    }
    setFormError(null);
    setPilotMessage(null);
    setPilotLoading(true);
    let id = createdCampaignId;
    if (!id) {
      const res = await createMarketingCampaign(tenantId, buildCreatePayload());
      if (!res.ok) {
        setPilotMessage(res.error ? formatApiError(res.error) : "No se pudo crear la campaña para la prueba piloto.");
        setPilotLoading(false);
        return;
      }
      id = res.data?.id != null ? String(res.data.id) : null;
      if (id) setCreatedCampaignId(id);
    }
    if (!id) {
      setPilotMessage("No se encontró la campaña para la prueba piloto.");
      setPilotLoading(false);
      return;
    }
    const audience =
      selectedSegmentRow && typeof selectedSegmentRow.name === "string"
        ? selectedSegmentRow.name
        : String(selectedSegmentRow?.name ?? campaign.name);
    const pilotBody: Record<string, unknown> = {
      product_name: campaign.name || "Campaña",
      target_audience: audience,
      dry_run: true,
      campaign_id: id,
    };
    const r = await postMarketingLaunchPilot(tenantId, pilotBody);
    setPilotLoading(false);
    if (!r.ok) {
      setPilotMessage(r.error || "La prueba piloto falló.");
      return;
    }
    const ok = r.data?.success === true;
    const linked = r.data?.marketing_campaign_id;
    setPilotMessage(
      ok
        ? `Prueba piloto completada, sin enviar nada.${linked ? ` Campaña enlazada: ${String(linked)}.` : ""}`
        : "La prueba piloto terminó sin éxito."
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return campaign.name.length > 0 && !!campaign.selectedTemplate && !!marketingObjective;
      case 2:
        return campaign.scheduleType === "immediate" || !!campaign.scheduledDate;
      case 3:
        return !!campaign.selectedSegmentId;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  };

  const getEstimatedReach = () => {
    const sz = selectedSegmentRow?.size;
    if (typeof sz === "number" && !Number.isNaN(sz)) return sz;
    return 0;
  };

  const previewSubjectFill = fillPreviewExample(
    selectedTemplateRow && typeof selectedTemplateRow.subject === "string" ? selectedTemplateRow.subject : ""
  );
  const previewBodyFill = fillPreviewExample(
    selectedTemplateRow && typeof selectedTemplateRow.content === "string" ? selectedTemplateRow.content : ""
  );
  const previewSubject = previewSubjectFill.text;
  const previewBody = previewBodyFill.text;
  const previewIsExample = previewSubjectFill.example || previewBodyFill.example;
  const reach = getEstimatedReach();
  const zeroAudience = !!campaign.selectedSegmentId && reach === 0;
  const zeroNotice = (
    <div data-testid="aviso-audiencia-cero" className="mt-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm text-amber-200">
      {ZERO_AUDIENCE_NOTICE}. Si la envías ahora, no llegará a nadie: elige otro segmento o carga contactos primero.
    </div>
  );

  return (
    <div className="min-h-screen shrink-0 bg-[#0a0f1c]">
      <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between bg-[#0d1117]">
        <div className="flex items-center gap-4">
          <Link href="/marketing/campaigns" className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: typeConfig.color + "20" }}>
              <TypeIcon className="w-5 h-5" style={{ color: typeConfig.color }} />
            </div>
            <div>
              <input
                type="text"
                value={campaign.name}
                onChange={(e) => updateCampaign("name", e.target.value)}
                placeholder="Nombre de la campaña"
                className="text-lg font-bold bg-transparent border-none text-white focus:outline-none w-64"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{typeConfig.label}</span>
                {campaign?.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs flex items-center gap-1"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="w-2 h-2" />
                    </button>
                  </span>
                ))}
                {showTagInput ? (
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                    onBlur={() => {
                      addTag();
                      setShowTagInput(false);
                    }}
                    placeholder="Etiqueta"
                    autoFocus
                    className="px-2 py-0.5 bg-white/10 rounded text-xs text-white w-20 focus:outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTagInput(true)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400"
                  >
                    <Tag className="w-3 h-3" /> Etiquetas
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={saveDraft}
            disabled={saving || assetsLoading || !!assetsError}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar borrador
          </button>
        </div>
      </div>

      {(formError || assetsError) && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-sm text-red-300">
          {formError || assetsError}
        </div>
      )}

      <div className="border-b border-white/10 bg-[#0d1117] px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white m-0">{WIZARD_TITLE}</h1>
          <p className="text-sm text-gray-400 mt-1 mb-0">
            Para enviar correos y mensajes a tus contactos. Para anunciar en Google usa{" "}
            <Link href={GOOGLE_ADS_HREF} className="text-purple-400 underline">
              Publicidad &gt; Google Ads
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="border-b border-white/10 bg-[#0d1117]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS?.map((step, i) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex flex-col items-center gap-2 ${isCurrent ? "opacity-100" : "hover:opacity-80"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted ? "bg-green-500" : isCurrent ? "bg-purple-500" : "bg-white/10"}`}
                    >
                      {isCompleted ? <Check className="w-5 h-5 text-white" /> : <span className="text-white font-bold">{step.id}</span>}
                    </div>
                    <span className={`text-sm font-medium ${isCurrent ? "text-white" : "text-gray-400"}`}>{step.label}</span>
                  </button>
                  {i < STEPS.length - 1 && <div className={`w-24 h-0.5 mx-4 ${isCompleted ? "bg-green-500" : "bg-white/10"}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <GlassCard className="p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Datos de la campaña</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Nombre de la campaña</label>
                    <input
                      type="text"
                      value={campaign.name}
                      onChange={(e) => updateCampaign("name", e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                      placeholder="Por ejemplo: Serie de bienvenida"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Objetivo</label>
                    <select
                      value={marketingObjective}
                      onChange={(e) => setMarketingObjective(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                    >
                      {OBJECTIVES.map((o) => (
                        <option key={o.id} value={o.id} className="bg-[#0d1117]">
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Canal</label>
                    <select
                      value={campaign.type}
                      onChange={(e) => setChannelType(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                    >
                      {Object.entries(CAMPAIGN_TYPES).map(([key, cfg]) => (
                        <option key={key} value={key} className="bg-[#0d1117]">
                          {cfg.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1 m-0">Por dónde le llegará el mensaje a cada contacto.</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Descripción (opcional)</label>
                    <textarea
                      value={campaign.description}
                      onChange={(e) => updateCampaign("description", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                      placeholder="Notas internas"
                    />
                  </div>
                </div>
              </GlassCard>
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Plantilla</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Elige el mensaje que van a recibir tus contactos. Cada plantilla indica si es del sistema o tuya.
                </p>
                {assetsLoading ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" /> Cargando plantillas…
                  </div>
                ) : (
                  <div className="flex gap-6">
                    <div className="w-64 max-h-[420px] overflow-y-auto space-y-2">
                      {templates.length === 0 ? (
                        <p className="text-gray-400 text-sm">No hay plantillas disponibles.</p>
                      ) : (
                        templates.map((t) => {
                          const tid = rowTemplateId(t);
                          if (!tid) return null;
                          return (
                            <button
                              type="button"
                              key={tid}
                              onClick={() => updateCampaign("selectedTemplate", tid)}
                              className={`w-full p-3 text-left rounded-lg border ${campaign.selectedTemplate === tid ? "border-purple-500 bg-purple-500/10" : "border-white/10 hover:border-white/20"}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm text-white font-medium">{templateDisplayName(t, tid)}</span>
                                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/10 text-gray-400 shrink-0">
                                  {templateOriginLabel(t)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {channelLabel(t.type)} · {objectiveLabel(t.objective)}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div data-testid="vista-previa" className="w-72 min-h-[360px] bg-gray-900 rounded-3xl border-4 border-gray-700 p-2">
                        <div className="w-full h-full bg-white rounded-2xl p-4 text-left overflow-y-auto">
                          <TypeIcon className="w-10 h-10 text-purple-500 mb-3" />
                          <h3 className="text-base font-bold text-gray-800 mb-2">Vista previa</h3>
                          {previewIsExample ? (
                            <p className="text-[11px] text-amber-700 mb-2 m-0">Ejemplo: los datos de cada contacto se completan al enviar.</p>
                          ) : null}
                          {previewSubject ? (
                            <p className="text-xs font-semibold text-gray-700 mb-2">{previewSubject}</p>
                          ) : null}
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {previewBody || "Elige una plantilla para ver el asunto y el mensaje."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-6">Programar el envío</h2>
                <div className="space-y-4">
                  {[
                    { id: "immediate", label: SCHEDULE_LABELS.immediate, desc: "Se envía en cuanto confirmes", icon: Zap },
                    { id: "scheduled", label: SCHEDULE_LABELS.scheduled, desc: "Elige el día y la hora", icon: Calendar },
                    { id: "action-based", label: SCHEDULE_LABELS["action-based"], desc: "Se envía cuando el contacto hace algo", icon: Target },
                    { id: "recurring", label: SCHEDULE_LABELS.recurring, desc: "Se repite según un calendario", icon: Clock },
                  ].map((o) => (
                    <button
                      type="button"
                      key={o.id}
                      onClick={() => updateCampaign("scheduleType", o.id)}
                      className={`w-full p-4 text-left rounded-xl border flex items-start gap-4 ${campaign.scheduleType === o.id ? "border-purple-500 bg-purple-500/10" : "border-white/10 hover:border-white/20"}`}
                    >
                      <div className={`p-3 rounded-lg ${campaign.scheduleType === o.id ? "bg-purple-500" : "bg-white/10"}`}>
                        <o.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{o.label}</div>
                        <div className="text-sm text-gray-400">{o.desc}</div>
                      </div>
                      <div
                        className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${campaign.scheduleType === o.id ? "border-purple-500 bg-purple-500" : "border-white/20"}`}
                      >
                        {campaign.scheduleType === o.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
                {campaign.scheduleType === "scheduled" && (
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Fecha</label>
                      <input
                        type="date"
                        value={campaign.scheduledDate}
                        onChange={(e) => updateCampaign("scheduledDate", e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Hora</label>
                      <input
                        type="time"
                        value={campaign.scheduledTime}
                        onChange={(e) => updateCampaign("scheduledTime", e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                      />
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-2">Elegir el público</h2>
                <p className="text-gray-400 mb-2">Un segmento es el grupo de contactos que recibirá la campaña.</p>
                <p className="text-gray-400 text-sm mb-6 m-0">Elige un segmento tuyo o uno del sistema.</p>
                {assetsLoading ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" /> Cargando segmentos…
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {segments.length === 0 ? (
                      <p className="text-gray-400 text-sm col-span-2">No hay segmentos disponibles.</p>
                    ) : (
                      segments.map((s) => {
                        const sid = rowSegmentId(s);
                        if (!sid) return null;
                        const selected = campaign.selectedSegmentId === sid;
                        const size = typeof s.size === "number" ? s.size : 0;
                        return (
                          <button
                            type="button"
                            key={sid}
                            onClick={() => updateCampaign("selectedSegmentId", sid)}
                            className={`p-4 text-left rounded-xl border ${selected ? "border-purple-500 bg-purple-500/10" : "border-white/10 hover:border-white/20"}`}
                          >
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <span className="text-white font-medium">{String(s.name ?? sid)}</span>
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selected ? "border-purple-500 bg-purple-500" : "border-white/20"}`}
                              >
                                {selected && <Check className="w-3 h-3 text-white" />}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-2">
                              <span className="uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/10 text-gray-400">
                                {segmentOriginLabel(s)}
                              </span>
                              <span>{segmentTypeLabel(s.type)}</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{size.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">{size === 1 ? "contacto" : "contactos"}</div>
                            {size === 0 ? <div className="text-xs text-amber-300 mt-1">{ZERO_AUDIENCE_NOTICE}</div> : null}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
                {campaign.selectedSegmentId ? (
                  <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between">
                    <span className="text-gray-400">Personas a las que llegará</span>
                    <span className="text-2xl font-bold text-white">{reach.toLocaleString()}</span>
                  </div>
                ) : null}
                {zeroAudience ? zeroNotice : null}
              </GlassCard>
            </motion.div>
          )}
          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-2">Medir resultados</h2>
                <p className="text-gray-400 mb-6">Elige qué acciones quieres contar después de la campaña (opcional).</p>
                <div className="space-y-3">
                  {CONVERSION_EVENTS?.map((e) => (
                    <button
                      type="button"
                      key={e.id}
                      onClick={() => toggleConversion(e.id)}
                      className={`w-full p-4 text-left rounded-xl border flex items-center gap-4 ${campaign.conversionEvents.includes(e.id) ? "border-green-500 bg-green-500/10" : "border-white/10 hover:border-white/20"}`}
                    >
                      <span className="text-2xl">{e.icon}</span>
                      <span className="text-white font-medium flex-1">{e.name}</span>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${campaign.conversionEvents.includes(e.id) ? "border-green-500 bg-green-500" : "border-white/20"}`}
                      >
                        {campaign.conversionEvents.includes(e.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <label className="text-sm text-gray-400 block mb-2">Plazo para contar resultados</label>
                  <select
                    value={campaign.conversionWindow}
                    onChange={(e) => updateCampaign("conversionWindow", parseInt(e.target.value, 10))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                  >
                    <option value={1}>1 día</option>
                    <option value={3}>3 días</option>
                    <option value={7}>7 días</option>
                    <option value={14}>14 días</option>
                    <option value={30}>30 días</option>
                  </select>
                </div>
              </GlassCard>
            </motion.div>
          )}
          {currentStep === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <GlassCard className="p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-6">Revisar la campaña</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Nombre</div>
                      <div className="text-white font-medium">{campaign.name || "Sin nombre"}</div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-purple-400 text-sm">
                      Editar
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Objetivo</div>
                      <div className="text-white font-medium">{objectiveLabel(marketingObjective)}</div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-purple-400 text-sm">
                      Editar
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Canal</div>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-5 h-5" style={{ color: typeConfig.color }} />
                        <span className="text-white">{typeConfig.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Plantilla</div>
                      <div className="text-white">{selectedTemplateRow ? templateDisplayName(selectedTemplateRow, "—") : "—"}</div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-purple-400 text-sm">
                      Editar
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Segmento</div>
                      <div className="text-white">{selectedSegmentRow ? String(selectedSegmentRow.name) : "—"}</div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(3)} className="text-purple-400 text-sm">
                      Editar
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Envío</div>
                      <div className="text-white">{SCHEDULE_LABELS[campaign.scheduleType]}</div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(2)} className="text-purple-400 text-sm">
                      Editar
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Personas a las que llegará</div>
                      <div className="text-2xl font-bold text-purple-400">{reach.toLocaleString()}</div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(3)} className="text-purple-400 text-sm">
                      Editar
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Resultados a medir</div>
                      <div className="text-white">
                        {campaign.conversionEvents.length} acciones · {campaign.conversionWindow} días
                      </div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(4)} className="text-purple-400 text-sm">
                      Editar
                    </button>
                  </div>
                </div>
              </GlassCard>
              {zeroAudience ? <div className="max-w-xl mx-auto mb-4">{zeroNotice}</div> : null}
              {pilotMessage ? <p className="text-center text-sm text-gray-400 mb-4">{pilotMessage}</p> : null}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  type="button"
                  onClick={launchCampaign}
                  disabled={saving || assetsLoading || !!assetsError}
                  className="flex items-center gap-2 px-8 py-4 bg-green-700 hover:bg-green-800 rounded-xl text-white font-bold text-lg disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}{" "}
                  {saving ? "Procesando…" : `Enviar campaña a ${reach.toLocaleString()} ${reach === 1 ? "persona" : "personas"}`}
                </button>
                <button
                  type="button"
                  onClick={runPilotDryRun}
                  disabled={pilotLoading || !tenantId || !!assetsError}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm disabled:opacity-50"
                >
                  {pilotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Prueba piloto en Meta (sin enviar)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Margen para que el botón flotante del copiloto no tape "Siguiente" ni el pie del asistente. */}
      <div data-testid="margen-copiloto" aria-hidden="true" className="h-24" />

      <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-white/10 bg-[#0d1117] pl-4 pr-24 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-6">
          {STEPS?.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setCurrentStep(s.id)}
              className={`flex items-center gap-2 ${currentStep === s.id ? "text-white" : "text-gray-400"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep > s.id ? "bg-green-500 text-white" : currentStep === s.id ? "bg-purple-500 text-white" : "bg-white/10"}`}
              >
                {currentStep > s.id ? <Check className="w-3 h-3" /> : s.id}
              </div>
              <span className="text-sm hidden md:block">{s.name}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium disabled:opacity-50"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving || assetsLoading || !!assetsError}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium disabled:opacity-50"
            >
              Guardar borrador
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      }
    >
      <CampaignWizardContent />
    </Suspense>
  );
}
