import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { PropietariosPanel } from "@/components/realtor/propietarios/PropietariosPanel";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const json = (status: number, body: unknown = {}) => ({ status, json: async () => body });
const CONTACTS = { items: [{ id: "c1", display_label: "María P." }] };
const PROPS = { items: [{ id: "p1", address: { street_line_1: "Calle 1", city: "Santo Domingo", country: "DO" } }] };

/** Responde por ruta; el POST de owners devuelve `postStatus`. */
function route(postStatus: number, demo = false) {
  mockApiFetch.mockImplementation(async (url: string, init?: { method?: string }) => {
    if (/\/acceso/.test(url)) return json(200, demo ? { demo: true } : {});
    if (/\/contacts/.test(url)) return json(200, CONTACTS);
    if (/\/properties/.test(url)) return json(200, PROPS);
    if (/\/owners/.test(url) && init?.method === "POST") return json(postStatus, {});
    return json(200, { items: [] });
  });
}
const posts = () => mockApiFetch.mock.calls.filter(([u, i]) => /\/owners/.test(String(u)) && i?.method === "POST");

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});

async function open() {
  const user = userEvent.setup();
  render(<PropietariosPanel />);
  await user.click(await screen.findByTestId("mandate-open"));
  await screen.findByRole("option", { name: "María P." });
  return user;
}
async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("Contacto"), "c1");
  await user.selectOptions(screen.getByLabelText("Rol del propietario"), "landlord");
  await user.selectOptions(screen.getByLabelText("Propiedad"), "p1");
  await user.selectOptions(screen.getByLabelText("Tipo de mandato"), "exclusive");
  await user.type(screen.getByLabelText("Participación (%)"), "100");
  await user.type(screen.getByLabelText("Inicio"), "2026-11-01");
}

describe("alta del mandato · negativos primero", () => {
  it.each([[403, "mandate-error-forbidden"], [404, "mandate-error-notfound"], [409, "mandate-error-conflict"], [422, "mandate-error-validation"]])(
    "el POST responde %s: error visible, sin éxito", async (status, id) => {
      route(status);
      const user = await open();
      await fill(user);
      await user.click(screen.getByTestId("mandate-submit"));
      expect(await screen.findByTestId(id)).toBeInTheDocument();
      expect(screen.queryByTestId("mandate-success")).toBeNull();
    });

  it("campos vacíos: no se envía nada y se marcan los obligatorios", async () => {
    route(201);
    const user = await open();
    await user.click(screen.getByTestId("mandate-submit"));
    expect(posts()).toHaveLength(0);
    expect(screen.getByTestId("mandate-error-fields")).toBeInTheDocument();
    expect(screen.getByLabelText("Participación (%)")).toHaveAttribute("aria-invalid", "true");
  });

  it("participación fuera de rango: no se envía", async () => {
    route(201);
    const user = await open();
    await fill(user);
    await user.clear(screen.getByLabelText("Participación (%)"));
    await user.type(screen.getByLabelText("Participación (%)"), "101");
    await user.click(screen.getByTestId("mandate-submit"));
    expect(posts()).toHaveLength(0);
  });

  it("en DEMO no hay alta (datos sintéticos)", async () => {
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    route(201, true);
    render(<PropietariosPanel />);
    await screen.findByTestId("demo-banner");
    expect(screen.queryByTestId("mandate-open")).toBeNull();
  });

  it("al abrir el formulario no viaja tenant", async () => {
    route(201);
    await open();
    for (const [url, init] of mockApiFetch.mock.calls) {
      expect(String(url)).not.toMatch(/tenant/i);
      expect(JSON.stringify(init ?? {})).not.toMatch(/tenant/i);
    }
  });
});

describe("alta del mandato · positivo", () => {
  it("envía el cuerpo del contrato, confirma y vuelve a leer la lista", async () => {
    route(201);
    const user = await open();
    await fill(user);
    await user.click(screen.getByTestId("mandate-submit"));
    expect(await screen.findByTestId("mandate-success")).toBeInTheDocument();
    expect(posts()).toHaveLength(1);
    expect(JSON.parse(posts()[0][1].body)).toEqual({
      contact_id: "c1", role: "landlord", property_id: "p1", kind: "exclusive", share_pct: "100", starts_on: "2026-11-01", status: "draft",
    });
    await waitFor(() => {
      const gets = mockApiFetch.mock.calls.filter(([u, i]) => /\/owners/.test(String(u)) && i?.method === "GET");
      expect(gets.length).toBeGreaterThanOrEqual(2);
    });
  });
});
