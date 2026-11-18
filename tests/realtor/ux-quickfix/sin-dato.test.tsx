import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MiDiaPanel } from "@/components/realtor/mi-dia/MiDiaPanel";
import { CareerDirectorPanel } from "@/components/realtor/career-director/CareerDirectorPanel";
import { StatusBadge } from "@/components/realtor/StatusBadge";
import { METRICS } from "@/lib/realtor/career-director/demo";

/**
 * ROP-UX-QUICKFIX: ningún código interno (NO_DISPONIBLE, NOT_AVAILABLE, UNAVAILABLE) llega al texto que se lee; en su lugar
 * un texto humano con una acción. El marcador de máquina se conserva en data-quality / data-status (las pruebas y la
 * auditoría siguen pudiendo distinguir «sin fuente» de «vacío»).
 */
const CODIGO = /NO_DISPONIBLE|NOT_AVAILABLE|UNAVAILABLE/;
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));
jest.mock("next/navigation", () => ({ usePathname: () => "/realtor/mi-dia" }));

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});
const settle = async () => {
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
};

describe("Mi día sin fuente", () => {
  it("negativo: ninguna sección muestra un código; conservan data-quality=NO_DISPONIBLE", async () => {
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: false }) });
    render(<MiDiaPanel />);
    await settle();
    const vacios = await screen.findAllByTestId("mi-dia-no-disponible");
    expect(vacios).toHaveLength(3);
    vacios.forEach((v) => expect(v).toHaveAttribute("data-quality", "NO_DISPONIBLE"));
    expect(screen.getByTestId("mi-dia-panel").textContent).not.toMatch(CODIGO);
  });
  it("positivo: cada sección dice qué falta y ofrece una acción dentro de Realtor", async () => {
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: false }) });
    render(<MiDiaPanel />);
    await settle();
    const leads = within(screen.getByTestId("mi-dia-leads"));
    expect(leads.getByText("Todavía no hay leads conectados.")).toBeInTheDocument();
    expect(leads.getByRole("link", { name: "Ver contactos" })).toHaveAttribute("href", "/realtor/clientes");
    const listings = within(screen.getByTestId("mi-dia-listings"));
    expect(listings.getByText("Todavía no hay datos de tus propiedades.")).toBeInTheDocument();
    expect(listings.getByRole("link", { name: "Ver propiedades" })).toHaveAttribute("href", "/realtor/propiedades");
    const visitas = within(screen.getByTestId("mi-dia-visitas"));
    expect(visitas.getByText("Todavía no podemos leer tus visitas.")).toBeInTheDocument();
    expect(visitas.getByRole("link", { name: "Abrir Smart Calendar" })).toHaveAttribute("href", "/realtor/smart-calendar");
  });
  it("EN: los mismos textos en inglés, sin códigos", async () => {
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: false }) });
    render(<MiDiaPanel />);
    await settle();
    fireEvent.click(screen.getByTestId("lang-en"));
    expect(within(screen.getByTestId("mi-dia-leads")).getByRole("link", { name: "View contacts" })).toBeInTheDocument();
    expect(within(screen.getByTestId("mi-dia-visitas")).getByText("We can't read your visits yet.")).toBeInTheDocument();
    expect(screen.getByTestId("mi-dia-panel").textContent).not.toMatch(CODIGO);
  });
});

describe("Career Director: métricas sin fuente", () => {
  it("texto humano con acción a Operaciones; data-quality conservado", async () => {
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<CareerDirectorPanel />);
    await screen.findByTestId("career-director-panel");
    for (const m of METRICS.filter((x) => !x.source)) {
      const el = screen.getByTestId(`no-disponible-${m.id}`);
      expect(el).toHaveAttribute("data-quality", "NO_DISPONIBLE");
      expect(el).toHaveTextContent("Sin datos todavía");
      expect(el.textContent).not.toMatch(CODIGO);
      expect(within(el).getByRole("link", { name: "Registrar operaciones" })).toHaveAttribute("href", "/realtor/operaciones");
    }
  });
});

describe("StatusBadge", () => {
  it("UNAVAILABLE se lee «Sin datos»; data-status y la explicación se conservan", () => {
    render(<StatusBadge status="UNAVAILABLE" />);
    const b = screen.getByTestId("status-badge");
    expect(b).toHaveTextContent("Sin datos");
    expect(b).toHaveAttribute("data-status", "UNAVAILABLE");
    expect(b).toHaveAttribute("title", "Sin dato: la fuente no está disponible.");
  });
});

describe("guardas de copia: ningún texto visible es un código", () => {
  const raiz = process.cwd();
  it.each([
    "lib/realtor/mi-dia/copy.ts", "lib/realtor/career-director/copy.ts", "lib/realtor/marketing-ai/copy.ts",
    "lib/realtor/textos.ts", "lib/realtor/copy.ts", "components/realtor/alta-copy.ts",
  ])("%s", (f) => {
    const src = readFileSync(join(raiz, f), "utf8");
    expect(src).not.toMatch(/:\s*"(NO_DISPONIBLE|NOT_AVAILABLE|UNAVAILABLE)"/);
  });
  it("LicenseBrokerDraft no antepone «UNAVAILABLE · » al texto", () => {
    const src = readFileSync(join(raiz, "components/realtor/LicenseBrokerDraft.tsx"), "utf8");
    expect(src).not.toContain('"UNAVAILABLE · "');
  });
});
