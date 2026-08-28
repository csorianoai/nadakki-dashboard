import type { CreditApplication, CreditApplicationStatus, CreditDecision, CreditEvent, CreditStats } from "../types/creditCore";
import type {
  AcceptedOfferDetail,
  CreditOffer,
  OfferAcceptResult,
  OffersListResponse,
  OffersPagination,
} from "../types/offers";

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function pickString(record: AnyRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function pickNullableString(record: AnyRecord, keys: string[]): string | null {
  const value = pickString(record, keys);
  return value || null;
}

function pickNumber(record: AnyRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

function pickDate(record: AnyRecord, keys: string[]): string {
  const value = pickString(record, keys);
  return value || new Date().toISOString();
}

function pickArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!isRecord(raw)) return [];
  const candidates = [raw.applications, raw.events, raw.items, raw.results, raw.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function countStatus(applications: CreditApplication[], statuses: string[]): number {
  return applications.filter((application) => statuses.includes(application.status)).length;
}

/** Map backend state (UPPERCASE) to frontend CreditApplicationStatus. */
function mapBackendState(rawState: string): CreditApplicationStatus {
  switch (rawState.toUpperCase()) {
    case "DRAFT": return "draft";
    case "SUBMITTED":
    case "BANK_SUBMITTED":
    case "RECEIVED":  // M2: New orchestrator state
    case "AI_ANALYSIS":  // M2: New orchestrator state
    case "AI_COMPLETE":  // M2: New orchestrator state
    case "SENT_TO_BANKS":  // M2: New orchestrator state
    case "DOCUMENTS_PENDING":  // M2: New orchestrator state
      return "submitted";
    case "PROCESSING":
    case "HYBRID_IN_PROGRESS": return "processing";
    case "PROCESSED":
    case "BANK_COMPLETE":
    case "BANK_FLOW_COMPLETED":  // Bank flow finished (may be empty if no banks participated)
    case "COMPLETED": return "processed";
    case "APPROVED":
    case "APPROVED_WITH_STIPULATIONS": return "approved";
    case "REJECTED":
    case "DECLINED":
    case "FAILED":  // M2: Failed is a rejection
      return "rejected";
    case "OFFER_SELECTED": return "offered";
    case "CONDITIONED": return "conditioned";
    case "MANUAL_REVIEW": return "manual_review";
    case "READY_FOR_DISBURSEMENT":
    case "DISBURSED":
      return "processed";  // M2: Disbursement is processed/funded
    case "EXPIRED":
    case "CANCELLED":
      return "rejected";  // M2: Expired/cancelled are terminal rejections
    default:
      // Unknown state: return raw value lowercased instead of producing invalid status
      // This shows the actual backend state to developers instead of hiding it
      console.warn(`[normalizers] Unknown backend state: "${rawState}" - displaying raw value`);
      return rawState.toLowerCase() as CreditApplicationStatus;
  }
}

/** Map backend bank decision (Spanish) to frontend CreditDecision. */
function mapBankDecision(decision: string | null): CreditDecision | null {
  if (!decision) return null;
  switch (decision.toUpperCase()) {
    case "APROBADO": return "approved";
    case "RECHAZADO": return "rejected";
    case "CONTRA_OFERTA": return "conditioned";
    default: return decision.toLowerCase() as CreditDecision;
  }
}

export function normalizeApplication(raw: unknown): CreditApplication {
  const record = isRecord(raw) ? raw : {};

  // Extract nested application_payload (detail-endpoint responses)
  const payload = isRecord(record.application_payload) ? (record.application_payload as AnyRecord) : {};
  const payloadApplicant = isRecord(payload.applicant) ? (payload.applicant as AnyRecord)
    : isRecord(payload.applicant_data) ? (payload.applicant_data as AnyRecord) : {};
  const payloadFinancial = isRecord(payload.financial) ? (payload.financial as AnyRecord)
    : isRecord(payload.financial_info) ? (payload.financial_info as AnyRecord) : {};
  const payloadVehicle = isRecord(payload.vehicle) ? (payload.vehicle as AnyRecord)
    : isRecord(payload.vehicle_data) ? (payload.vehicle_data as AnyRecord) : {};
  const payloadBankDecision = isRecord(payload.bank_decision) ? (payload.bank_decision as AnyRecord) : {};

  const id = pickString(record, ["id", "application_id", "applicationId"], "—");

  // Applicant name: top-level → payload.applicant.full_name → borrower_name_masked
  const applicantName = pickString(record, ["applicant_name", "applicantName", "name"])
    || pickString(payloadApplicant, ["full_name", "nombre_completo", "name"])
    || pickString(record, ["borrower_name_masked"])
    || "—";

  // Requested amount: top-level → payload.financial.requested_amount
  const requestedAmount = pickString(record, ["requested_amount", "requestedAmount", "amount"])
    || pickString(payloadFinancial, ["requested_amount", "requestedAmount", "amount"])
    || pickString(payloadApplicant, ["monto_solicitado", "loan_amount", "loan_amount_requested"])
    || "0";

  // Status: prefer top-level "status"; fall back to "state" with backend→frontend mapping
  let status: CreditApplication["status"];
  const rawStatus = pickString(record, ["status"]);
  if (rawStatus && rawStatus !== "unknown") {
    status = rawStatus.toLowerCase() as CreditApplication["status"];
  } else {
    const rawState = pickString(record, ["state"]);
    status = rawState ? mapBackendState(rawState) : "unknown";
  }

  // Decision: top-level → payload.bank_decision.decision (mapped from Spanish)
  const topDecision = pickNullableString(record, ["decision", "recommendation"]);
  const bankDecisionStr = pickNullableString(payloadBankDecision, ["decision"]);
  const decision = topDecision || mapBankDecision(bankDecisionStr);

  // Override status based on bank_decision when state is a "processing" state
  // but the bank has already rendered a decision (APROBADO/RECHAZADO)
  if (decision && (status === "processed" || status === "processing" || status === "unknown")) {
    const hasStipulations = Array.isArray(payload.bank_decision_stipulations)
      && (payload.bank_decision_stipulations as unknown[]).length > 0;
    if (decision === "approved") {
      status = hasStipulations ? "approved_with_stipulations" as CreditApplicationStatus : "approved";
    } else if (decision === "rejected") {
      status = "rejected";
    } else if (decision === "conditioned") {
      status = "conditioned";
    }
  }

  const riskScore = pickNumber(record, ["risk_score", "riskScore"]);
  const score = pickNumber(record, ["score", "credit_score", "creditScore"]);
  const createdAt = pickDate(record, ["created_at", "createdAt", "created"]);
  const updatedAt = pickDate(record, ["updated_at", "updatedAt", "updated"]) || createdAt;

  // Vehicle: top-level → payload.vehicle
  const vehicleVin = pickNullableString(record, ["vehicle_vin", "vehicleVin", "vin"])
    || pickNullableString(payloadVehicle, ["vin"]);
  const vehicleYear = pickNumber(record, ["vehicle_year", "vehicleYear"])
    ?? pickNumber(payloadVehicle, ["year"]);
  const vehicleMake = pickNullableString(record, ["vehicle_make", "vehicleMake", "make"])
    || pickNullableString(payloadVehicle, ["make"]);
  const vehicleModel = pickNullableString(record, ["vehicle_model", "vehicleModel", "model"])
    || pickNullableString(payloadVehicle, ["model"]);

  // Applicant contact: top-level → payload.applicant
  const applicantEmail = pickNullableString(record, ["applicant_email", "applicantEmail", "email"])
    || pickNullableString(payloadApplicant, ["email"]);
  const applicantPhone = pickNullableString(record, ["applicant_phone", "applicantPhone", "phone"])
    || pickNullableString(payloadApplicant, ["phone"]);

  return {
    id,
    application_id: id,
    tenant_id: pickNullableString(record, ["tenant_id", "tenantId"]),
    applicant_name: applicantName,
    applicant_email: applicantEmail,
    applicant_phone: applicantPhone,
    monthly_income: (record.monthly_income ?? record.monthlyIncome ?? payload.monthly_income ?? null) as string | number | null,
    vehicle_vin: vehicleVin,
    vehicle_year: vehicleYear,
    vehicle_make: vehicleMake,
    vehicle_model: vehicleModel,
    vehicle_price: (record.vehicle_price ?? record.vehiclePrice ?? payloadVehicle.price ?? null) as string | number | null,
    requested_amount: requestedAmount,
    down_payment: (record.down_payment ?? record.downPayment ?? null) as string | null,
    status,
    score,
    risk_score: riskScore,
    decision: decision as CreditApplication["decision"],
    recommendation: pickNullableString(record, ["recommendation"]),
    created_at: createdAt,
    updated_at: updatedAt,
    display_status:
      pickNullableString(record, ["display_status", "displayStatus"]) ||
      pickNullableString(payload, ["display_status", "displayStatus"]),
    raw,
  };
}

export function normalizeApplications(raw: unknown): CreditApplication[] {
  return pickArray(raw).map(normalizeApplication);
}

/**
 * Sum numeric values from the backend `states` object for the given state keys.
 * e.g. stateSum(states, "DRAFT") or stateSum(states, "SUBMITTED", "BANK_SUBMITTED")
 */
function stateSum(states: AnyRecord, ...keys: string[]): number {
  let sum = 0;
  for (const k of keys) {
    const v = states[k];
    if (typeof v === "number" && Number.isFinite(v)) sum += v;
  }
  return sum;
}

export function normalizeStats(raw: unknown): CreditStats {
  const record = isRecord(raw) ? raw : {};
  const applications = normalizeApplications(raw);
  const sourceApps = applications.length > 0 ? applications : [];

  // The /stats endpoint returns a `states` object with backend state keys
  // (e.g. {DRAFT: 182, COMPLETED: 758, SUBMITTED: 5, ...}).
  // Map these to the frontend category counts.
  const states = isRecord(record.states) ? (record.states as AnyRecord) : {};

  const total = pickNumber(record, ["total_applications", "totalApplications", "total", "count"]) ?? sourceApps.length;
  const draft = pickNumber(record, ["draft_applications", "draftApplications", "drafts"])
    ?? (stateSum(states, "DRAFT") || countStatus(sourceApps, ["draft"]));
  // In-flight submitted — COMPLETED/BANK_COMPLETE are terminal, not "activas"
  const submitted = pickNumber(record, ["submitted_applications", "submittedApplications", "submitted"])
    ?? (stateSum(states, "SUBMITTED", "BANK_SUBMITTED", "RECEIVED", "AI_ANALYSIS", "AI_COMPLETE")
    || countStatus(sourceApps, ["submitted"]));
  const processing = pickNumber(record, ["processing_applications", "processingApplications", "processing"])
    ?? (stateSum(states, "PROCESSING", "HYBRID_IN_PROGRESS", "OFFER_SELECTED")
    || countStatus(sourceApps, ["processing", "offered", "counter_offer"]));
  const completed = pickNumber(record, ["completed_applications", "completedApplications", "completed"])
    ?? stateSum(states, "COMPLETED", "BANK_COMPLETE", "PROCESSED");
  const approved = pickNumber(record, ["approved_applications", "approvedApplications", "approved"])
    ?? (stateSum(states, "APPROVED", "APPROVED_WITH_STIPULATIONS", "OFFER_SELECTED")
    || countStatus(sourceApps, ["approved"]));
  const rejected = pickNumber(record, ["rejected_applications", "rejectedApplications", "rejected", "declined_applications", "declinedApplications"])
    ?? (stateSum(states, "REJECTED", "DECLINED")
    || countStatus(sourceApps, ["rejected", "declined"]));

  // approval_rate: prefer backend value, but if 0 or null and we have
  // state-derived approved/rejected counts, compute from states.
  let approvalRate = pickNumber(record, ["approval_rate", "approvalRate"]);
  if ((approvalRate === null || approvalRate === 0) && total > 0) {
    const decided = approved + rejected;
    if (decided > 0) {
      approvalRate = Math.round((approved / decided) * 10000) / 10000;
    }
  }

  return {
    total_applications: total,
    draft_applications: draft,
    submitted_applications: submitted,
    processing_applications: processing,
    approved_applications: approved,
    rejected_applications: rejected,
    completed_applications: completed,
    applications_this_week: pickNumber(record, ["applications_this_week", "applicationsThisWeek", "this_week", "thisWeek"]) ?? 0,
    average_score: pickNumber(record, ["average_score", "averageScore", "avg_score", "avgScore"]),
    approval_rate: approvalRate,
    raw,
  };
}

export function normalizeEvent(raw: unknown): CreditEvent {
  const record = isRecord(raw) ? raw : {};
  const id = pickString(record, ["id", "event_id", "eventId"], `${Date.now()}`);
  const type = pickString(record, ["type", "event_type", "eventType"], "event");
  const createdAt = pickDate(record, ["created_at", "createdAt", "timestamp", "time"]);

  return {
    id,
    application_id: pickNullableString(record, ["application_id", "applicationId"]),
    type,
    title: pickString(record, ["title", "label"], type),
    description: pickNullableString(record, ["description", "message", "detail"]),
    created_at: createdAt,
    actor: pickNullableString(record, ["actor", "created_by", "createdBy"]),
    metadata: isRecord(record.metadata) ? record.metadata : null,
    raw,
  };
}

export function normalizeEvents(raw: unknown): CreditEvent[] {
  return pickArray(raw).map(normalizeEvent);
}

/**
 * Normalize one canonical offer row (TP-005). Defensive: never assumes the
 * backend sent every field; numeric fields stay `null` when absent/invalid
 * rather than being coerced to 0 (so the UI can show an honest "—").
 *
 * The live backend sends `lender_name` (not `lender_code`), `apr_annual`
 * (not `interest_rate_apr`), and a nested `terms` object with rich fields
 * (total_cost, currency, stipulations, lender_display_name). We extract
 * from both top-level and terms.
 */
export function normalizeOffer(raw: unknown): CreditOffer {
  const record = isRecord(raw) ? raw : {};
  const terms = isRecord(record.terms) ? (record.terms as AnyRecord) : {};
  const metadata = isRecord(record.response_metadata) ? (record.response_metadata as AnyRecord) : {};
  const bankExecution = isRecord(record.bank_execution)
    ? (record.bank_execution as AnyRecord)
    : isRecord(metadata.bank_execution)
      ? (metadata.bank_execution as AnyRecord)
      : isRecord(record.vendor_payload)
        ? (record.vendor_payload as AnyRecord).bank_execution as AnyRecord
        : {};
  const id = pickString(record, ["id", "offer_id", "offerId"], "");

  // Status normalization: backend sends localized (APROBADO) — lowercase for consistent matching
  const rawStatus = pickString(record, ["status"], "pending");
  const statusMap: Record<string, string> = {
    APROBADO: "approved", RECHAZADO: "declined", CONTRA_OFERTA: "counter_offer",
    ACEPTADO: "accepted", NO_SELECCIONADO: "not_selected",
  };
  const status = statusMap[rawStatus] ?? rawStatus.toLowerCase();

  // Stipulations: array of strings from terms
  const rawStips = terms.stipulations;
  const stipulations: string[] = Array.isArray(rawStips) ? rawStips.filter((s): s is string => typeof s === "string") : [];

  return {
    id,
    application_id: pickString(record, ["application_id", "applicationId"], ""),
    tenant_id: pickNullableString(record, ["tenant_id", "tenantId"]),
    lender_code: pickString(record, ["lender_code", "lenderCode", "lender_name", "lenderName"], ""),
    lender_display_name: pickNullableString(terms, ["lender_display_name", "lenderDisplayName"])
      || pickNullableString(record, ["lender_display_name"]),
    amount_approved: pickNumber(record, ["amount_approved", "amountApproved", "approved_amount"])
      ?? pickNumber(terms, ["amount_approved", "loan_amount"]),
    interest_rate_apr: pickNumber(record, ["interest_rate_apr", "interestRateApr", "interest_rate", "apr_annual"])
      ?? pickNumber(terms, ["interest_rate_apr", "interest_rate"]),
    term_months: pickNumber(record, ["term_months", "termMonths"])
      ?? pickNumber(terms, ["term_months"]),
    monthly_payment: pickNumber(record, ["monthly_payment", "monthlyPayment"])
      ?? pickNumber(terms, ["monthly_payment"]),
    total_cost: pickNumber(record, ["total_cost", "totalCost"])
      ?? pickNumber(terms, ["total_cost"]),
    currency: pickNullableString(record, ["currency"]) || pickNullableString(terms, ["currency"]),
    stipulations,
    simulated: typeof bankExecution.simulated === "boolean"
      ? bankExecution.simulated
      : typeof record.simulated === "boolean" ? record.simulated : null,
    source_system: pickNullableString(bankExecution, ["source_system"]) || pickNullableString(record, ["source_system"]),
    adapter_operation_mode: pickNullableString(bankExecution, ["adapter_operation_mode"])
      || pickNullableString(record, ["adapter_operation_mode"]),
    status: status as CreditOffer["status"],
    created_at: pickDate(record, ["created_at", "createdAt", "created"]),
    raw,
  };
}

/** Normalize the offers list response, tolerating array or wrapped shapes. */
export function normalizeOffers(raw: unknown): OffersListResponse {
  const record = isRecord(raw) ? raw : {};
  const offersArray = Array.isArray(record.offers) ? record.offers : pickArray(raw);
  const offers = offersArray.map(normalizeOffer);
  const paginationRecord = isRecord(record.pagination) ? (record.pagination as AnyRecord) : {};
  const pagination: OffersPagination = {
    limit: pickNumber(paginationRecord, ["limit"]) ?? offers.length,
    offset: pickNumber(paginationRecord, ["offset"]) ?? 0,
    total: pickNumber(paginationRecord, ["total"]) ?? offers.length,
  };
  return {
    application_id: pickString(record, ["application_id", "applicationId"], ""),
    tenant_id: pickNullableString(record, ["tenant_id", "tenantId"]),
    offers,
    pagination,
  };
}

/** Normalize the offer-acceptance response (offer_acceptance_router). */
export function normalizeOfferAcceptResult(raw: unknown): OfferAcceptResult {
  const record = isRecord(raw) ? raw : {};
  const offerRecord = isRecord(record.offer) ? (record.offer as AnyRecord) : {};
  const offer: AcceptedOfferDetail = {
    offer_id: pickString(offerRecord, ["offer_id", "offerId", "id"], ""),
    application_id: pickString(offerRecord, ["application_id", "applicationId"], ""),
    tenant_id: pickNullableString(offerRecord, ["tenant_id", "tenantId"]),
    lender_code: pickString(offerRecord, ["lender_code", "lenderCode"], ""),
    status: pickString(offerRecord, ["status"], ""),
    terms: isRecord(offerRecord.terms) ? (offerRecord.terms as Record<string, unknown>) : {},
    accepted_at: pickNullableString(offerRecord, ["accepted_at", "acceptedAt"]),
    accepted_by: pickNullableString(offerRecord, ["accepted_by", "acceptedBy"]),
  };
  return {
    ok: record.ok === true,
    idempotent: record.idempotent === true,
    offer,
    application_state: pickNullableString(record, ["application_state", "applicationState"]),
    previous_application_state: pickNullableString(record, ["previous_application_state", "previousApplicationState"]),
    siblings_not_selected: pickNumber(record, ["siblings_not_selected", "siblingsNotSelected"]),
    raw,
  };
}
