import type { CreditApplication, CreditEvent, CreditStats } from "../types/creditCore";

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

export function normalizeApplication(raw: unknown): CreditApplication {
  const record = isRecord(raw) ? raw : {};
  const id = pickString(record, ["id", "application_id", "applicationId"], "—");
  const applicantName = pickString(record, ["applicant_name", "applicantName", "name"], "—");
  const requestedAmount = pickString(record, ["requested_amount", "requestedAmount", "amount"], "0");
  const status = pickString(record, ["status"], "unknown").toLowerCase() as CreditApplication["status"];
  const decision = pickNullableString(record, ["decision", "recommendation"]);
  const riskScore = pickNumber(record, ["risk_score", "riskScore"]);
  const score = pickNumber(record, ["score", "credit_score", "creditScore"]);
  const createdAt = pickDate(record, ["created_at", "createdAt", "created"]);
  const updatedAt = pickDate(record, ["updated_at", "updatedAt", "updated"]) || createdAt;

  return {
    id,
    application_id: id,
    tenant_id: pickNullableString(record, ["tenant_id", "tenantId"]),
    applicant_name: applicantName,
    applicant_email: pickNullableString(record, ["applicant_email", "applicantEmail", "email"]),
    applicant_phone: pickNullableString(record, ["applicant_phone", "applicantPhone", "phone"]),
    monthly_income: (record.monthly_income ?? record.monthlyIncome ?? null) as string | number | null,
    vehicle_vin: pickNullableString(record, ["vehicle_vin", "vehicleVin", "vin"]),
    vehicle_year: pickNumber(record, ["vehicle_year", "vehicleYear"]),
    vehicle_make: pickNullableString(record, ["vehicle_make", "vehicleMake", "make"]),
    vehicle_model: pickNullableString(record, ["vehicle_model", "vehicleModel", "model"]),
    vehicle_price: (record.vehicle_price ?? record.vehiclePrice ?? null) as string | number | null,
    requested_amount: requestedAmount,
    down_payment: (record.down_payment ?? record.downPayment ?? null) as string | null,
    status,
    score,
    risk_score: riskScore,
    decision: decision as CreditApplication["decision"],
    recommendation: pickNullableString(record, ["recommendation"]),
    created_at: createdAt,
    updated_at: updatedAt,
    raw,
  };
}

export function normalizeApplications(raw: unknown): CreditApplication[] {
  return pickArray(raw).map(normalizeApplication);
}

export function normalizeStats(raw: unknown): CreditStats {
  const record = isRecord(raw) ? raw : {};
  const applications = normalizeApplications(raw);
  const sourceApps = applications.length > 0 ? applications : [];
  const total = pickNumber(record, ["total_applications", "totalApplications", "total", "count"]) ?? sourceApps.length;
  const draft = pickNumber(record, ["draft_applications", "draftApplications", "drafts"]) ?? countStatus(sourceApps, ["draft"]);
  const submitted =
    pickNumber(record, ["submitted_applications", "submittedApplications", "submitted", "processed_applications", "processedApplications"]) ??
    countStatus(sourceApps, ["submitted", "processed"]);
  const processing = pickNumber(record, ["processing_applications", "processingApplications", "processing"]) ?? countStatus(sourceApps, ["processing"]);
  const approved = pickNumber(record, ["approved_applications", "approvedApplications", "approved"]) ?? countStatus(sourceApps, ["approved"]);
  const rejected =
    pickNumber(record, ["rejected_applications", "rejectedApplications", "rejected", "declined_applications", "declinedApplications"]) ??
    countStatus(sourceApps, ["rejected", "declined"]);

  return {
    total_applications: total,
    draft_applications: draft,
    submitted_applications: submitted,
    processing_applications: processing,
    approved_applications: approved,
    rejected_applications: rejected,
    applications_this_week: pickNumber(record, ["applications_this_week", "applicationsThisWeek", "this_week", "thisWeek"]) ?? 0,
    average_score: pickNumber(record, ["average_score", "averageScore", "avg_score", "avgScore"]),
    approval_rate: pickNumber(record, ["approval_rate", "approvalRate"]),
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
