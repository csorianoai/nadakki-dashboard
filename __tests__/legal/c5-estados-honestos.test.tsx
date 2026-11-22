import React from "react";
import { render, screen } from "@testing-library/react";
import { CaseStrategyMultiSelect } from "@/components/legal/cases/CaseStrategyMultiSelect";
import LegalLibraryClient from "@/components/legal/LegalLibraryClient";
import { ResearchDictamenView } from "@/components/legal/research/papel-blanco/ResearchDictamenView";
import LegalResearchClient from "@/components/legal/LegalResearchClient";
import { MATERIAS, COVERAGE_BADGE } from "@/lib/legal/cases/matter-catalog";

jest.mock("@/hooks/useLegalCore", () => ({ useLegalEffectiveTenantId: () => ({
  effectiveTenantId: "tenant-uuid-no-visible", tenantHydrated: true,
}) }));
jest.mock("@/hooks/useLegal", () => ({
  useLegalEffectiveTenantId: () => ({ effectiveTenantId: "tenant-uuid-no-visible", tenantHydrated: true }),
  useLegalAgentRun: () => ({ run: jest.fn() }),
  useKnowledgePackInfo: () => ({ info: {} }),
}));
jest.mock("@/lib/legal/telemetry", () => ({ trackEvent: jest.fn() }));
jest.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(), usePathname: () => "/legal/research" }));
jest.mock("@/components/legal/research/papel-blanco/ResearchMarkdown", () => ({
  ResearchMarkdown: ({ content }: { content: string }) => <p>{content}</p>,
  ResearchMarkdownList: () => null,
  extractListItems: () => null,
}));
let mockStatus: Record<string, unknown> = { documents: 0, chunks: 0, note: "Requires SUPABASE_DATABASE_URL" };
jest.mock("@tanstack/react-query", () => ({ useQuery: ({ queryKey }: { queryKey: string[] }) => ({
  data: queryKey[0] === "legal_library_status" ? mockStatus : { results: [] }, isSuccess: true,
}) }));

test("estrategias vacías no ofrecen seleccionar cero", () => {
  render(<CaseStrategyMultiSelect strategies={[]} selectedIds={[]} onChange={() => {}} onSubmit={() => {}} />);
  expect(screen.queryByRole("button", { name: /Seleccionar 0/i })).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent(/no hay estrategias|sin datos/i);
});

test("biblioteca vacía usa lenguaje de abogado y oculta configuración", () => {
  render(<LegalLibraryClient />);
  expect(screen.getByText(/Todavía no hay documentos cargados/i)).toBeInTheDocument();
  expect(screen.queryByText(/SUPABASE_DATABASE_URL|GET \/library|Servicio:/i)).toBeNull();
});

test("materias sin flujo no afirman cobertura verificada", () => {
  for (const materia of MATERIAS) {
    expect(COVERAGE_BADGE[materia.coverage].label).toBe(
      ["civil", "penal"].includes(materia.key) ? "Flujo de expediente" : "Registro e investigación",
    );
  }
});

test("investigación no duplica menú ni presenta UUID del tenant", () => {
  render(<LegalResearchClient />);
  expect(screen.queryByText("Legal Hub")).toBeNull();
  expect(screen.queryByText("tenant-uuid-no-visible")).toBeNull();
});

test.each(["HEURISTICA", "SIN_DATOS"])("agente %s no presenta cero alertas ni porcentajes como dictamen", (mode) => {
  const run = { llm_mode: mode, estado: mode === "SIN_DATOS" ? "sin_datos" : "exito" };
  render(<ResearchDictamenView userQuery="Consulta" content="0 alertas. Probabilidad: 50 %." run={run as never}
    highlightSourceId={null} scrollContainer={null} onHighlightSourceId={() => {}} onNewConsult={() => {}} onFollowUp={() => {}} />);
  expect(screen.queryByText(/0 alertas|50 %/)).toBeNull();
  expect(screen.getByText(mode === "HEURISTICA"
    ? /Resultado heurístico/
    : /No hay datos suficientes/)).toBeInTheDocument();
});
