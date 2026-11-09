import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
import { apiFetch } from "@/lib/api/fetch-client";
import { Violaciones } from "@/components/sites/publicar/Violaciones";
import { Historial } from "@/components/sites/publicar/Historial";
import { resp, SITE_A } from "./fake";

const f = apiFetch as jest.Mock;
const problem = (status: number, code: string) => resp({ type: "x", title: "t", status, code }, status, "application/problem+json");
const V = [
  { rule_id: "RULE-B", severity: "block", message: "Falta el aviso legal", field: "pages[contact].body[2]" },
  { rule_id: "RULE-W", severity: "warn", message: "Descripción muy corta", field: "listings[casa]" },
  { rule_id: "RULE-I", severity: "info", message: "Puede agregar fotos", field: "media[1]" },
] as never;
const futuro = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); };
const ui = (demo = false) => <Violaciones items={V} siteId={SITE_A} lang="es" demo={demo} paginas={{ contact: "p1" }} testid="l" />;

beforeEach(() => f.mockReset());

describe("Violaciones", () => {
  test("pinta las 3 con severidad en texto, mensaje, regla y campo; enlace solo si resuelve (positivo)", () => {
    render(ui());
    const filas = screen.getAllByTestId("violacion");
    expect(filas).toHaveLength(3);
    expect(filas[0].textContent).toMatch(/Bloquea.*Falta el aviso legal.*RULE-B.*pages\[contact\]\.body\[2\]/);
    expect(filas[1].textContent).toMatch(/Aviso/);
    expect(filas[2].textContent).toMatch(/Información/);
    expect((screen.getByTestId("v-enlace") as HTMLAnchorElement).getAttribute("href")).toBe(`/mi-web/paginas?sitio=${SITE_A}&pagina=p1`);
    expect(screen.getAllByTestId("v-campo")).toHaveLength(2);
  });

  test("block e info no tienen boton; el warn exige justificacion y fecha futura (negativo)", () => {
    render(ui());
    const filas = screen.getAllByTestId("violacion");
    expect(within(filas[0]).queryByRole("button")).toBeNull();
    expect(within(filas[2]).queryByRole("button")).toBeNull();
    fireEvent.click(within(filas[1]).getByRole("button", { name: "Aceptar este aviso" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aceptación" }));
    expect(screen.getByTestId("error-override").textContent).toMatch(/justificación/);
    fireEvent.change(screen.getByLabelText(/Justificación/), { target: { value: "x" } });
    fireEvent.change(screen.getByLabelText(/Vale hasta/), { target: { value: "2020-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aceptación" }));
    expect(screen.getByTestId("error-override").getAttribute("role")).toBe("alert");
    expect(f).not.toHaveBeenCalled();
  });

  test("con ambos datos llama createOverride sin tenant_id; el 422 OVERRIDE_NOT_ALLOWED se pinta en llano", async () => {
    f.mockResolvedValueOnce(problem(422, "OVERRIDE_NOT_ALLOWED"));
    render(ui());
    fireEvent.click(screen.getByRole("button", { name: "Aceptar este aviso" }));
    fireEvent.change(screen.getByLabelText(/Justificación/), { target: { value: "Lo corregiremos" } });
    fireEvent.change(screen.getByLabelText(/Vale hasta/), { target: { value: futuro() } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aceptación" }));
    expect((await screen.findByTestId("error-override")).textContent).toMatch(/solo los avisos pueden aceptarse/);
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe(`/api/v1/sites/sites/${SITE_A}/overrides`);
    expect(JSON.parse(init.body)).toEqual({ rule_id: "RULE-W", justification: "Lo corregiremos", expires_at: `${futuro()}T23:59:59Z` });
  });

  test("en DEMO aceptar un aviso es simulacro: 0 llamadas", () => {
    render(ui(true));
    fireEvent.click(screen.getByRole("button", { name: "Aceptar este aviso" }));
    fireEvent.change(screen.getByLabelText(/Justificación/), { target: { value: "x" } });
    fireEvent.change(screen.getByLabelText(/Vale hasta/), { target: { value: futuro() } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aceptación" }));
    expect(screen.getByTestId("aviso-aceptado")).toBeTruthy();
    expect(f).not.toHaveBeenCalled();
  });
});

describe("Historial", () => {
  const ev = (id: string, result: string) => ({ id, site_id: SITE_A, trigger: "publish", result, findings: [], created_at: "2026-10-01T10:00:00Z" });
  test("solo lectura con pass/warn/block (positivo)", async () => {
    f.mockResolvedValue(resp({ items: [ev("1", "pass"), ev("2", "warn"), ev("3", "block")], next_cursor: null }));
    render(<Historial siteId={SITE_A} lang="es" demo={false} version={0} />);
    const filas = await screen.findAllByTestId("evaluacion");
    expect(filas.map((x) => x.getAttribute("data-result"))).toEqual(["pass", "warn", "block"]);
    expect(filas[2].textContent).toMatch(/Bloqueado/);
    expect(screen.queryByRole("button")).toBeNull();
  });
  test("404 NOT_FOUND de otro tenant: error, sin filas (negativo/ajeno)", async () => {
    f.mockResolvedValue(problem(404, "NOT_FOUND"));
    render(<Historial siteId={SITE_A} lang="es" demo={false} version={0} />);
    expect((await screen.findByRole("alert")).textContent).toMatch(/No pudimos cargar/);
    expect(screen.queryByTestId("evaluacion")).toBeNull();
  });
  test("DEMO: sin llamadas", () => {
    render(<Historial siteId={SITE_A} lang="es" demo version={0} />);
    expect(f).not.toHaveBeenCalled();
  });
});
