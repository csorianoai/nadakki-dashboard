import { render, screen } from "@testing-library/react";
import { normalizeQueueItem, openReviewItems } from "@/lib/legal/validation-queue-api";
import { legalResultLabel } from "@/lib/legal/legal-agent-labels";
import { RecentActivityList } from "@/components/legal/RecentActivityList";
import type { AuditTrailEntry } from "@/types/legal";

const item = (o: Record<string, unknown>) =>
  normalizeQueueItem({ queue_item_id: "q", case_id: "c", priority: "normal", status: "pending", ...o })!;

describe("cola de validación", () => {
  it("cuenta solo lo que espera revisión", () => {
    const items = [
      item({ queue_item_id: "1", status: "pending" }),
      item({ queue_item_id: "2", status: "assigned" }),
      item({ queue_item_id: "3", status: "in_review" }),
      item({ queue_item_id: "4", status: "approved" }),
      item({ queue_item_id: "5", status: "rejected" }),
      item({ queue_item_id: "6", status: "expired" }),
    ];
    expect(openReviewItems(items).map((i) => i.queue_item_id)).toEqual(["1", "2", "3"]);
  });

  it("pone primero lo vencido, luego crítica y alta", () => {
    const items = [
      item({ queue_item_id: "normal", priority: "normal" }),
      item({ queue_item_id: "alta", priority: "high" }),
      item({ queue_item_id: "critica", priority: "critical" }),
      item({ queue_item_id: "vencida", priority: "low", sla_breached: true }),
    ];
    expect(openReviewItems(items).map((i) => i.queue_item_id)).toEqual(["vencida", "critica", "alta", "normal"]);
  });

  it("descarta filas sin id o sin expediente y acepta sla_breached 1/true", () => {
    expect(normalizeQueueItem({ case_id: "c" })).toBeNull();
    expect(normalizeQueueItem({ queue_item_id: "q" })).toBeNull();
    expect(item({ sla_breached: 1 }).sla_breached).toBe(true);
    expect(item({ sla_breached: false }).sla_breached).toBe(false);
  });
});

describe("actividad reciente legible", () => {
  it("traduce agent_id conocidos y limpia los desconocidos", () => {
    expect(legalResultLabel("generador_plantillas")).toBe("Documento generado desde plantilla");
    expect(legalResultLabel("nuevo_agente_x")).toBe("Nuevo agente x");
    expect(legalResultLabel("")).toBe("Resultado de IA");
  });

  it("no muestra hashes ni ids internos", () => {
    const e: AuditTrailEntry = {
      request_id: "8f3a9c2e-1111-2222-3333-444455556666",
      timestamp: new Date().toISOString(),
      tenant_id: "t",
      agent_id: "analizador_contratos",
      output_metadata: { citations_count: 3, riesgo_legal: "high" },
      status: "success",
    };
    render(<RecentActivityList entries={[e]} loading={false} />);
    expect(screen.getByText("Análisis de contrato")).toBeInTheDocument();
    expect(screen.getByText("3 citas · requiere revisión de abogado")).toBeInTheDocument();
    expect(screen.queryByText(/8f3a9c2e/)).toBeNull();
    expect(screen.queryByText(/analizador_contratos/)).toBeNull();
  });
});
