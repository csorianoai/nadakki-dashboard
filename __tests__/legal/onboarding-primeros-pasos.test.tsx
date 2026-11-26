/**
 * Primeros pasos del despacho (motor de onboarding, spec v1 D filas 8 y 9): la tarjeta va en línea en el layout de
 * /legal/* y las pantallas que cambian el avance emiten nadakki:progreso con motivo "legal.<evento>".
 */
import React from "react";
import { readFileSync } from "fs";
import { join } from "path";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch-client";
import { clientePrimerosPasos } from "@/lib/agents/onboarding/primeros-pasos-client";
import { EVENTO_PROGRESO } from "@/lib/agents/onboarding/progreso";
import { AddPartyForm } from "@/components/legal/cases/AddPartyForm";
import { CaseDocumentUploader } from "@/components/legal/cases/CaseDocumentUploader";
import { useGenerateDocument } from "@/hooks/legal/useDocumentGeneration";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { getAccessToken: () => "jwt-prueba", getRefreshToken: () => null },
}));
let ruta = "/legal/cases";
jest.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push: jest.fn() }) }));
jest.mock("geist/font/sans", () => ({ GeistSans: { className: "geist" } }));
const pasa = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
const nada = () => null;
jest.mock("@/components/credit-hub/system/CHTenantGuard", () => ({ CHTenantGuard: pasa }));
jest.mock("@/components/credit-hub/system/CreditHubI18nBootstrap", () => ({ CreditHubI18nBootstrap: nada }));
jest.mock("@/components/legal/DeadlineNotificationBanner", () => ({ DeadlineNotificationBanner: nada }));
jest.mock("@/components/legal/DemoBannerStrong", () => ({ DemoBannerStrong: nada }));
jest.mock("@/components/legal/LegalCoreShell", () => ({ LegalCoreShell: pasa }));
jest.mock("@/components/legal/LegalAvisoInicial", () => ({ LegalAvisoInicial: nada }));
jest.mock("@/app/providers/DisasterModeProvider", () => ({ DisasterModeProvider: pasa, useDisasterLevel: () => "NORMAL" }));
jest.mock("@/components/forge/ui/Toast", () => ({ ForgeToaster: nada }));
jest.mock("@/lib/feature-gating/ModuleGate", () => ({ ModuleGate: pasa }));
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ tenantSlug: "despacho" }) }));

const { LegalLayoutClient } = require("@/app/(forge)/legal/LegalLayoutClient");

const fetchMock = apiFetch as jest.Mock;
const http = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body), json: async () => body }) as Response;
const PASOS = [
  { clave: "abogados", paso: "Tener un usuario para cada abogado del despacho", hecho: true, cantidad: 2, enlace: null, opcional: false },
  { clave: "expediente", paso: "Crear tu primer expediente", hecho: false, cantidad: 0, enlace: "/legal/cases/new", opcional: false },
];
const conPasos = { core: "legal", titulo: "Primeros pasos", completados: 1, total: 5, siguiente: PASOS[1], pasos: PASOS };
const wrap = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

let motivos: string[] = [];
const oir = (e: Event) => motivos.push((e as CustomEvent).detail?.motivo);
beforeEach(() => {
  fetchMock.mockReset();
  window.sessionStorage.clear();
  clientePrimerosPasos("legal").__reiniciar();
  motivos = [];
  window.addEventListener(EVENTO_PROGRESO, oir);
});
afterEach(() => window.removeEventListener(EVENTO_PROGRESO, oir));

