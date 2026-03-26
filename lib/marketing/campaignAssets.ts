import type { Campaign } from "@/lib/api";

export function rowTemplateId(t: Record<string, unknown>): string {
  return String(t.id ?? t.template_id ?? "").trim();
}

export function rowSegmentId(s: Record<string, unknown>): string {
  return String(s.id ?? s.segment_id ?? "").trim();
}

export function templateOriginLabel(t: Record<string, unknown>): string {
  if (t.source === "system" || t.is_system_template === true) return "Sistema";
  if (t.persisted === true) return "Tenant";
  return String(t.source ?? "—");
}

export function segmentOriginLabel(s: Record<string, unknown>): string {
  if (s.source === "system" || s.is_system_segment === true) return "Sistema";
  if (s.persisted === true) return "Tenant";
  if (s.source === "campaign") return "Campaña";
  return String(s.source ?? "—");
}

export function buildSegmentSnapshot(seg: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!seg) return undefined;
  const id = rowSegmentId(seg);
  if (!id) return undefined;
  return {
    id,
    name: seg.name,
    type: seg.type,
    source: seg.source,
    size: seg.size,
    criteria: seg.criteria,
  };
}

export function buildTemplateSnapshot(tpl: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!tpl) return undefined;
  const id = rowTemplateId(tpl);
  if (!id) return undefined;
  return {
    id,
    name: tpl.name,
    type: tpl.type,
    objective: tpl.objective,
    source: tpl.source,
    subject: tpl.subject,
    content: tpl.content,
  };
}

export function patchCampaignSettings(campaign: Campaign, patch: Record<string, unknown>): Campaign {
  const base =
    campaign.settings && typeof campaign.settings === "object" && !Array.isArray(campaign.settings)
      ? { ...campaign.settings }
      : {};
  return { ...campaign, settings: { ...base, ...patch } };
}
