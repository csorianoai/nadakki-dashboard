import type {
  DealerTier,
  EntryStrategy,
  EntryStrategyInstitution,
  EntryStrategyTier,
  Finding,
  FindingDataPoint,
  PipelineStep,
  PricingPlan,
  PricingProposal,
  SnapshotPayload,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseDataPoint(raw: unknown): FindingDataPoint | null {
  const o = isRecord(raw) ? raw : null;
  if (!o) return null;
  const metric = asString(o.metric);
  const value = asNumber(o.value);
  const unit = asString(o.unit);
  if (!metric || value === undefined || !unit) return null;
  const year = asNumber(o.year);
  return year !== undefined ? { metric, value, unit, year } : { metric, value, unit };
}

function parseInstitution(raw: unknown): EntryStrategyInstitution | null {
  const o = isRecord(raw) ? raw : null;
  if (!o) return null;
  const name = asString(o.name);
  const portfolio_rd = asNumber(o.portfolio_rd);
  const participation_pct = asNumber(o.participation_pct);
  if (!name || portfolio_rd === undefined || participation_pct === undefined) return null;
  const source = asString(o.source) || undefined;
  const tier = asString(o.tier) || undefined;
  return { name, portfolio_rd, participation_pct, source, tier };
}

function parseInstitutionTier(raw: unknown): EntryStrategyTier | null {
  const o = isRecord(raw) ? raw : null;
  if (!o) return null;
  const tier = asString(o.tier);
  const rationale = asString(o.rationale);
  if (!tier) return null;
  const names = Array.isArray(o.names)
    ? o.names.map(parseInstitution).filter((n): n is EntryStrategyInstitution => n !== null)
    : [];
  return { tier, rationale, names };
}

function parsePlan(raw: unknown): PricingPlan | null {
  const o = isRecord(raw) ? raw : null;
  if (!o) return null;
  const name = asString(o.name);
  if (!name) return null;
  const plan: PricingPlan = { name };
  const setup_fee = asNumber(o.setup_fee);
  const per_application_fee = asNumber(o.per_application_fee);
  const monthly_min = asNumber(o.monthly_min);
  if (setup_fee !== undefined) plan.setup_fee = setup_fee;
  if (per_application_fee !== undefined) plan.per_application_fee = per_application_fee;
  if (monthly_min !== undefined) plan.monthly_min = monthly_min;
  const target = asString(o.target);
  if (target) plan.target = target;
  if (Array.isArray(o.features)) {
    plan.features = o.features.filter((f): f is string => typeof f === "string");
  }
  return plan;
}

function parseDealerTier(raw: unknown): DealerTier | null {
  const o = isRecord(raw) ? raw : null;
  if (!o) return null;
  const tier = asString(o.tier);
  if (!tier) return null;
  const dealer: DealerTier = { tier };
  const label = asString(o.label);
  const discount_pct = asNumber(o.discount_pct);
  const min_apps_month = asNumber(o.min_apps_month);
  const monthly_fee = asNumber(o.monthly_fee);
  if (label) dealer.label = label;
  if (discount_pct !== undefined) dealer.discount_pct = discount_pct;
  if (min_apps_month !== undefined) dealer.min_apps_month = min_apps_month;
  if (monthly_fee !== undefined) dealer.monthly_fee = monthly_fee;
  if (Array.isArray(o.features)) {
    dealer.features = o.features.filter((f): f is string => typeof f === "string");
  }
  return dealer;
}

function parsePipelineStep(raw: unknown): PipelineStep | null {
  const o = isRecord(raw) ? raw : null;
  if (!o) return null;
  const agent = asString(o.agent);
  const label = asString(o.label);
  const status = asString(o.status);
  const duration_s = asNumber(o.duration_s);
  if (!agent || !label || duration_s === undefined) return null;
  const step: PipelineStep = { agent, label, status: status || "done", duration_s };
  const sources = asNumber(o.sources);
  const findings = asNumber(o.findings);
  if (sources !== undefined) step.sources = sources;
  if (findings !== undefined) step.findings = findings;
  return step;
}

export function parseEntryStrategy(raw: Record<string, unknown> | undefined): EntryStrategy | undefined {
  if (!raw) return undefined;

  const target_segment = asString(raw.target_segment);
  const angle = asString(raw.angle);
  const sales_arguments = Array.isArray(raw.sales_arguments)
    ? raw.sales_arguments.filter((a): a is string => typeof a === "string")
    : [];
  const institution_tiers = Array.isArray(raw.institution_tiers)
    ? raw.institution_tiers
        .map(parseInstitutionTier)
        .filter((t): t is EntryStrategyTier => t !== null)
    : [];

  if (!target_segment && !angle && !sales_arguments.length && !institution_tiers.length) {
    return undefined;
  }

  return { target_segment, angle, sales_arguments, institution_tiers };
}

export function parsePricingProposal(raw: Record<string, unknown> | PricingProposal | undefined): PricingProposal | undefined {
  if (!raw || !isRecord(raw)) return undefined;

  const currency = asString(raw.currency) || undefined;
  const fx_to_usd = asNumber(raw.fx_to_usd);
  const plans = Array.isArray(raw.plans)
    ? raw.plans.map(parsePlan).filter((p): p is PricingPlan => p !== null)
    : [];
  const dealer_tiers = Array.isArray(raw.dealer_tiers)
    ? raw.dealer_tiers.map(parseDealerTier).filter((d): d is DealerTier => d !== null)
    : [];

  if (!currency && fx_to_usd === undefined && !plans.length && !dealer_tiers.length) {
    return undefined;
  }

  const proposal: PricingProposal = {};
  if (currency) proposal.currency = currency;
  if (fx_to_usd !== undefined) proposal.fx_to_usd = fx_to_usd;
  if (plans.length) proposal.plans = plans;
  if (dealer_tiers.length) proposal.dealer_tiers = dealer_tiers;
  if (typeof raw.tier === "string") proposal.tier = raw.tier;
  if (typeof raw.validation_status === "string") proposal.validation_status = raw.validation_status;
  if (typeof raw.requires_counsel_review === "boolean") {
    proposal.requires_counsel_review = raw.requires_counsel_review;
  }
  return proposal;
}

export function getPipelineFromSnapshot(snapshot: SnapshotPayload): PipelineStep[] {
  const metaPipeline = snapshot.metadata?.pipeline;
  if (Array.isArray(metaPipeline)) {
    return metaPipeline
      .map(parsePipelineStep)
      .filter((s): s is PipelineStep => s !== null);
  }
  return [];
}

export function findingKey(f: Finding, index: number): string {
  if (f.id) return f.id;
  return `finding-${f.source_name}-${f.category}-${index}`;
}

export function normalizeFindingDataPoints(raw: unknown[]): FindingDataPoint[] {
  return raw.map(parseDataPoint).filter((dp): dp is FindingDataPoint => dp !== null);
}
