import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { PropiedadesPanel } from "@/components/realtor/propiedades/PropiedadesPanel";

// Cliente REAL del API y acceso REAL (apiFetch y useRealtorAccess sin simular): solo se sustituye la red (fetch).
type Call = { url: string; method: string; body: unknown };
let calls: Call[];
let properties: unknown[];
let listings: unknown[];
let access: { status: number; body: unknown };
let handlers: Record<string, () => { status: number; body: unknown }>;
const reply = (status: number, body: unknown) => ({ status, body });

const PID = "11111111-1111-4111-8111-111111111111";
const OWNER = "22222222-2222-4222-8222-222222222222";
const BASE = "/api/v1/realestate";

beforeEach(() => {
  calls = []; handlers = {}; properties = []; listings = [];
  access = reply(200, { ok: true, roles: ["owner"], demo: false });
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url);
    const method = init?.method ?? "GET";
    calls.push({ url: u, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const path = u.split("?")[0];
    const h = handlers[`${method} ${path}`];
    const r = u.includes("/acceso") ? access
      : h ? h()
      : path === `${BASE}/properties` && method === "GET" ? reply(200, { items: properties, next_cursor: null })
      : path === `${BASE}/listings` ? reply(200, { items: listings, next_cursor: null })
      : path === `${BASE}/contacts` ? reply(200, { items: [{ id: OWNER, display_label: "Ana P." }], next_cursor: null })
      : reply(500, {});
    return { status: r.status, ok: r.status < 400, json: async () => r.body } as Response;
  }) as unknown as typeof fetch;
});

const writes = () => calls.filter((c) => c.method !== "GET" && !c.url.includes("/acceso"));
const open = async () => {
  render(<PropiedadesPanel />);
  await screen.findByTestId("propiedades-panel");
  return userEvent.setup();
};
const seed = () => {
  properties = [{ id: PID, property_type: "house", address: { city: "Santiago", region: "Cibao" } }];
  listings = [{ id: "L1", property_id: PID, status: "active", list_price: { amount: "100000", currency: "USD" } }];
};

describe("formulario de propiedad (alta)", () => {
  it("crea la propiedad con propietario: POST /properties sin tenant y marca guardado", async () => {
    handlers[`POST ${BASE}/properties`] = () => reply(201, { id: PID });
    const user = await open();
    await user.click(await screen.findByTestId("propiedad-new"));
    await user.type(screen.getByLabelText("País"), "DO");
    await user.type(screen.getByLabelText("Ciudad"), "Santo Domingo");
    await user.type(screen.getByLabelText("Jurisdicción"), "DO");
    await user.selectOptions(screen.getByLabelText("Tipo de propiedad"), "house");
    await user.selectOptions(await screen.findByRole("option", { name: "Ana P." }).then(() => screen.getByLabelText("Propietario")), OWNER);
    await user.click(screen.getByTestId("propiedad-save"));
    await waitFor(() => expect(screen.getByTestId("propiedad-saved")).toBeInTheDocument());
    expect(writes()).toHaveLength(1);
    expect(writes()[0].url).toBe(`${BASE}/properties`);
    expect(writes()[0].body).toEqual({ address: { country: "DO", city: "Santo Domingo" }, jurisdiction: "DO", property_type: "house", owner_contact_id: OWNER });
    expect(JSON.stringify(writes()[0])).not.toMatch(/tenant/i);
    expect(screen.queryByTestId("propiedad-form")).toBeNull();
  });

  it("faltan campos obligatorios: no escribe y lo dice", async () => {
    const user = await open();
    await user.click(await screen.findByTestId("propiedad-new"));
    await user.click(screen.getByTestId("propiedad-save"));
    expect(await screen.findByTestId("propiedad-form-error")).toHaveTextContent("Revisa los datos");
    expect(writes()).toHaveLength(0);
  });

  it("403 del servidor: el error queda visible, el formulario sigue abierto y no hay éxito falso", async () => {
    handlers[`POST ${BASE}/properties`] = () => reply(403, { detail: "FORBIDDEN" });
    const user = await open();
    await user.click(await screen.findByTestId("propiedad-new"));
    await user.type(screen.getByLabelText("País"), "DO");
    await user.type(screen.getByLabelText("Jurisdicción"), "DO");
    await user.selectOptions(screen.getByLabelText("Tipo de propiedad"), "land");
    await user.click(screen.getByTestId("propiedad-save"));
    expect(await screen.findByTestId("propiedad-form-error")).toHaveTextContent("No tienes permiso");
    expect(screen.getByTestId("propiedad-form")).toBeInTheDocument();
    expect(screen.queryByTestId("propiedad-saved")).toBeNull();
  });
});

describe("formulario de propiedad (edición)", () => {
  it("precarga con GET /properties/{id} y guarda con PATCH sin tenant", async () => {
    seed();
    handlers[`GET ${BASE}/properties/${PID}`] = () => reply(200, { id: PID, jurisdiction: "DO", property_type: "house", owner_contact_id: OWNER,
      address: { country: "DO", city: "Santiago" }, units: [] });
    handlers[`PATCH ${BASE}/properties/${PID}`] = () => reply(200, { id: PID });
    const user = await open();
    await user.click(await screen.findByTestId("propiedad-edit"));
    await waitFor(() => expect(screen.getByLabelText("Ciudad")).toHaveValue("Santiago"));
    await user.clear(screen.getByLabelText("Ciudad"));
    await user.type(screen.getByLabelText("Ciudad"), "Puerto Plata");
    await user.click(screen.getByTestId("propiedad-save"));
    await waitFor(() => expect(screen.getByTestId("propiedad-saved")).toBeInTheDocument());
    expect(writes()).toHaveLength(1);
    expect(writes()[0].method).toBe("PATCH");
    expect(writes()[0].url).toBe(`${BASE}/properties/${PID}`);
    expect(writes()[0].body).toEqual({ address: { country: "DO", city: "Puerto Plata" }, jurisdiction: "DO", property_type: "house", owner_contact_id: OWNER });
  });

  it("si la propiedad no carga, no abre el formulario con datos inventados", async () => {
    seed();
    handlers[`GET ${BASE}/properties/${PID}`] = () => reply(404, {});
    const user = await open();
    await user.click(await screen.findByTestId("propiedad-edit"));
    expect(await screen.findByTestId("propiedad-load-error")).toHaveTextContent("No se pudo cargar");
    expect(screen.queryByTestId("propiedad-form")).toBeNull();
  });
});

describe("puertas reales", () => {
  it("DEMO: no hay botones de alta ni edición (nada se escribe)", async () => {
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    access = reply(200, { demo: true });
    await open();
    expect(screen.queryByTestId("propiedad-new")).toBeNull();
    expect(screen.queryByTestId("propiedad-edit")).toBeNull();
  });
  it("acceso 403: ni pantalla ni botón de alta", async () => {
    access = reply(403, {});
    render(<PropiedadesPanel />);
    await waitFor(() => expect(screen.queryByTestId("propiedades-panel")).toBeNull());
    expect(screen.queryByTestId("propiedad-new")).toBeNull();
  });
});
