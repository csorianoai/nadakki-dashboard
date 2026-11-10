/**
 * El backend no tiene rutas para /decision, /transiciones, /evidencias,
 * /versiones/comparar ni /replay del modelo de casos (404). La interfaz no
 * debe ofrecer acciones que las invoquen.
 */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "EXP-1" }),
}));
jest.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({ tenantId: "t1" }),
}));
jest.mock("@/lib/api/sic", () => ({
  ...jest.requireActual("@/lib/api/sic"),
  fetchExpediente: jest.fn(),
  fetchTimeline: jest.fn(),
  fetchNotas: jest.fn(),
  crearNota: jest.fn(),
  fetchVersiones: jest.fn(),
  fetchAuditoria: jest.fn(),
  fetchPermisos: jest.fn(),
  fetchEvidencia: jest.fn(),
  fetchDocumentos: jest.fn(),
  compararVersiones: jest.fn(),
  enviarOverride: jest.fn(),
  cambiarEstado: jest.fn(),
  generarExportacionPDF: jest.fn(),
  generarExportacionZIP: jest.fn(),
  fetchReplay: jest.fn(),
  fetchTimelineReplay: jest.fn(),
}));

import * as sic from "@/lib/api/sic";
import ExpedientePage from "@/app/sic/expedientes/[id]/page";
import ReplayPage from "@/app/sic/expedientes/[id]/replay/page";

const m = sic as unknown as Record<string, jest.Mock>;

beforeEach(() => {
  jest.clearAllMocks();
  m.fetchExpediente.mockResolvedValue({
    expediente_id: "EXP-1",
    estado_expediente: "RECIBIDO",
    decision_actual: "APROBAR",
    decision_final_humana: null,
  });
  m.fetchTimeline.mockResolvedValue([]);
  m.fetchNotas.mockResolvedValue([]);
  m.fetchVersiones.mockResolvedValue([{ version: "v1" }, { version: "v2" }]);
  m.fetchAuditoria.mockResolvedValue([
    { evento_id: "a1", tipo_evento: "CREADO", detalle: "x", evidencia_id: "ev1" },
  ]);
  m.fetchPermisos.mockResolvedValue({
    rol: "analista",
    puede_override: true,
    puede_cambiar_estado: true,
    puede_exportar: true,
    puede_ver_auditoria: true,
    puede_abrir_comparador: true,
    transiciones_disponibles: ["EN_VALIDACION"],
  });
  m.fetchDocumentos.mockResolvedValue([]);
  m.crearNota.mockResolvedValue({});
  m.generarExportacionPDF.mockResolvedValue({});
});

async function cargarPagina() {
  const r = render(<ExpedientePage />);
  await waitFor(() => expect(screen.getByText("EXP-1")).toBeTruthy());
  return r;
}

describe("expediente SIC sin acciones sin ruta", () => {
  test("no hay enlace a replay", async () => {
    const { container } = await cargarPagina();
    expect(container.querySelector('a[href$="/replay"]')).toBeNull();
    expect(screen.queryByText("Replay")).toBeNull();
  });

  test("no hay transicion de estado", async () => {
    await cargarPagina();
    expect(screen.queryByText("Transicionar")).toBeNull();
    expect(screen.queryByText("Cambiar a…")).toBeNull();
  });

  test("no hay formulario de override aunque el permiso lo diga", async () => {
    await cargarPagina();
    expect(screen.queryByText(/Justificación/i)).toBeNull();
    expect(screen.queryByText("Seleccionar…")).toBeNull();
  });

  test("el comparador de versiones muestra No disponible todavia", async () => {
    await cargarPagina();
    expect(screen.getAllByText(/No disponible todavía/i).length).toBeGreaterThan(0);
  });

  test("la auditoria no ofrece abrir evidencia", async () => {
    await cargarPagina();
    expect(screen.getByText(/CREADO/)).toBeTruthy();
    expect(screen.queryByText("[evidencia]")).toBeNull();
    expect(screen.queryByRole("button", { name: /CREADO/ })).toBeNull();
  });

  test("ninguna funcion sin ruta se invoca al cargar", async () => {
    await cargarPagina();
    expect(m.cambiarEstado).not.toHaveBeenCalled();
    expect(m.enviarOverride).not.toHaveBeenCalled();
    expect(m.compararVersiones).not.toHaveBeenCalled();
    expect(m.fetchEvidencia).not.toHaveBeenCalled();
    expect(m.fetchVersiones).not.toHaveBeenCalled();
  });

  test("lo que si tiene ruta sigue funcionando: notas, PDF y decision", async () => {
    await cargarPagina();
    expect(screen.getAllByText(/Decisión IA/).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByPlaceholderText("Nueva nota…"), { target: { value: "hola" } });
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => expect(m.crearNota).toHaveBeenCalledWith("EXP-1", "t1", "hola"));
    fireEvent.click(screen.getByText("PDF ejecutivo"));
    await waitFor(() => expect(m.generarExportacionPDF).toHaveBeenCalled());
  });
});

describe("pagina replay", () => {
  test("muestra No disponible todavia y no llama al backend", async () => {
    render(<ReplayPage />);
    expect(await screen.findByText(/No disponible todavía/i)).toBeTruthy();
    expect(m.fetchReplay).not.toHaveBeenCalled();
    expect(m.fetchExpediente).not.toHaveBeenCalled();
  });
});
