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

const packVerified = {
  jurisdiction: "do",
  version: "2.2",
  verification_status: "verified" as const,
  verified_by: "Ramon Almonte Soriano",
  verified_at: "2026-04-01T12:00:00Z",
  practice_areas_covered: [] as string[],
  leyes_codificadas_count: 1,
  articulos_codificados_count: 2,
};

const packPending = {
  jurisdiction: "do",
  version: "1.0",
  verification_status: "pending_attorney_review" as const,
  practice_areas_covered: [] as string[],
  leyes_codificadas_count: 0,
  articulos_codificados_count: 0,
};

describe("Worker F — quitar guardrails restrictivos post sello", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    push.mockClear();
    jest.clearAllMocks();
  });

  describe("DemoBannerStrong", () => {
    it("verified: green-50, copy piloto + ShieldCheck", () => {
      mockUseKnowledgePackInfo.mockReturnValue({ info: packVerified, loading: false });
      const { container } = render(<DemoBannerStrong />);
      expect(container.querySelector(".bg-green-50")).toBeTruthy();
      expect(screen.getByText(/Sistema en piloto controlado/i)).toBeInTheDocument();
      expect(screen.getByText(/Conocimiento legal validado por abogado RD autorizado/i)).toBeInTheDocument();
      expect(screen.getByText(/no sustituyen asesoría legal profesional/i)).toBeInTheDocument();
    });

    it("pending: amber-50 + AlertTriangle + texto restrictivo", () => {
      mockUseKnowledgePackInfo.mockReturnValue({ info: packPending, loading: false });
      const { container } = render(<DemoBannerStrong />);
      expect(container.querySelector(".bg-amber-50")).toBeTruthy();
      expect(screen.getByText(/Validación pendiente/i)).toBeInTheDocument();
    });
  });

  describe("DemoAcceptanceModal", () => {
    it("verified: panel opcional complementary, no alertdialog", async () => {
      mockUseKnowledgePackInfo.mockReturnValue({ info: packVerified, loading: false });
      render(<DemoAcceptanceModal />);
      expect(await screen.findByRole("complementary")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Piloto controlado" })).toBeInTheDocument();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("verified: Entendido dismiss sessionStorage", async () => {
      mockUseKnowledgePackInfo.mockReturnValue({ info: packVerified, loading: false });
      render(<DemoAcceptanceModal />);
      fireEvent.click(await screen.findByRole("button", { name: /Entendido/i }));
      await waitFor(() => {
        expect(sessionStorage.getItem("legal_pilot_optional_info_dismissed")).toBe("1");
      });
    });

    it("pending: alertdialog restrictivo si no hay aceptación en localStorage", async () => {
      mockUseKnowledgePackInfo.mockReturnValue({ info: packPending, loading: false });
      render(<DemoAcceptanceModal />);
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByText(/Validación requerida/i)).toBeInTheDocument();
    });

    it("pending: aceptar guarda localStorage", async () => {
      mockUseKnowledgePackInfo.mockReturnValue({ info: packPending, loading: false });
      render(<DemoAcceptanceModal />);
      fireEvent.click(await screen.findByRole("button", { name: /Entiendo los riesgos, continuar/i }));
      await waitFor(() => {
        expect(localStorage.getItem("legal_post_sello_accepted")).toBe("true");
        expect(localStorage.getItem("legal_demo_accepted")).toBe("true");
      });
    });
  });

  describe("ResearchPage", () => {
    it("tono piloto controlado en aviso LLM (sin Fase 2 demo)", async () => {
      sessionStorage.setItem("legal_pilot_optional_info_dismissed", "1");
      localStorage.setItem("legal_post_sello_accepted", "true");
      mockUseKnowledgePackInfo.mockReturnValue({ info: packVerified, loading: false });
      mockUseLegalQuickCheck.mockReturnValue({
        loading: false,
        result: null,
        error: null,
        submit: jest.fn(),
        reset: jest.fn(),
        tenantMissing: false,
      });
      render(<ResearchPage />);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(screen.getByText(/Piloto controlado:/i)).toBeInTheDocument();
      expect(screen.queryByText(/Fase 2 — LLM operativo/i)).not.toBeInTheDocument();
      expect(screen.getByText(/watermark/i)).toBeInTheDocument();
    });
  });
});
