import type { Campaign, CampaignStatus } from "@/lib/api";

/** Blocks save when core marketing wiring is missing (segment + template). */
export function validateMarketingCampaignForSave(c: Campaign): string | null {
  if (!c.name.trim()) return "El nombre es obligatorio.";
  const segId =
    String(c.audience_id ?? "").trim() ||
    (typeof c.settings?.segment_id === "string" ? c.settings.segment_id.trim() : "");
  const tplId = typeof c.settings?.template_id === "string" ? c.settings.template_id.trim() : "";
  if (!segId) return "Seleccione un segmento.";
  if (!tplId) return "Seleccione una plantilla.";
  return null;
}

const STATUSES: CampaignStatus[] = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "completed",
  "archived",
];

/** Dashboard Campaign → backend CampaignUpdate (campaigns_v2). */
export function buildMarketingCampaignUpdatePayload(campaign: Campaign): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: campaign.name,
    description: campaign.description ?? "",
    subject: campaign.subject ?? "",
    status: STATUSES.includes(campaign.status) ? campaign.status : "draft",
  };

  const bodyText = campaign.content != null ? String(campaign.content).trim() : "";
  if (bodyText !== "") {
    payload.content = { body: bodyText };
  }

  if (campaign.settings && Object.keys(campaign.settings).length > 0) {
    payload.settings = { ...campaign.settings };
  }

  const aud =
    campaign.audience_id ??
    (typeof campaign.settings?.segment_id === "string" ? campaign.settings.segment_id : undefined);
  if (aud) {
    payload.audience_id = aud;
  }

  return payload;
}
