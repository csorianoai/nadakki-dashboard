/**
 * F4D-6 PARTE 2/2: telefono, email y direccion como puntos de contacto (/points de F4D-2). Se envian, se pintan tal
 * como llegan (enmascarados salvo rol autorizado), al editar lo enmascarado arranca vacio y solo viaja lo escrito.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { apiFetch } from "@/lib/api/fetch-client";
import { ContactoForm } from "@/app/autos/dealer/contactos/ContactoForm";
import { ContactosPantalla } from "@/app/autos/dealer/contactos/ContactosPantalla";
import type { Contacto, Punto } from "@/app/autos/dealer/contactos/contactos-tipos";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const apiFetchMock = apiFetch as jest.Mock;

const base: Contacto = {
  id: "c-1", kind: "fisica", display_name: "Perez, Juan", first_name: "Juan", last_name: "Perez", business_name: null,
  dni: "*****567", cuit: null, iva_condition: "consumidor_final", iibb_number: null, marital_status: "soltero",
  spouse_first_name: null, spouse_last_name: null, spouse_dni: null, deactivated_at: null, deactivation_reason: null,
  created_at: null, updated_at: null,
};
const ptTel: Punto = { id: "p-1", contact_id: "c-1", type: "phone", value: "*******234", street: null, locality: null, province: null, postal_code: null, is_primary: true, deactivated_at: null, created_at: null };
const ptMail: Punto = { ...ptTel, id: "p-2", type: "email", value: "j***@***.com" };
const ptDir: Punto = { ...ptTel, id: "p-3", type: "address", value: null, street: "Mitre 100", locality: "Rosario", province: "Santa Fe", postal_code: "2000" };

const ok = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
type Ruta = Record<string, (url: string, init?: RequestInit) => unknown>;
function servidor(rutas: Ruta, fallos: Record<string, number> = {}) {
  apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const clave = `${init?.method ?? "GET"} ${String(url).split("?")[0]}`;
    if (fallos[clave]) return ok({ detail: { reason_code: "CONTACT_INVALID", field: "value", error: "valor no valido" } }, fallos[clave]);
    const h = rutas[clave];
    return h ? ok(h(url, init)) : ok({ detail: { reason_code: `SIN_RUTA ${clave}` } }, 500);
  });
}
const llamadas = (metodo: string, ruta: string) =>
  apiFetchMock.mock.calls.filter(([u, i]) => `${i?.method ?? "GET"} ${String(u).split("?")[0]}` === `${metodo} ${ruta}`);
const cuerpo = (c: unknown[]) => JSON.parse((c[1] as RequestInit).body as string);
const llenar = (re: RegExp, v: string) => fireEvent.change(screen.getByLabelText(re), { target: { value: v } });
function datosMinimos() {
  llenar(/^nombre$/i, "Juan");
  llenar(/^apellido$/i, "Perez");
  llenar(/^DNI$/i, "12345678");
  llenar(/condici[oó]n de iva/i, "consumidor_final");
}

beforeEach(() => apiFetchMock.mockReset());

describe("formulario: puntos de contacto", () => {
  it("ya no hay campos deshabilitados ni el aviso 'Todavia no se guardan'", () => {
    render(<ContactoForm onSubmit={jest.fn()} />);
    expect(screen.queryByText(/todav[ií]a no se guardan/i)).toBeNull();
    for (const l of [/^tel[eé]fono$/i, /^celular$/i, /^email$/i, /^calle$/i, /^localidad$/i, /^provincia$/i, /c[oó]digo postal/i]) {
      expect((screen.getByLabelText(l) as HTMLInputElement).disabled).toBe(false);
    }
  });

  it("alta con telefono, email y direccion los entrega como puntos", () => {
    const onSubmit = jest.fn();
    render(<ContactoForm onSubmit={onSubmit} />);
    datosMinimos();
    llenar(/^tel[eé]fono$/i, "+54 341 555-1234");
    llenar(/^email$/i, "juan@mail.com");
    llenar(/^calle$/i, "Mitre 100");
    llenar(/^localidad$/i, "Rosario");
    llenar(/^provincia$/i, "Santa Fe");
    llenar(/c[oó]digo postal/i, "2000");
    fireEvent.click(screen.getByRole("button", { name: /^guardar$/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][1]).toEqual([
      { type: "phone", value: "+54 341 555-1234" },
      { type: "email", value: "juan@mail.com" },
      { type: "address", street: "Mitre 100", locality: "Rosario", province: "Santa Fe", postal_code: "2000" },
    ]);
  });

  it("valida la forma del email y del telefono sin enviar", () => {
    const onSubmit = jest.fn();
    render(<ContactoForm onSubmit={onSubmit} />);
    datosMinimos();
    llenar(/^tel[eé]fono$/i, "12ab");
    llenar(/^email$/i, "sin-arroba");
    fireEvent.click(screen.getByRole("button", { name: /^guardar$/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^tel[eé]fono$/i).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText(/^email$/i).getAttribute("aria-invalid")).toBe("true");
    llenar(/^email$/i, "juan@mail.com");
    expect(screen.getByLabelText(/^email$/i).getAttribute("aria-invalid")).toBeNull();
  });

  it("la direccion incompleta no se envia", () => {
    const onSubmit = jest.fn();
    render(<ContactoForm onSubmit={onSubmit} />);
    datosMinimos();
    llenar(/^calle$/i, "Mitre 100");
    fireEvent.click(screen.getByRole("button", { name: /^guardar$/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^localidad$/i).getAttribute("aria-invalid")).toBe("true");
  });

  it("al editar lo enmascarado arranca vacio y no se reenvia la mascara", () => {
    const onSubmit = jest.fn();
    render(<ContactoForm inicial={base} puntos={[ptTel, ptMail, ptDir]} onSubmit={onSubmit} />);
    expect((screen.getByLabelText(/^tel[eé]fono$/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/^email$/i) as HTMLInputElement).value).toBe("");
    expect(screen.getByText(/Guardado: \*{7}234/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^guardar$/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][1]).toEqual([]);
  });

  it("al editar solo viaja lo escrito, con el id del punto existente", () => {
    const onSubmit = jest.fn();
    render(<ContactoForm inicial={base} puntos={[ptTel, ptMail]} onSubmit={onSubmit} />);
    llenar(/^email$/i, "nuevo@mail.com");
    fireEvent.click(screen.getByRole("button", { name: /^guardar$/i }));
    expect(onSubmit.mock.calls[0][1]).toEqual([{ type: "email", value: "nuevo@mail.com", id: "p-2" }]);
  });
});

describe("pantalla: puntos", () => {
  it("el alta envia el contacto y luego sus puntos, y la ficha los pinta como llegan", async () => {
    servidor({
      "GET /api/v1/autos/contacts": () => ({ items: [] }),
      "POST /api/v1/autos/contacts": () => base,
      "POST /api/v1/autos/contacts/c-1/points": () => ptTel,
      "GET /api/v1/autos/contacts/c-1": () => base,
      "GET /api/v1/autos/contacts/c-1/points": () => ({ items: [ptTel, ptMail, ptDir] }),
    });
    render(<ContactosPantalla />);
    fireEvent.click(await screen.findByRole("button", { name: /nuevo contacto/i }));
    datosMinimos();
    llenar(/^tel[eé]fono$/i, "3415551234");
    llenar(/^email$/i, "juan@mail.com");
    fireEvent.click(screen.getByRole("button", { name: /^guardar$/i }));
    expect(await screen.findByText("*******234")).toBeTruthy();
    expect(screen.getByText("j***@***.com")).toBeTruthy();
    expect(screen.getByText(/Mitre 100/)).toBeTruthy();
    const pts = llamadas("POST", "/api/v1/autos/contacts/c-1/points").map(cuerpo);
    expect(pts).toEqual([{ type: "phone", value: "3415551234" }, { type: "email", value: "juan@mail.com" }]);
    expect(llamadas("POST", "/api/v1/autos/contacts")).toHaveLength(1);
    expect(llamadas("DELETE", "/api/v1/autos/contacts/c-1/points")).toHaveLength(0);
  });

  it("alta parcial: si el punto falla se abre la ficha, se avisa y no se reenvia el alta", async () => {
    servidor(
      {
        "GET /api/v1/autos/contacts": () => ({ items: [] }),
        "POST /api/v1/autos/contacts": () => base,
        "GET /api/v1/autos/contacts/c-1": () => base,
        "GET /api/v1/autos/contacts/c-1/points": () => ({ items: [] }),
      },
      { "POST /api/v1/autos/contacts/c-1/points": 422 },
    );
    render(<ContactosPantalla />);
    fireEvent.click(await screen.findByRole("button", { name: /nuevo contacto/i }));
    datosMinimos();
    llenar(/^tel[eé]fono$/i, "3415551234");
    fireEvent.click(screen.getByRole("button", { name: /^guardar$/i }));
    expect(await screen.findByRole("region", { name: /ficha de/i })).toBeTruthy();
    expect((await screen.findByRole("alert")).textContent).toMatch(/contacto se guard/i);
    await waitFor(() => expect(llamadas("POST", "/api/v1/autos/contacts")).toHaveLength(1));
  });

  it("al editar se envia PATCH al punto existente solo si se escribio", async () => {
    servidor({
      "GET /api/v1/autos/contacts": () => ({ items: [base] }),
      "GET /api/v1/autos/contacts/c-1": () => base,
      "GET /api/v1/autos/contacts/c-1/points": () => ({ items: [ptTel] }),
      "PATCH /api/v1/autos/contacts/c-1": () => base,
      "PATCH /api/v1/autos/contacts/c-1/points/p-1": () => ptTel,
    });
    render(<ContactosPantalla />);
    fireEvent.click(await screen.findByRole("button", { name: /Perez, Juan/ }));
    await screen.findByText("*******234");
    fireEvent.click(screen.getByRole("button", { name: /^editar$/i }));
    llenar(/^tel[eé]fono$/i, "3415559999");
    fireEvent.click(screen.getByRole("button", { name: /^guardar$/i }));
    await waitFor(() => expect(llamadas("PATCH", "/api/v1/autos/contacts/c-1/points/p-1")).toHaveLength(1));
    expect(cuerpo(llamadas("PATCH", "/api/v1/autos/contacts/c-1/points/p-1")[0])).toEqual({ value: "3415559999" });
    expect(llamadas("POST", "/api/v1/autos/contacts/c-1/points")).toHaveLength(0);
  });
});
