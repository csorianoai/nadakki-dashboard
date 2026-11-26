import { renderToStaticMarkup } from "react-dom/server";
import { EstudioGenioRevisionNadakki } from "@/components/legal/cases/EstudioGenioRevisionNadakki";
import { errorRevisionNadakki } from "@/lib/legal/cases/estudio-genio-api";
import { LegalApiHttpError } from "@/lib/legal/parse-api-error";
import m from "@/messages/es/legal-estudio-genio.json";

const pedir = async () => ({});
const base = { incluidas: 3, usadas: 0, disponibles: 3, pendiente: false, solicitudes: [] };

describe("Estudio Genio: revisión por abogado de Nadakki", () => {
  it("los paquetes venden las revisiones incluidas (Esencial 1, Completo 3)", () => {
    expect(m.packages.esencial).toContain("1 revisión de un abogado de Nadakki");
    expect(m.packages.completo).toContain("3 revisiones de un abogado de Nadakki");
    expect(m.packages.completo.split(" · ")).toHaveLength(3);
    expect(m.muestra.items.some((t) => t.includes("abogado de Nadakki"))).toBe(true);
  });

  it("muestra cuántas quedan y el botón para pedir", () => {
    const html = renderToStaticMarkup(<EstudioGenioRevisionNadakki revisiones={base} busy={false} onPedir={pedir} />);
    expect(html).toContain("Le quedan 3 de 3");
    expect(html).toContain("Pedir revisión");
  });

  it("con una abierta no deja pedir otra y lo dice", () => {
    const r = { ...base, usadas: 1, disponibles: 2, pendiente: true,
      solicitudes: [{ solicitud_id: "s1", estado: "pendiente" as const, nota: "La vía", solicitada: "2026-11-26T10:00:00Z" }] };
    const html = renderToStaticMarkup(<EstudioGenioRevisionNadakki revisiones={r} busy={false} onPedir={pedir} />);
    expect(html).toContain("Revisión en curso");
    expect(html).not.toContain("Pedir revisión");
  });

  it("agotadas: sin botón, y las respuestas firmadas a la vista", () => {
    const r = { incluidas: 1, usadas: 1, disponibles: 0, pendiente: false, solicitudes: [{
      solicitud_id: "s1", estado: "respondida" as const, decision: "con_correcciones" as const, firmante: "Lic. Ana",
      colegiatura: "77", respondida: "2026-11-27T10:00:00Z", correcciones: [{ tema: "plazo", texto: "Es franco." }] }] };
    const html = renderToStaticMarkup(<EstudioGenioRevisionNadakki revisiones={r} busy={false} onPedir={pedir} />);
    expect(html).toContain("Ya usó las 1 revisiones");
    expect(html).toContain("Aprobado con correcciones · Lic. Ana");
    expect(html).toContain("Plazo: Es franco.");
    expect(html).not.toContain("Pedir revisión");
  });

  it("sin datos del backend no pinta nada", () => {
    expect(renderToStaticMarkup(<EstudioGenioRevisionNadakki busy={false} onPedir={pedir} />)).toBe("");
  });

  it("traduce los rechazos estables", () => {
    const e = new LegalApiHttpError("x", 409, JSON.stringify({ detail: "SIN_REVISIONES_DISPONIBLES" }));
    expect(errorRevisionNadakki(e)).toBe(m.nadakki.errores.SIN_REVISIONES_DISPONIBLES);
  });
});

describe("Cola del abogado de Nadakki", () => {
  const { render, screen, waitFor } = require("@testing-library/react");
  const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
  const api = require("@/lib/legal/cases/estudio-genio-api");
  const { ColaRevisionesNadakki } = require("@/components/legal/cases/estudio-genio/ColaRevisionesNadakki");
  const envolver = (ui: React.ReactNode) =>
    render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);
  afterEach(() => jest.restoreAllMocks());

  it("un despacho cliente (403) no ve nada", async () => {
    jest.spyOn(api, "listRevisionesPendientes").mockRejectedValue(new LegalApiHttpError("x", 403, '{"detail":"SOLO_SUPERADMIN_NADAKKI"}'));
    const { container } = envolver(<ColaRevisionesNadakki tenantId="t" />);
    await waitFor(() => expect(api.listRevisionesPendientes).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(container.textContent).toBe("");
  });

  it("el equipo de Nadakki ve las solicitudes pendientes", async () => {
    jest.spyOn(api, "listRevisionesPendientes").mockResolvedValue([{ solicitud_id: "s1", estudio_id: "e1", case_id: "c1",
      tenant_id: "t2", despacho: "qa", despacho_nombre: "QA Legal Audit", nota: "Mire la vía", solicitada: "2026-11-26T10:00:00Z" }]);
    envolver(<ColaRevisionesNadakki tenantId="t" />);
    expect(await screen.findByText(/QA Legal Audit/)).toBeTruthy();
    expect(screen.getByText(/Mire la vía/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Responder" })).toBeTruthy();
  });
});
