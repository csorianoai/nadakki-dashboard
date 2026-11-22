import { render, screen } from "@testing-library/react";
import { ActiveCasesPanel } from "@/components/legal/home/ActiveCasesPanel";
import type { LegalCase } from "@/lib/legal/cases/case-types";

function matter(id: string, title: string, state: LegalCase["state"], updated_at: string): LegalCase {
  return {
    case_id: id, title, state, updated_at, case_number_internal: id,
    priority: "normal",
  } as LegalCase;
}

describe("Mi despacho — expedientes recientes", () => {
  it("usa expedientes de la API, excluye cerrados/archivados y respeta el enlace existente", () => {
    render(<ActiveCasesPanel
      loading={false}
      error={false}
      cases={[
        matter("abierto", "Cobro de pesos QA", "ACTIVE", "2026-11-22T10:00:00Z"),
        matter("cerrado", "Caso cerrado", "CLOSED", "2026-11-22T12:00:00Z"),
        matter("archivado", "Caso archivado", "ARCHIVED", "2026-11-22T12:00:00Z"),
      ]}
    />);
    expect(screen.getByText("Cobro de pesos QA")).toBeInTheDocument();
    expect(screen.queryByText("Caso cerrado")).toBeNull();
    expect(screen.queryByText("Caso archivado")).toBeNull();
    expect(screen.getByRole("link", { name: "Abrir" })).toHaveAttribute("href", "/legal/cases/abierto");
  });

  it("no presenta cero ni inventa asuntos ante fallo de API", () => {
    render(<ActiveCasesPanel loading={false} error cases={[]} />);
    expect(screen.getByText("No se pudieron cargar los expedientes.")).toBeInTheDocument();
    expect(screen.queryByText("No hay expedientes activos disponibles.")).toBeNull();
  });
});
