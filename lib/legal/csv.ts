import type { AuditTrailEntry } from "@/types/legal";

export function escapeCsvField(val: unknown): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportLegalAuditCsv(tenantId: string, rows: AuditTrailEntry[]): void {
  const BOM = "\uFEFF";
  const header =
    "timestamp_utc,agent_id,status,risk_level,citations_count,latency_ms,request_id,pack_hash,input_hash";
  const body = rows
    .map((e) =>
      [
        e.timestamp,
        e.agent_id,
        e.status ?? "",
        e.monitor?.riesgo_evaluado ?? "",
        e.output_metadata?.citations_count ?? 0,
        e.latency_total_ms ?? 0,
        e.request_id,
        e.rag_metadata?.pack_hash ?? "",
        e.input_hash ?? "",
      ]
        .map(escapeCsvField)
        .join(",")
    )
    .join("\n");
  const csv = BOM + header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const now = new Date();
  const ts = now.toISOString().replace(new RegExp("[-:T.Z]", "g"), "").slice(0, 15);
  link.download = `legal_audit_${tenantId}_${ts}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
