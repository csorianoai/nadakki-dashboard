jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { render, screen, waitFor } from "@testing-library/react";
import { AdminRealEstate } from "@/components/admin/real-estate/AdminRealEstate";
import { cargarConfiguracion } from "@/lib/admin/real-estate";
import { respuesta } from "../realtor/fake";

const ruteo = (acceso: number, roles: unknown, perfil = 200) => (ruta: string) =>
  ruta.endsWith("/acceso")
    ? respuesta({ roles }, acceso)
    : respuesta({ jurisdiction_code: "US-FL" }, perfil);

describe("Admin Real Estate (fail-closed, solo lectura)", () => {
  it("con acceso y rol admin muestra enlaces, jurisdiccion y roles", async () => {
    render(<AdminRealEstate encendido demo={false} enviar={ruteo(200, ["tenant_admin"])} />);
    await screen.findByTestId("admin-real-estate");
    expect(screen.getByTestId("tarjeta-alta")).toHaveAttribute("href", "/realtor/alta");
    expect(screen.getByTestId("tarjeta-web")).toHaveAttribute("href", "/realtor/agente-web");
    expect(screen.getByText("US-FL")).toBeInTheDocument();
    expect(screen.getByTestId("estado-solo-lectura")).toBeInTheDocument();
  });
  it("sin perfil: 'Sin datos todavia'; con DEMO, rotulado", async () => {
    const { unmount } = render(<AdminRealEstate encendido demo={false} enviar={ruteo(200, ["admin"], 404)} />);
    expect(await screen.findByTestId("sin-datos")).toHaveTextContent("Sin datos todavía");
    unmount();
    render(<AdminRealEstate encendido demo enviar={ruteo(200, ["admin"], 503)} />);
    expect(await screen.findByTestId("badge-demo")).toHaveTextContent("DEMO · datos sintéticos");
  });
  it.each([401, 403, 404, 500])("acceso %s: no se pinta nada", async (s) => {
    const { container } = render(<AdminRealEstate encendido demo={false} enviar={ruteo(s, ["admin"])} />);
    await new Promise((r) => setTimeout(r, 20));
    expect(container).toBeEmptyDOMElement();
  });
  it("200 sin rol legible o sin rol admin: denegado", async () => {
    expect(await cargarConfiguracion(ruteo(200, undefined))).toEqual({ acceso: false });
    expect(await cargarConfiguracion(ruteo(200, ["viewer"]))).toEqual({ acceso: false });
    expect(await cargarConfiguracion(() => Promise.reject(new Error("net")))).toEqual({ acceso: false });
  });
  it("interruptor apagado: nada", async () => {
    const { container } = render(<AdminRealEstate encendido={false} enviar={ruteo(200, ["admin"])} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
