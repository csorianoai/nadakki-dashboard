import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { ClientesPanel } from "@/components/realtor/clientes/ClientesPanel";
import { DEMO_OWNERS } from "@/lib/realtor/clientes/demo";
import { inKind, showsOwners } from "@/lib/realtor/clientes/logic";
import { DEMO_CONTACTS } from "@/lib/realtor/clientes/demo";
import { NO_FILTERS } from "@/lib/realtor/clientes/types";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});

describe("contactos unificado", () => {
  it("lógica: los propietarios solo entran en Todos (sin filtros) y Propietario", () => {
    expect(DEMO_CONTACTS.filter((c) => inKind(c, "propietario"))).toHaveLength(0);
    expect(DEMO_CONTACTS.filter((c) => inKind(c, "todos"))).toHaveLength(6);
    expect(showsOwners("todos", NO_FILTERS)).toBe(true);
    expect(showsOwners("todos", { ...NO_FILTERS, origin: "web" })).toBe(false);
    expect(showsOwners("cliente", NO_FILTERS)).toBe(false);
    DEMO_OWNERS.forEach((o) => expect(o.name).toMatch(/^SYNTH/));
  });

  it("positivo: con DEMO el filtro Propietario lista propietarios que enlazan a /realtor/propietarios", async () => {
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<ClientesPanel />);
    await screen.findByTestId("clientes-panel");
    expect(screen.queryByTestId("owner-row")).toBeNull();
    expect(screen.getByTestId("client-journey")).toHaveTextContent("Hasta USD 3,200/mes");
    const user = userEvent.setup();
    await user.click(screen.getByTestId("tab-propietario"));
    const rows = screen.getAllByTestId("owner-row");
    expect(rows).toHaveLength(DEMO_OWNERS.length);
    rows.forEach((r) => expect(r).toHaveAttribute("href", "/realtor/propietarios"));
    expect(screen.queryByTestId("contact-row")).toBeNull();
    await user.click(screen.getByTestId("tab-todos"));
    expect(screen.getAllByTestId("contact-row")).toHaveLength(6);
    expect(screen.getAllByTestId("owner-row")).toHaveLength(DEMO_OWNERS.length);
  });

  it("negativo y tenant ajeno: sin DEMO no hay propietarios ni cifras, y no viaja tenant", async () => {
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<ClientesPanel />);
    await screen.findByTestId("clientes-empty");
    expect(screen.queryByTestId("owner-row")).toBeNull();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
    expect(JSON.stringify(mockApiFetch.mock.calls)).not.toMatch(/tenant/i);
    expect(screen.getByTestId("clientes-panel").textContent).not.toMatch(/\d/);
  });
});
