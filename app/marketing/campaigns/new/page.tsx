"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

const STEPS = [
  { id: 1, name: "Compose", label: "Compose Messages", icon: FileText },
  { id: 2, name: "Schedule", label: "Schedule Delivery", icon: Calendar },
  { id: 3, name: "Target", label: "Target Audiences", icon: Users },
  { id: 4, name: "Assign", label: "Assign Conversions", icon: Target },
  { id: 5, name: "Review", label: "Review Summary", icon: Check },
];

const CAMPAIGN_TYPES: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  email: { icon: Mail, color: "#3b82f6", label: "Email" },
  sms: { icon: MessageSquare, color: "#22c55e", label: "SMS" },
  push: { icon: Bell, color: "#f59e0b", label: "Push Notification" },
  "in-app": { icon: Smartphone, color: "#8b5cf6", label: "In-App Message" },
  banner: { icon: Image, color: "#ec4899", label: "Banner" },
  whatsapp: { icon: MessageSquare, color: "#25D366", label: "WhatsApp" },
};

const OBJECTIVES = [
  { id: "convert", label: "Convert" },
  { id: "engage", label: "Engage" },
  { id: "retain", label: "Retain" },
  { id: "awareness", label: "Awareness" },
];

const CONVERSION_EVENTS = [
  { id: "purchase", name: "Made a Purchase", icon: "💰" },
  { id: "signup", name: "Completed Signup", icon: "✅" },
  { id: "upgrade", name: "Upgraded Plan", icon: "⬆️" },
  { id: "referral", name: "Referred a Friend", icon: "👥" },
  { id: "review", name: "Left a Review", icon: "⭐" },
];

