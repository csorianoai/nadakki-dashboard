import { render, screen, fireEvent } from "@testing-library/react";
import { DemoAcceptanceModal } from "@/components/legal/DemoAcceptanceModal";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/hooks/useLegal", () => ({
  useKnowledgePackInfo: jest.fn(),
  useLegalQuickCheck: jest.fn(),
}));

import { useKnowledgePackInfo } from "@/hooks/useLegal";

const mockUseKnowledgePackInfo = useKnowledgePackInfo as jest.MockedFunction<typeof useKnowledgePackInfo>;

const packPending = {
  jurisdiction: "do",
  version: "1.0",
  verification_status: "pending_attorney_review" as const,
  practice_areas_covered: [] as string[],
  leyes_codificadas_count: 0,
  articulos_codificados_count: 0,
};

describe("DemoAcceptanceModal", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    push.mockClear();
    mockUseKnowledgePackInfo.mockReturnValue({ info: packPending, loading: false });
  });

  it("pack pendiente: alertdialog restrictivo si no hay aceptación", async () => {
    render(<DemoAcceptanceModal />);
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/Validación requerida/i)).toBeInTheDocument();
  });

  it("pack pendiente: aceptar guarda flags en localStorage", async () => {
    render(<DemoAcceptanceModal />);
    const accept = await screen.findByRole("button", { name: /Entiendo los riesgos, continuar/i });
    fireEvent.click(accept);
    expect(localStorage.getItem("legal_post_sello_accepted")).toBe("true");
    expect(localStorage.getItem("legal_demo_accepted")).toBe("true");
  });
});
