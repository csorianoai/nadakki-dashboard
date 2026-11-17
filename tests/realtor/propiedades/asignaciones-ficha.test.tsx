import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import { PropiedadesPanel } from "@/components/realtor/propiedades/PropiedadesPanel";

// Acceso y cliente REALES (apiFetch y useRealtorAccess sin simular): solo se sustituye la red (fetch).
const PID = "11111111-1111-4111-8111-111111111111";
const CID = "22222222-2222-4222-8222-222222222222";
const AID = "33333333-3333-4333-8333-333333333333";
const BASE = "/api/v1/realestate";

let assigned: boolean;
let postStatus: number;
let deleteStatus: number;
let calls: { method: string; path: string; body?: string }[];

beforeEach(() => {
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  assigned = true; postStatus = 201; deleteStatus = 200; calls = [];
  global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const path = String(url).split("?")[0];
    const method = init?.method ?? "GET";
    calls.push({ method, path, body: init?.body as string | undefined });
    const ok = (body: unknown, status = 200) => ({ status, ok: status < 400, json: async () => body }) as Response;
    if (path.includes("/acceso")) return ok({ ok: true, roles: ["owner"], demo: false });
    if (path === `${BASE}/properties`) return ok({ items: [{ id: PID, property_type: "house", address: { city: "Santiago", region: "Cibao" } }], next_cursor: null });
    if (path === `${BASE}/listings`) return ok({ items: [{ id: "L1", property_id: PID, status: "active", list_price: { amount: "100000", currency: "USD" } }], next_cursor: null });
    if (path === `${BASE}/contacts`) return ok({ items: [{ id: CID, display_label: "Ana P." }], next_cursor: null });
    if (path === `${BASE}/properties/${PID}/contacts`) return ok({ items: assigned ? [{ id: AID, contact_id: CID, property_id: PID, assigned_at: "2026-10-20T10:00:00Z" }] : [] });
    if (path === `${BASE}/contacts/${CID}/properties` && method === "POST") { if (postStatus < 400) assigned = true; return ok({}, postStatus); }
    if (path === `${BASE}/contacts/${CID}/properties/${AID}` && method === "DELETE") { if (deleteStatus < 400) assigned = false; return ok({}, deleteStatus); }
    return ok({ items: [], next_cursor: null });
  }) as unknown as typeof fetch;
});

async function openFicha() {
  render(<PropiedadesPanel />);
  const user = userEvent.setup();
  await user.click(await screen.findByTestId("property-row"));
  return { user, section: await screen.findByTestId("asignaciones-section") };
}

async function assign(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(await screen.findByLabelText(/contacto/i), CID);
  await user.click(screen.getByTestId("asignar-submit"));
}

describe("ficha de la propiedad → prospectos asignados", () => {
  it("409: asignación duplicada muestra conflicto y no inventa filas", async () => {
    postStatus = 409; assigned = false;
    const { user } = await openFicha();
    await assign(user);
    expect((await screen.findByTestId("asignar-error")).textContent).toMatch(/ya (est[aá]|esta) asignad/i);
    expect(screen.queryByTestId("asignacion-row")).toBeNull();
  });

  it("403: sin permiso lo dice y no cambia la lista", async () => {
    postStatus = 403; assigned = false;
    const { user } = await openFicha();
    await assign(user);
    expect((await screen.findByTestId("asignar-error")).textContent).toMatch(/permiso/i);
    expect(screen.queryByTestId("asignacion-row")).toBeNull();
  });

  it("404: contacto o propiedad inexistente (incluye otro tenant) se informa como no encontrado", async () => {
    postStatus = 404; assigned = false;
    const { user } = await openFicha();
    await assign(user);
    expect((await screen.findByTestId("asignar-error")).textContent).toMatch(/no (se )?encontr/i);
  });

  it("422: datos inválidos se informan como validación", async () => {
    postStatus = 422; assigned = false;
    const { user } = await openFicha();
    await assign(user);
    expect((await screen.findByTestId("asignar-error")).textContent).toMatch(/inv[aá]lid/i);
  });

  it("retiro rechazado (403) deja la fila y muestra error", async () => {
    deleteStatus = 403;
    const { user } = await openFicha();
    await user.click(await screen.findByTestId("asignacion-retirar"));
    expect((await screen.findByTestId("asignar-error")).textContent).toMatch(/permiso/i);
    expect(screen.getAllByTestId("asignacion-row")).toHaveLength(1);
  });

  it("positivo: lista los asignados, asigna con solo property_id y retira", async () => {
    assigned = false;
    const { user, section } = await openFicha();
    await waitFor(() => expect(within(section).queryByTestId("asignacion-row")).toBeNull());
    await assign(user);
    const row = await screen.findByTestId("asignacion-row");
    expect(row.textContent).toContain("Ana P.");
    const post = calls.find((c) => c.method === "POST");
    expect(post?.path).toBe(`${BASE}/contacts/${CID}/properties`);
    expect(JSON.parse(post?.body ?? "{}")).toEqual({ property_id: PID });
    expect(post?.body).not.toMatch(/tenant/i);
    await user.click(screen.getByTestId("asignacion-retirar"));
    await waitFor(() => expect(screen.queryByTestId("asignacion-row")).toBeNull());
    expect(calls.some((c) => c.method === "DELETE" && c.path === `${BASE}/contacts/${CID}/properties/${AID}`)).toBe(true);
  });
});
