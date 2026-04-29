import { render, screen } from "@testing-library/react";
import { AuditTrailCard } from "@/components/legal/AuditTrailCard";
import type { TrazabilidadAuditoria } from "@/lib/legal-api";

describe("AuditTrailCard", () => {
  it("renders cadena and hash preview", () => {
    const t: TrazabilidadAuditoria = {
      cadena_agentes: ["a", "b"],
      tenant_id: "t1",
      timestamp: "2026-01-01T00:00:00Z",
      knowledge_pack_id: "pk",
      knowledge_pack_version: "2",
      knowledge_pack_hash: "abcdef0123456789abcdef0123456789",
      knowledge_pack_verified: false,
    };
    render(<AuditTrailCard trazabilidad={t} />);
    expect(screen.getByText(/a → b/)).toBeInTheDocument();
    expect(screen.getByText(/abcdef0123456789abcdef01/)).toBeInTheDocument();
  });
});
