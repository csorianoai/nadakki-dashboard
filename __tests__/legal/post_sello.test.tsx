import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DemoBannerStrong } from "@/components/legal/DemoBannerStrong";
import { DemoAcceptanceModal } from "@/components/legal/DemoAcceptanceModal";
import ResearchPage from "@/app/legal/research/page";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/hooks/useLegal", () => ({
  useKnowledgePackInfo: jest.fn(),
  useLegalQuickCheck: jest.fn(),
}));

import { useKnowledgePackInfo, useLegalQuickCheck } from "@/hooks/useLegal";

const mockUseKnowledgePackInfo = useKnowledgePackInfo as jest.MockedFunction<typeof useKnowledgePackInfo>;
const mockUseLegalQuickCheck = useLegalQuickCheck as jest.MockedFunction<typeof useLegalQuickCheck>;

describe("Worker F — post sello Legal Core (Fase 2)", () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    jest.clearAllMocks();
  });

  describe("DemoBannerStrong", () => {
    it("muestra piloto verificado RD con fallback Ramon Almonte Soriano cuando status verified", () => {
      mockUseKnowledgePackInfo.mockReturnValue({
        info: {
          jurisdiction: "do",
          version: "2.2",
          verification_status: "verified",
          verified_by: "Ramon Almonte Soriano",
          verified_at: "2026-04-01T12:00:00Z",
          practice_areas_covered: [],
          leyes_codificadas_count: 1,
          articulos_codificados_count: 2,
        },
        loading: false,
      });
      render(<DemoBannerStrong />);
      expect(screen.getByText(/Piloto controlado — Fase 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Ramon Almonte Soriano/i)).toBeInTheDocument();
      expect(screen.getByText(/LLM real/i)).toBeInTheDocument();
    });

    it("usa verified_by del API cuando viene distinto", () => {
      mockUseKnowledgePackInfo.mockReturnValue({
        info: {
          jurisdiction: "do",
          version: "2.2",
          verification_status: "verified",
          verified_by: "Otro Firmante",
          practice_areas_covered: [],
          leyes_codificadas_count: 0,
          articulos_codificados_count: 0,
        },
        loading: false,
      });
      render(<DemoBannerStrong />);
      expect(screen.getByText(/Otro Firmante/)).toBeInTheDocument();
      expect(screen.queryByText(/Ramon Almonte Soriano/)).not.toBeInTheDocument();
    });
  });

  describe("DemoAcceptanceModal", () => {
    it("muestra modal Fase 2 y watermark PILOTO CONTROLADO en el texto", async () => {
      render(<DemoAcceptanceModal />);
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/Piloto controlado — Legal Core RD \(Fase 2\)/)).toBeInTheDocument();
      expect(screen.getByText(/PILOTO CONTROLADO/)).toBeInTheDocument();
      expect(screen.getByText(/Capa 2 — citas/i)).toBeInTheDocument();
    });

    it("guarda legal_post_sello_accepted y legal_demo_accepted al aceptar", async () => {
      render(<DemoAcceptanceModal />);
      fireEvent.click(await screen.findByRole("button", { name: /Acepto, continuar/i }));
      await waitFor(() => {
        expect(localStorage.getItem("legal_post_sello_accepted")).toBe("true");
        expect(localStorage.getItem("legal_demo_accepted")).toBe("true");
      });
    });
  });

  describe("ResearchPage", () => {
    it("muestra aviso Fase 2 LLM real y ayuda de watermark PILOTO CONTROLADO", async () => {
      localStorage.setItem("legal_post_sello_accepted", "true");
      mockUseLegalQuickCheck.mockReturnValue({
        loading: false,
        result: null,
        error: null,
        submit: jest.fn(),
        reset: jest.fn(),
        tenantMissing: false,
      });
      render(<ResearchPage />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText(/Fase 2 — LLM operativo/i)).toBeInTheDocument();
      expect(screen.getByText(/watermark/i)).toBeInTheDocument();
      expect(screen.getByText(/PILOTO CONTROLADO/)).toBeInTheDocument();
    });
  });
});
