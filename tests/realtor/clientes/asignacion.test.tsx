import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import { ClientesPanel } from "@/components/realtor/clientes/ClientesPanel";

// ROP-G4-ASIGNACION-UI. Cliente REAL del API y acceso REAL (/acceso responde por red): solo se sustituye fetch.
const CID = "11111111-1111-4111-8111-111111111111";
const PID = "22222222-2222-4222-8222-222222222222";
const PID2 = "33333333-3333-4333-8333-333333333333";
const BASE = "/api/v1/realestate";

type Call = { url: string; method: string; body: unknown };
let calls: Call[];
let assigned: { id: string; contact_id: string; property_id: string; assigned_at: string; withdrawn_at: null }[];
let postStatus: number;
let postBody: unknown;
let listStatus: number;

beforeEach(() => {
  calls = []; assigned = []; postStatus = 201; postBody = undefined; listStatus = 200;
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url);
    const path = u.split("?")[0];
    const method = init?.method ?? "GET";
    calls.push({ url: u, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    let r: { status: number; body: unknown } = { status: 404, body: {} };
    if (u.includes("/acceso")) r = { status: 200, body: { ok: true, roles: ["owner"], demo: false } };
    else if (method === "GET" && path === `${BASE}/clients`)
      r = { status: 200, body: { items: [{ contact: { id: CID, display_label: "Ana P.", source: "manual", primary_points: [] }, client_roles: ["buyer"], agreement_signed: false }], next_cursor: null } };
    else if (method === "GET" && path === `${BASE}/properties`)
      r = { status: 200, body: { items: [{ id: PID, address: { city: "Santo Domingo", region: "DN" } }, { id: PID2, address: { city: "Santiago", region: "ST" } }] } };
    else if (method === "GET" && path === `${BASE}/contacts/${CID}/properties`) r = { status: listStatus, body: { items: assigned } };
    else if (method === "POST" && path === `${BASE}/contacts/${CID}/properties`) {
      const pid = (JSON.parse(String(init?.body)) as { property_id: string }).property_id;
      if (postStatus === 201) assigned.push({ id: `a-${assigned.length}`, contact_id: CID, property_id: pid, assigned_at: "2026-10-24T10:00:00Z", withdrawn_at: null });
      r = { status: postStatus, body: postStatus === 201 ? assigned[assigned.length - 1] : postBody ?? {} };
    }
    return { status: r.status, ok: r.status < 400, json: async () => r.body } as Response;
  }) as unknown as typeof fetch;
});

const posts = () => calls.filter((c) => c.method === "POST");
const open = async () => {
  render(<ClientesPanel />);
  await screen.findByTestId("contact-row");
  const user = userEvent.setup();
  await screen.findByTestId("asignar-propiedad");
  await waitFor(() => expect(within(screen.getByTestId("asignar-select")).getAllByRole("option").length).toBeGreaterThan(1));
  return user;
};
const assign = async (user: ReturnType<typeof userEvent.setup>, pid = PID) => {
  await user.selectOptions(screen.getByTestId("asignar-select"), pid);
  await user.click(screen.getByTestId("asignar-submit"));
};

describe("asignar propiedad — errores visibles", () => {
  it("403: mensaje de permiso visible y nada en la lista", async () => {
    postStatus = 403; postBody = { detail: "FORBIDDEN" };
    const user = await open();
    await assign(user);
    expect(await screen.findByTestId("asignar-error")).toHaveTextContent(/permiso/i);
    expect(screen.queryAllByTestId("asignacion-row")).toHaveLength(0);
  });

  it("404: la propiedad o el contacto no existe o es de otra cuenta", async () => {
    postStatus = 404; postBody = { detail: "NOT_FOUND: re_properties" };
    const user = await open();
    await assign(user);
    expect(await screen.findByTestId("asignar-error")).toHaveTextContent(/no existe|no pertenece/i);
  });

  it("409: ya asignada, visible, sin duplicar la fila", async () => {
    const user = await open();
    await assign(user);
    await screen.findAllByTestId("asignacion-row");
    postStatus = 409; postBody = { detail: "CONFLICT: ya asignada" };
    await assign(user);
    expect(await screen.findByTestId("asignar-error")).toHaveTextContent(/ya está asignada/i);
    expect(screen.getAllByTestId("asignacion-row")).toHaveLength(1);
  });

  it("422: error de validación visible", async () => {
    postStatus = 422; postBody = { detail: [{ loc: ["body", "property_id"], msg: "invalid" }] };
    const user = await open();
    await assign(user);
    expect(await screen.findByTestId("asignar-error")).toHaveTextContent(/revisa/i);
  });

  it("sin propiedad elegida no se envía nada", async () => {
    const user = await open();
    await user.click(screen.getByTestId("asignar-submit"));
    expect(posts()).toHaveLength(0);
    expect(await screen.findByTestId("asignar-error")).toBeInTheDocument();
  });

  it("si falla la carga de la lista se avisa (no se muestra vacío como si fuera real)", async () => {
    listStatus = 403;
    render(<ClientesPanel />);
    await screen.findByTestId("asignar-propiedad");
    expect(await screen.findByTestId("asignaciones-error")).toBeInTheDocument();
  });
});

describe("asignar propiedad — camino feliz", () => {
  it("POST sin tenant, aparece en la lista y persiste tras recargar", async () => {
    const user = await open();
    await assign(user);
    const rows = await screen.findAllByTestId("asignacion-row");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("Santo Domingo");
    expect(posts()).toHaveLength(1);
    expect(posts()[0].url).toBe(`${BASE}/contacts/${CID}/properties`);
    expect(posts()[0].body).toEqual({ property_id: PID });
    expect(JSON.stringify(posts()[0])).not.toMatch(/tenant/i);
    document.body.innerHTML = "";
    render(<ClientesPanel />);
    const again = await screen.findAllByTestId("asignacion-row");
    expect(again).toHaveLength(1);
    expect(again[0]).toHaveTextContent("Santo Domingo");
  });
});
