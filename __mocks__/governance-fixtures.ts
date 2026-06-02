import type { GovernanceReport, Finding } from "@/types/governance";

export const mockFinding: Finding = {
  id: "test-finding-1",
  centinela: "seguridad",
  severity: "P0",
  title: "Raw X-Tenant-ID header trust",
  description: "Endpoint sin JWT validation",
  file_path: "routers/credit_router.py",
  line_number: 42,
  recommendation: "Reemplazar Header() con require_auth",
  blocking: true,
  evidence: {
    command: "grep header_pattern",
    output_preview: "x_tenant_id: Header(None)",
  },
  created_at: new Date().toISOString(),
};

export const mockReportPass: GovernanceReport = {
  audit_id: "test-audit-pass",
  timestamp: new Date().toISOString(),
  overall_status: "PASS",
  max_severity: "NONE",
  environment: "production",
  duration_ms: 1500,
  centinelas: [
    {
      nombre: "seguridad",
      status: "PASS",
      duration_ms: 400,
      findings_count: 0,
      max_severity: "NONE",
      error_message: null,
    },
    {
      nombre: "oauth",
      status: "PASS",
      duration_ms: 200,
      findings_count: 0,
      max_severity: "NONE",
      error_message: null,
    },
    {
      nombre: "workflows",
      status: "PASS",
      duration_ms: 300,
      findings_count: 0,
      max_severity: "NONE",
      error_message: null,
    },
    {
      nombre: "mocks",
      status: "PASS",
      duration_ms: 600,
      findings_count: 0,
      max_severity: "NONE",
      error_message: null,
    },
  ],
  findings: [],
  summary: { total: 0, p0: 0, p1: 0, p2: 0, p3: 0 },
};

export const mockReportFailWithP0: GovernanceReport = {
  audit_id: "test-audit-fail",
  timestamp: new Date().toISOString(),
  overall_status: "FAIL",
  max_severity: "P0",
  environment: "production",
  duration_ms: 1500,
  centinelas: [
    {
      nombre: "seguridad",
      status: "FAIL",
      duration_ms: 400,
      findings_count: 1,
      max_severity: "P0",
      error_message: null,
    },
    {
      nombre: "oauth",
      status: "PASS",
      duration_ms: 200,
      findings_count: 0,
      max_severity: "NONE",
      error_message: null,
    },
    {
      nombre: "workflows",
      status: "PASS",
      duration_ms: 300,
      findings_count: 0,
      max_severity: "NONE",
      error_message: null,
    },
    {
      nombre: "mocks",
      status: "PASS",
      duration_ms: 600,
      findings_count: 0,
      max_severity: "NONE",
      error_message: null,
    },
  ],
  findings: [mockFinding],
  summary: { total: 1, p0: 1, p1: 0, p2: 0, p3: 0 },
};
