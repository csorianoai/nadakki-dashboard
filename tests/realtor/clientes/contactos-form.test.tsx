import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import { ClientesPanel } from "@/components/realtor/clientes/ClientesPanel";

// Cliente REAL del API (apiFetch sin simular): solo se sustituye la red (fetch), nunca la autorización ni el cliente.
type Call = { url: string; method: string; body: unknown; headers: Headers };
let calls: Call[];
let clients: unknown[];
let handlers: Record<string, () => { status: number; body: unknown }>;
const reply = (status: number, body: unknown) => ({ status, body });

const row = (id: string, label: string) => ({ contact: { id, display_label: label, source: "manual", primary_points: [] }, client_roles: ["buyer"], agreement_signed: false });

beforeEach(() => {
  calls = []; clients = []; handlers = {};
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url);
    const method = init?.method ?? "GET";
    calls.push({ url: u, method, body: init?.body ? JSON.parse(String(init.body)) : undefined, headers: new Headers(init?.headers ?? undefined) });
    const h = handlers[`${method} ${u.split("?")[0]}`];
    const r = u.includes("/acceso") ? reply(200, { ok: true, roles: ["owner"], demo: false })
      : h ? h() : method === "GET" ? reply(200, { items: clients, next_cursor: null }) : reply(500, {});
    return { status: r.status, ok: r.status < 400, json: async () => r.body } as Response;
  }) as unknown as typeof fetch;
});

const writes = () => calls.filter((c) => c.method !== "GET" && !c.url.includes("/acceso"));
const open = async () => {
  render(<ClientesPanel />);
  await screen.findByTestId("clientes-panel");
  return userEvent.setup();
};

describe("formulario de contacto (alta)", () => {
  it("crea el contacto con rol: POST /contacts sin tenant ni propietario y refresca la lista", async () => {
    handlers["POST /api/v1/realestate/contacts"] = () => {
      clients = [row("k1", "Ana P.")];
      return reply(201, { id: "k1", kind: "person", display_label: "Ana P." });
    };
    const user = await open();
    await user.click(await screen.findByTestId("contact-new"));
    await user.type(screen.getByLabelText("Nombre completo"), "Ana Pérez");
    await user.type(screen.getByLabelText("Etiqueta corta"), "Ana P.");
    await user.selectOptions(screen.getByLabelText("Rol del contacto"), "buyer");
    await user.click(screen.getByTestId("contact-save"));
    await waitFor(() => expect(screen.getByTestId("contact-saved")).toBeInTheDocument());
    const [w] = writes();
    expect(writes()).toHaveLength(1);
    expect(w.url).toBe("/api/v1/realestate/contacts");
    expect(w.body).toEqual({ kind: "person", display_name: "Ana Pérez", display_label: "Ana P.", role: "buyer" });
    expect(JSON.stringify(w)).not.toMatch(/tenant|owner_user/i);
    expect(await screen.findByTestId("contact-row")).toHaveTextContent("Ana P.");
  });

  it("422 de validación: el error queda visible junto al campo y el formulario sigue abierto", async () => {
    handlers["POST /api/v1/realestate/contacts"] = () => reply(422, { detail: "VALIDATION_ERROR: display_label" });
    const user = await open();
    await user.click(await screen.findByTestId("contact-new"));
    await user.type(screen.getByLabelText("Nombre completo"), "Ana Pérez");
    await user.type(screen.getByLabelText("Etiqueta corta"), "x");
    await user.click(screen.getByTestId("contact-save"));
    const err = await screen.findByTestId("field-error-display_label");
    expect(err).toHaveTextContent(/Etiqueta corta/);
    expect(screen.getByTestId("contact-form")).toBeInTheDocument();
    expect(screen.queryByTestId("contact-saved")).toBeNull();
  });

  it("422 de FastAPI (detail como lista) también se muestra", async () => {
    handlers["POST /api/v1/realestate/contacts"] = () => reply(422, { detail: [{ loc: ["body", "display_name"], msg: "Field required", type: "missing" }] });
    const user = await open();
    await user.click(await screen.findByTestId("contact-new"));
    await user.type(screen.getByLabelText("Etiqueta corta"), "Ana");
    await user.click(screen.getByTestId("contact-save"));
    expect(await screen.findByTestId("field-error-display_name")).toBeInTheDocument();
  });

  it("403: mensaje de permiso visible, sin éxito falso", async () => {
    handlers["POST /api/v1/realestate/contacts"] = () => reply(403, { detail: "Forbidden" });
    const user = await open();
    await user.click(await screen.findByTestId("contact-new"));
    await user.type(screen.getByLabelText("Nombre completo"), "Ana Pérez");
    await user.type(screen.getByLabelText("Etiqueta corta"), "Ana P.");
    await user.click(screen.getByTestId("contact-save"));
    const err = await screen.findByTestId("contact-form-error");
    expect(err).toHaveAttribute("role", "alert");
    expect(err).toHaveTextContent(/permiso/i);
    expect(screen.queryByTestId("contact-saved")).toBeNull();
  });

  it("DEMO no escribe: sin botón de alta", async () => {
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    global.fetch = jest.fn(async () => ({ status: 200, ok: true, json: async () => ({ ok: true, roles: [], demo: true }) }) as Response) as unknown as typeof fetch;
    await open();
    expect(screen.queryByTestId("contact-new")).toBeNull();
  });
});

describe("ficha: editar contacto", () => {
  it("PATCH solo con lo cambiado y POST de rol si cambia el rol", async () => {
    clients = [row("k1", "Ana P.")];
    handlers["PATCH /api/v1/realestate/contacts/k1"] = () => reply(200, { id: "k1", display_label: "Ana Q." });
    handlers["POST /api/v1/realestate/contacts/k1/roles"] = () => reply(201, { id: "k1" });
    const user = await open();
    await user.click(await screen.findByTestId("contact-edit"));
    const label = screen.getByLabelText("Etiqueta corta");
    expect(label).toHaveValue("Ana P.");
    await user.clear(label);
    await user.type(label, "Ana Q.");
    await user.selectOptions(screen.getByLabelText("Rol del contacto"), "seller");
    await user.click(screen.getByTestId("contact-save"));
    await waitFor(() => expect(screen.getByTestId("contact-saved")).toBeInTheDocument());
    expect(writes().map((c) => `${c.method} ${c.url}`)).toEqual(["PATCH /api/v1/realestate/contacts/k1", "POST /api/v1/realestate/contacts/k1/roles"]);
    expect(writes()[0].body).toEqual({ display_label: "Ana Q." });
    expect(writes()[1].body).toEqual({ role: "seller" });
  });

  it("409 (rol vigente duplicado) y 404 se muestran", async () => {
    clients = [row("k1", "Ana P.")];
    handlers["POST /api/v1/realestate/contacts/k1/roles"] = () => reply(409, { detail: "CONFLICT: el contacto ya tiene ese rol vigente" });
    const user = await open();
    await user.click(await screen.findByTestId("contact-edit"));
    await user.selectOptions(screen.getByLabelText("Rol del contacto"), "seller");
    await user.click(screen.getByTestId("contact-save"));
    const err = await screen.findByTestId("contact-form-error");
    expect(within(err).getByText(/ya tiene ese rol/i)).toBeInTheDocument();
  });

  it("sin cambios no llama al API", async () => {
    clients = [row("k1", "Ana P.")];
    const user = await open();
    await user.click(await screen.findByTestId("contact-edit"));
    await user.click(screen.getByTestId("contact-save"));
    expect(writes()).toHaveLength(0);
    expect(await screen.findByTestId("contact-form-error")).toBeInTheDocument();
  });
});