describe("tarjeta en el layout de /legal", () => {
  it("en /legal/* se ve en línea, arriba del contenido, con el GET del core legal", async () => {
    ruta = "/legal/cases";
    fetchMock.mockResolvedValue(http(200, conPasos));
    render(<LegalLayoutClient><p>contenido</p></LegalLayoutClient>);
    const tarjeta = await screen.findByRole("region", { name: /primeros pasos/i });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/onboarding/legal/primeros-pasos", { method: "GET" });
    expect(tarjeta).toHaveTextContent("Primeros pasos: 1 de 5");
    expect(tarjeta).toHaveAttribute("data-core", "legal");
    expect(tarjeta.className).not.toMatch(/\b(fixed|absolute|shadow-lg)\b/);
    expect(tarjeta.compareDocumentPosition(screen.getByText("contenido")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("link", { name: /siguiente paso: crear tu primer expediente/i })).toHaveAttribute("href", "/legal/cases/new");
  });

  it("con 404 CORE_NO_ACTIVO no se muestra", async () => {
    ruta = "/legal";
    fetchMock.mockResolvedValue(http(404, { detail: "CORE_NO_ACTIVO" }));
    render(<LegalLayoutClient><p>contenido</p></LegalLayoutClient>);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await act(async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); });
    expect(screen.queryByRole("region", { name: /primeros pasos/i })).toBeNull();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("en la investigación a pantalla completa no se monta", async () => {
    ruta = "/legal/research";
    fetchMock.mockResolvedValue(http(200, conPasos));
    render(<LegalLayoutClient><p>contenido</p></LegalLayoutClient>);
    await act(async () => { await Promise.resolve(); });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: /primeros pasos/i })).toBeNull();
  });
});

describe("las pantallas de Legal avisan progreso", () => {
  it("nuevo expediente: avisa legal.expediente-creado al crearlo", () => {
    const src = readFileSync(join(process.cwd(), "components/legal/cases/CaseCreateWizard.tsx"), "utf8");
    const exito = src.slice(src.indexOf("onSuccess"), src.indexOf("router.push(`/legal/cases/${c.case_id}`)"));
    expect(exito).toContain('avisarProgreso("legal.expediente-creado")');
  });

  it("subir documento: avisa legal.documento-subido solo tras el 201", async () => {
    fetchMock.mockResolvedValueOnce(http(200, { disponible: true, motivo: null, max_mb: 15, tipos: [] }));
    wrap(<CaseDocumentUploader tenantId="t" caseId="c1" onUploaded={jest.fn()} />);
    await userEvent.upload(screen.getByLabelText(/Archivo/), new File(["%PDF-1.7"], "demanda.pdf", { type: "application/pdf" }));
    fetchMock.mockResolvedValueOnce(http(503, { detail: "x" }));
    await userEvent.click(screen.getByRole("button", { name: "Subir documento" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(motivos).toEqual([]);
    fetchMock.mockResolvedValueOnce(http(201, { document_id: "d1" }));
    await userEvent.upload(screen.getByLabelText(/Archivo/), new File(["%PDF-1.7"], "demanda.pdf", { type: "application/pdf" }));
    await userEvent.click(screen.getByRole("button", { name: "Subir documento" }));
    await waitFor(() => expect(motivos).toEqual(["legal.documento-subido"]));
  });

  it("agregar parte: avisa legal.cliente-agregado solo si la parte es cliente", async () => {
    fetchMock.mockResolvedValue(http(201, { actor_id: "a1" }));
    const onDone = jest.fn();
    wrap(<AddPartyForm tenantId="t" caseId="c1" onDone={onDone} onCancel={jest.fn()} />);
    await userEvent.type(screen.getByLabelText(/Nombre completo/), "Contraparte Prueba");
    await userEvent.click(screen.getByRole("button", { name: "Guardar parte" }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(motivos).toEqual([]);
    fireEvent.change(screen.getByLabelText(/Papel procesal/), { target: { value: "cliente" } });
    await userEvent.click(screen.getByRole("button", { name: "Guardar parte" }));
    await waitFor(() => expect(motivos).toEqual(["legal.cliente-agregado"]));
  });

  it("generar escrito con IA: avisa legal.escrito-generado al generarlo", async () => {
    fetchMock.mockResolvedValue(http(200, { document_id: "doc-1", attorney_validated: false }));
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useGenerateDocument("t", "c1"), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });
    await act(async () => { await result.current.mutateAsync({ document_type: "denuncia_penal", parameters: {} }); });
    expect(motivos).toEqual(["legal.escrito-generado"]);
  });
});
