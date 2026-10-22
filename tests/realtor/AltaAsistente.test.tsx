jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AltaAsistente } from "@/components/realtor/AltaAsistente";
import { respuesta } from "./fake";

const LIC = "11111111-2222-3333-4444-555555555555";
const json = respuesta;
const PERFIL = { owner_person_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", jurisdiction_code: "DO", default_language: "es", kind: "agent" };

function servidor(acceso: number, resto: (ruta: string) => Promise<Response>) {
  return jest.fn((ruta: string) => (ruta.endsWith("/acceso") ? json({}, acceso) : resto(ruta)));
}

function llenar() {
  fireEvent.change(screen.getByLabelText(/Número de licencia/), { target: { value: LIC } });
  fireEvent.change(screen.getByLabelText("Nombre del agente"), { target: { value: "Ana Prueba" } });
  fireEvent.click(screen.getByText("Siguiente"));
  fireEvent.click(screen.getByText("Siguiente"));
  fireEvent.change(screen.getByLabelText("Nombre de tu marca"), { target: { value: "Casa Ana" } });
  fireEvent.change(screen.getByLabelText(/Dirección pública/), { target: { value: "casa-ana" } });
}

describe("AltaAsistente", () => {
  it("negativo: interruptor apagado no pinta nada ni consulta el acceso", () => {
    const f = servidor(200, () => json({}));
    const { container } = render(<AltaAsistente enviar={f} encendido={false} demo={false} />);
    expect(container).toBeEmptyDOMElement();
    expect(f).not.toHaveBeenCalled();
  });

  it("negativo: sin 200 de acceso no se muestra el panel", async () => {
    const f = servidor(403, () => json({}));
    const { container } = render(<AltaAsistente enviar={f} encendido demo={false} />);
    await waitFor(() => expect(f).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("positivo: con acceso 200 completa el alta y la agenda sale UNAVAILABLE", async () => {
    const f = servidor(200, (r) => {
      if (r.endsWith("/tenant/profile")) return json(PERFIL);
      if (r.includes("/agents?")) return json({ items: [] });
      if (r.endsWith("/agents")) return json({ id: "ag-1" }, 201);
      if (r.endsWith("/licenses")) return json({ id: LIC, status: "pending_verification" }, 201);
      if (r.endsWith("/license")) return json({});
      if (r.endsWith("/brands")) return json({ id: "br-1" }, 201);
      return json({ checks: [{ check: "license_verified", passed: false }] });
    });
    render(<AltaAsistente enviar={f} encendido demo={false} />);
    await screen.findByTestId("realtor-alta");
    expect(screen.queryByTestId("badge-demo")).toBeNull();
    llenar();
    fireEvent.click(screen.getByText("Enviar alta"));
    expect(await screen.findByTestId("agenda-unavailable")).toHaveTextContent("UNAVAILABLE");
    expect(screen.getByText(/Licencia verificada: Pendiente/)).toBeInTheDocument();
  });

  it("DEMO: rotulado, sin red y con textos en ingles al conmutar", async () => {
    const f = servidor(200, () => json({}, 500));
    render(<AltaAsistente enviar={f} encendido demo />);
    await screen.findByTestId("badge-demo");
    fireEvent.click(screen.getByLabelText("Idioma / Language"));
    expect(screen.getByText("Agent onboarding")).toBeInTheDocument();
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("DEMO por NEXT_PUBLIC_REALTOR_ALLOW_DEMO=1 sin prop: badge y ninguna llamada a /alta/*", async () => {
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    try {
      const f = servidor(200, () => json({}, 500));
      render(<AltaAsistente enviar={f} encendido />);
      await screen.findByTestId("badge-demo");
      expect(f.mock.calls.every(([r]) => String(r).endsWith("/acceso"))).toBe(true);
    } finally {
      delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
    }
  });

  it("NEXT_PUBLIC_REALTOR_DEMO=1 solo no activa DEMO", async () => {
    process.env.NEXT_PUBLIC_REALTOR_DEMO = "1";
    try {
      const f = servidor(200, (r) => json(r.endsWith("/tenant/profile") ? PERFIL : {}));
      render(<AltaAsistente enviar={f} encendido />);
      await screen.findByTestId("realtor-alta");
      expect(screen.queryByTestId("badge-demo")).toBeNull();
    } finally {
      delete process.env.NEXT_PUBLIC_REALTOR_DEMO;
    }
  });

  it("tenant ajeno: 404 del servidor muestra error generico y ningun dato ni tenant enviado", async () => {
    const enviados: string[] = [];
    const f = jest.fn((ruta: string, init?: RequestInit) => {
      enviados.push(ruta + JSON.stringify(init ?? {}));
      if (ruta.endsWith("/acceso")) return json({}, 200);
      if (ruta.endsWith("/tenant/profile")) return json(PERFIL);
      return json({ code: "NOT_FOUND" }, 404);
    });
    render(<AltaAsistente enviar={f} encendido demo={false} />);
    await screen.findByTestId("realtor-alta");
    await waitFor(() => expect(f).toHaveBeenCalledTimes(2));
    llenar();
    fireEvent.click(screen.getByText("Enviar alta"));
    expect(await screen.findByTestId("alta-error")).toBeInTheDocument();
    expect(screen.queryByTestId("agenda-unavailable")).toBeNull();
    expect(enviados.join("")).not.toMatch(/tenant_id|x-tenant/i);
  });

  it("kind=agent: el paso de firma no ofrece crear un broker (C-RE-ALTA)", async () => {
    const f = servidor(200, (r) => (r.endsWith("/tenant/profile") ? json(PERFIL) : json({})));
    render(<AltaAsistente enviar={f} encendido demo={false} />);
    await screen.findByTestId("realtor-alta");
    fireEvent.change(screen.getByLabelText(/Número de licencia/), { target: { value: LIC } });
    fireEvent.change(screen.getByLabelText("Nombre del agente"), { target: { value: "Ana Prueba" } });
    fireEvent.click(screen.getByText("Siguiente"));
    await screen.findByTestId("alta-sin-firma");
    expect(screen.queryByLabelText("Razón social del broker")).toBeNull();
  });

  it("kind=brokerage: pide la firma y no envía el alta sin ella", async () => {
    const f = servidor(200, (r) => (r.endsWith("/tenant/profile") ? json({ ...PERFIL, kind: "brokerage" }) : json({ id: "x" }, 201)));
    render(<AltaAsistente enviar={f} encendido demo={false} />);
    await screen.findByTestId("realtor-alta");
    fireEvent.change(screen.getByLabelText(/Número de licencia/), { target: { value: LIC } });
    fireEvent.change(screen.getByLabelText("Nombre del agente"), { target: { value: "Ana Prueba" } });
    fireEvent.click(screen.getByText("Siguiente"));
    expect(await screen.findByLabelText("Razón social del broker")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Siguiente"));
    fireEvent.change(screen.getByLabelText("Nombre de tu marca"), { target: { value: "Casa Ana" } });
    fireEvent.change(screen.getByLabelText(/Dirección pública/), { target: { value: "casa-ana" } });
    fireEvent.click(screen.getByText("Enviar alta"));
    await waitFor(() => expect(f.mock.calls.some(([r]) => String(r).endsWith("/brokerage"))).toBe(false));
    expect(f.mock.calls.some(([r]) => String(r).endsWith("/agents"))).toBe(false);
  });
});