function formatApiError(detail: unknown): string {
  if (detail == null) return "Request failed";
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
  const searchParams = useSearchParams();
  const { tenantId } = useTenant();
  const campaignType = searchParams.get("type") || "email";
  const typeConfig = CAMPAIGN_TYPES[campaignType] || CAMPAIGN_TYPES.email;
  const TypeIcon = typeConfig.icon;

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

  const selectedTemplateRow = useMemo(
    () => templates.find((x) => String(x.id) === campaign.selectedTemplate),
    [templates, campaign.selectedTemplate]
  );

  const selectedSegmentRow = useMemo(
    () => segments.find((x) => String(x.id) === campaign.selectedSegmentId),
    [segments, campaign.selectedSegmentId]
  );

  const updateCampaign = (field: string, value: unknown) => {
    setCampaign((prev) => ({ ...prev, [field]: value }));
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

  const buildSchedule(): Record<string, unknown> | undefined {
    if (campaign.scheduleType !== "scheduled" || !campaign.scheduledDate) return undefined;
    return {
      type: "scheduled",
      date: campaign.scheduledDate,
      time: campaign.scheduledTime || "09:00",
      timezone: campaign.timezone,
    };
  }

  function validateForSave(): string | null {
    if (!tenantId) return "Select a tenant before saving.";
    if (!campaign.name.trim()) return "Campaign name is required.";
    if (!marketingObjective.trim()) return "Objective is required.";
    if (!campaign.type) return "Channel is required.";
    if (!campaign.selectedTemplate) return "Select a message template.";
    if (!campaign.selectedSegmentId) return "Select an audience segment.";
    return null;
  }

  function buildCreatePayload(): Record<string, unknown> {
    const seg = segments.find((s) => String(s.id) === campaign.selectedSegmentId);
    const tpl = templates.find((t) => String(t.id) === campaign.selectedTemplate);
    const segment_snapshot = seg
      ? {
          id: seg.id,
          name: seg.name,
          type: seg.type,
          source: seg.source,
          size: seg.size,
          criteria: seg.criteria,
        }
      : undefined;
    const template_snapshot = tpl
      ? {
          id: tpl.id,
          name: tpl.name,
          type: tpl.type,
          objective: tpl.objective,
          source: tpl.source,
          subject: tpl.subject,
          content: tpl.content,
        }
      : undefined;
    return {
      name: campaign.name.trim(),
      objective: marketingObjective,
      channel: campaign.type,
      segment_id: String(seg?.id ?? ""),
      template_id: String(tpl?.id ?? ""),
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
      setFormError("Campaign created but response had no id.");
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
      setFormError("Could not create campaign.");
      setSaving(false);
      return;
    }
    const act = await activateMarketingCampaign(tenantId, id);
    if (!act.ok) {
      setFormError(act.error || "Could not activate campaign.");
      setSaving(false);
      return;
    }
    setSaving(false);
    router.push(`/marketing/campaigns/${id}`);
  };

  const runPilotDryRun = async () => {
    if (!tenantId) return;
    setPilotMessage(null);
    setPilotLoading(true);
    const audience =
      selectedSegmentRow && typeof selectedSegmentRow.name === "string"
        ? selectedSegmentRow.name
        : String(selectedSegmentRow?.name ?? campaign.name);
    const r = await postMarketingLaunchPilot(tenantId, {
      product_name: campaign.name || "Campaign",
      target_audience: audience,
      dry_run: true,
    });
    setPilotLoading(false);
    if (!r.ok) {
      setPilotMessage(r.error || "Pilot request failed.");
      return;
    }
    const ok = r.data?.success === true;
    setPilotMessage(
      ok
        ? "Pilot dry run completed. Check steps_summary in logs or command center."
        : `Pilot finished with success=${String(r.data?.success)}`
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

  const previewSubject =
    selectedTemplateRow && typeof selectedTemplateRow.subject === "string"
      ? selectedTemplateRow.subject
      : "";
  const previewBody =
    selectedTemplateRow && typeof selectedTemplateRow.content === "string"
      ? selectedTemplateRow.content
      : "";

  return (
    <div className="min-h-screen bg-[#0a0f1c]">
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
                placeholder="Campaign Name"
                className="text-lg font-bold bg-transparent border-none text-white focus:outline-none w-64"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{typeConfig.label}</span>
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
                    placeholder="Tag"
                    autoFocus
                    className="px-2 py-0.5 bg-white/10 rounded text-xs text-white w-20 focus:outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTagInput(true)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-400"
                  >
                    <Tag className="w-3 h-3" /> Tags
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
            disabled={saving || assetsLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save as Draft
          </button>
        </div>
      </div>

      {(formError || assetsError) && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-sm text-red-300">
          {formError || assetsError}
        </div>
      )}

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
                    className={`flex flex-col items-center gap-2 ${isCurrent ? "opacity-100" : "opacity-60 hover:opacity-80"}`}
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
                <h2 className="text-xl font-bold text-white mb-2">Campaign Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Campaign Name</label>
                    <input
                      type="text"
                      value={campaign.name}
                      onChange={(e) => updateCampaign("name", e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                      placeholder="e.g., Welcome Series"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Objective</label>
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
                    <label className="text-sm text-gray-400 block mb-2">Description (optional)</label>
                    <textarea
                      value={campaign.description}
                      onChange={(e) => updateCampaign("description", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                      placeholder="Internal notes"
                    />
                  </div>
                </div>
              </GlassCard>
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Template</h2>
                <p className="text-sm text-gray-400 mb-4">Load persisted and system templates for this tenant (same-origin API).</p>
                {assetsLoading ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading templates…
                  </div>
                ) : (
                  <div className="flex gap-6">
                    <div className="w-64 max-h-[420px] overflow-y-auto space-y-2">
                      {templates.length === 0 ? (
                        <p className="text-gray-500 text-sm">No templates returned.</p>
                      ) : (
                        templates.map((t) => {
                          const tid = String(t.id ?? "");
                          return (
                            <button
                              type="button"
                              key={tid}
                              onClick={() => updateCampaign("selectedTemplate", tid)}
                              className={`w-full p-3 text-left rounded-lg border ${campaign.selectedTemplate === tid ? "border-purple-500 bg-purple-500/10" : "border-white/10 hover:border-white/20"}`}
                            >
                              <div className="text-sm text-white font-medium">{String(t.name ?? tid)}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {String(t.type ?? "")} · {String(t.objective ?? "")} · {String(t.source ?? "")}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="w-72 min-h-[360px] bg-gray-900 rounded-3xl border-4 border-gray-700 p-2">
                        <div className="w-full h-full bg-white rounded-2xl p-4 text-left overflow-y-auto">
                          <TypeIcon className="w-10 h-10 text-purple-500 mb-3" />
                          <h3 className="text-base font-bold text-gray-800 mb-2">Preview</h3>
                          {previewSubject ? (
                            <p className="text-xs font-semibold text-gray-700 mb-2">{previewSubject}</p>
                          ) : null}
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {previewBody || "Select a template to preview subject and body."}
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
                <h2 className="text-xl font-bold text-white mb-6">Schedule Delivery</h2>
                <div className="space-y-4">
                  {[
                    { id: "immediate", label: "Send Immediately", desc: "Send as soon as launched", icon: Zap },
                    { id: "scheduled", label: "Schedule for Later", desc: "Choose date and time", icon: Calendar },
                    { id: "action-based", label: "Action-Based", desc: "Trigger on user action", icon: Target },
                    { id: "recurring", label: "Recurring", desc: "Send on schedule", icon: Clock },
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
                      <label className="text-sm text-gray-400 block mb-2">Date</label>
                      <input
                        type="date"
                        value={campaign.scheduledDate}
                        onChange={(e) => updateCampaign("scheduledDate", e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Time</label>
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
                <h2 className="text-xl font-bold text-white mb-2">Target Audiences</h2>
                <p className="text-gray-400 mb-6">Select one persisted or system segment</p>
                {assetsLoading ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading segments…
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {segments.length === 0 ? (
                      <p className="text-gray-500 text-sm col-span-2">No segments returned.</p>
                    ) : (
                      segments.map((s) => {
                        const sid = String(s.id ?? "");
                        const selected = campaign.selectedSegmentId === sid;
                        const size = typeof s.size === "number" ? s.size : 0;
                        return (
                          <button
                            type="button"
                            key={sid}
                            onClick={() => updateCampaign("selectedSegmentId", sid)}
                            className={`p-4 text-left rounded-xl border ${selected ? "border-purple-500 bg-purple-500/10" : "border-white/10 hover:border-white/20"}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">{String(s.name ?? sid)}</span>
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selected ? "border-purple-500 bg-purple-500" : "border-white/20"}`}
                              >
                                {selected && <Check className="w-3 h-3 text-white" />}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              {String(s.type ?? "")} · {String(s.source ?? "")}
                            </div>
                            <div className="text-2xl font-bold text-white">{size.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">audience size</div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
                {campaign.selectedSegmentId ? (
                  <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between">
                    <span className="text-gray-400">Estimated Reach</span>
                    <span className="text-2xl font-bold text-white">{getEstimatedReach().toLocaleString()}</span>
                  </div>
                ) : null}
              </GlassCard>
            </motion.div>
          )}
          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-2">Assign Conversion Events</h2>
                <p className="text-gray-400 mb-6">Track actions after campaign (optional)</p>
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
                  <label className="text-sm text-gray-400 block mb-2">Conversion Window</label>
                  <select
                    value={campaign.conversionWindow}
                    onChange={(e) => updateCampaign("conversionWindow", parseInt(e.target.value, 10))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>
              </GlassCard>
            </motion.div>
          )}
          {currentStep === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <GlassCard className="p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-6">Review Campaign</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Name</div>
                      <div className="text-white font-medium">{campaign.name || "Untitled"}</div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-purple-400 text-sm">
                      Edit
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Objective</div>
                      <div className="text-white font-medium">{marketingObjective}</div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-purple-400 text-sm">
                      Edit
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Type</div>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-5 h-5" style={{ color: typeConfig.color }} />
                        <span className="text-white">{typeConfig.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Template</div>
                      <div className="text-white">{selectedTemplateRow ? String(selectedTemplateRow.name) : "—"}</div>
                      <div className="text-xs text-gray-500">{campaign.selectedTemplate}</div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-purple-400 text-sm">
                      Edit
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Segment</div>
                      <div className="text-white">{selectedSegmentRow ? String(selectedSegmentRow.name) : "—"}</div>
                      <div className="text-xs text-gray-500">{campaign.selectedSegmentId}</div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(3)} className="text-purple-400 text-sm">
                      Edit
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Schedule</div>
                      <div className="text-white capitalize">{campaign.scheduleType.replace("-", " ")}</div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(2)} className="text-purple-400 text-sm">
                      Edit
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Reach</div>
                      <div className="text-2xl font-bold text-purple-400">{getEstimatedReach().toLocaleString()}</div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(3)} className="text-purple-400 text-sm">
                      Edit
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Conversions</div>
                      <div className="text-white">
                        {campaign.conversionEvents.length} events · {campaign.conversionWindow} days
                      </div>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(4)} className="text-purple-400 text-sm">
                      Edit
                    </button>
                  </div>
                </div>
              </GlassCard>
              {pilotMessage ? <p className="text-center text-sm text-gray-400 mb-4">{pilotMessage}</p> : null}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  type="button"
                  onClick={launchCampaign}
                  disabled={saving || assetsLoading}
                  className="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-bold text-lg disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}{" "}
                  {saving ? "Working…" : "Launch Campaign"}
                </button>
                <button
                  type="button"
                  onClick={runPilotDryRun}
                  disabled={pilotLoading || !tenantId}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm disabled:opacity-50"
                >
                  {pilotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Meta pilot (dry run)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-white/10 bg-[#0d1117] px-4 flex items-center justify-between">
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
              className={`flex items-center gap-2 ${currentStep === s.id ? "text-white" : "text-gray-500"}`}
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
              className="flex items-center gap-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium disabled:opacity-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving || assetsLoading}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium disabled:opacity-50"
            >
              Save Draft
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
