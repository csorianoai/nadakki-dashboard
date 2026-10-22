jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AltaAsistente } from "@/components/realtor/AltaAsistente";
import { LicenciaVerificar } from "@/components/realtor/LicenciaVerificar";
import { respuesta } from "./fake";

const PERSONA = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const PERFIL = { owner_person_id: PERSONA, jurisdiction_code: "US-FL", default_language: "es", kind: "agent" };
const CHECKS = (verificada: boolean) => ({
  checks: [
    { check: "tenant_active", passed: true },
    { check: "license_linked", passed: true },
    { check: "license_verified", passed: verificada },
  ],
});

describe("LicenciaVerificar", () => {
  it("no verifica sin confirmar: el boton solo abre la confirmacion", () => {
    const f = jest.fn(() => respuesta({ id: "L1", status: "verified" }));
    render(<LicenciaVerificar licenciaId="L1" estado="pending_verification" idioma="es" enviar={f} />);
    expect(screen.getByTestId("licencia-estado")).toHaveTextContent("Pendiente de verificación");
    fireEvent.click(screen.getByText("Verificar licencia"));
    expect(f).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancelar"));
    expect(f).not.toHaveBeenCalled();
  });

  it("confirmar llama PUT /licenses/{id}/verification con outcome=verified y avisa", async () => {
    const f = jest.fn(() => respuesta({ id: "L1", status: "verified" }));
    const alVerificar = jest.fn();
    render(<LicenciaVerificar licenciaId="L1" estado="pending_verification" idioma="es" enviar={f} alVerificar={alVerificar} />);
    fireEvent.click(screen.getByText("Verificar licencia"));
    fireEvent.click(screen.getByText("Confirmar"));
    await waitFor(() => expect(alVerificar).toHaveBeenCalled());
    const [ruta, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(ruta).toMatch(/\/licenses\/L1\/verification$/);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({ outcome: "verified" });
    expect(screen.getByTestId("licencia-estado")).toHaveTextContent("Verificada");
  });

  it.each([[403, /permiso/], [404, /No encontramos/], [409, /Ya existe/], [422, /no es válido/]])("estado %i muestra su mensaje propio", async (estado, texto) => {
    const f = jest.fn(() => respuesta({}, estado as number));
    render(<LicenciaVerificar licenciaId="L1" estado="pending_verification" idioma="es" enviar={f} />);
    fireEvent.click(screen.getByText("Verificar licencia"));
    fireEvent.click(screen.getByText("Confirmar"));
    expect(await screen.findByRole("alert")).toHaveTextContent(texto as RegExp);
    expect(screen.getByTestId("licencia-estado")).toHaveTextContent("Pendiente de verificación");
  });
});

describe("AltaAsistente + licencia", () => {
  function servidor(extra: Partial<Record<string, () => Promise<Response>>> = {}) {
    return jest.fn((ruta: string, init?: RequestInit) => {
      const m = init?.method ?? "GET";
      const k = `${m} ${ruta.replace("/api/v1/realestate/alta", "").split("?")[0]}`;
      if (extra[k]) return extra[k]!();
      if (ruta.endsWith("/acceso")) return respuesta({});
      if (k === "GET /tenant/profile") return respuesta(PERFIL);
      if (k === "GET /agents") return respuesta({ items: [{ id: "AG1", person_id: PERSONA, license_id: null }], next_cursor: null });
      if (k === "POST /licenses") return respuesta({ id: "LIC1", status: "pending_verification" }, 201);
      if (k === "PUT /agents/AG1/license") return respuesta({});
      if (k === "POST /brands") return respuesta({ id: "B1" }, 201);
      if (k === "GET /agents/AG1/readiness") return respuesta(CHECKS(false));
      if (k === "PUT /licenses/LIC1/verification") return respuesta({ id: "LIC1", status: "verified" });
      return respuesta({}, 500);
    });
  }
  async function llegarAlFinal(f: jest.Mock) {
    render(<AltaAsistente enviar={f} encendido demo={false} />);
    await waitFor(() => expect(f).toHaveBeenCalledWith(expect.stringContaining("/tenant/profile"), expect.anything()));
    await screen.findByLabelText(/Número de licencia/);
    fireEvent.change(screen.getByLabelText(/Número de licencia/), { target: { value: "SL3456789" } });
    fireEvent.change(screen.getByLabelText("Nombre del agente"), { target: { value: "Ana Prueba" } });
    fireEvent.click(screen.getByText("Siguiente"));
    fireEvent.click(screen.getByText("Siguiente"));
    fireEvent.change(screen.getByLabelText("Nombre de tu marca"), { target: { value: "Casa Ana" } });
    fireEvent.change(screen.getByLabelText(/Dirección pública/), { target: { value: "casa-ana" } });
    fireEvent.click(screen.getByText("Enviar alta"));
  }

  it("tras el alta ofrece verificar la licencia pendiente y refresca el readiness", async () => {
    let verificada = false;
    const f = servidor({
      "GET /agents/AG1/readiness": () => respuesta(CHECKS(verificada)),
      "PUT /licenses/LIC1/verification": () => { verificada = true; return respuesta({ id: "LIC1", status: "verified" }); },
    });
    await llegarAlFinal(f);
    expect(await screen.findByTestId("licencia-estado")).toHaveTextContent("Pendiente de verificación");
    expect(screen.getByText(/Licencia verificada: Pendiente/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Verificar licencia"));
    fireEvent.click(screen.getByText("Confirmar"));
    expect(await screen.findByText(/Licencia verificada: Listo/)).toBeInTheDocument();
  });

  it.each([[403, /permiso/], [404, /No encontramos/], [409, /Ya existe/], [422, /no es válido/]])("el alta que falla con %i muestra su mensaje", async (estado, texto) => {
    const f = servidor({ "POST /brands": () => respuesta({}, estado as number) });
    await llegarAlFinal(f);
    expect(await screen.findByTestId("alta-error")).toHaveTextContent(texto as RegExp);
  });

  it("sin acceso: aviso visible (nunca pagina en blanco) y ningun formulario", async () => {
    const f = servidor({ "GET /acceso": () => respuesta({}, 403) });
    const { container } = render(<AltaAsistente enviar={f} encendido demo={false} />);
    expect(await screen.findByTestId("alta-sin-acceso")).toBeInTheDocument();
    expect(container).not.toBeEmptyDOMElement();
    expect(screen.queryByLabelText(/Número de licencia/)).toBeNull();
  });
});
