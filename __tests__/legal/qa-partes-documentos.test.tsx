/**
 * QA P0 (#2859): «Agregar parte» y «Subir documento».
 * Causa raíz reproducida en producción el 22-nov: el panel «Acciones disponibles» enviaba
 * add_actor / upload_document con payload vacío (500 KeyError 'role' / 200 sin efecto).
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch-client";
import { CaseActionsMenu } from "@/components/legal/cases/CaseActionsMenu";
import { AddPartyForm } from "@/components/legal/cases/AddPartyForm";
import { CaseDocumentUploader, validarArchivo } from "@/components/legal/cases/CaseDocumentUploader";
import { ActorFormCard } from "@/components/legal/cases/ActorFormCard";
import { CaseRepresentationCard } from "@/components/legal/cases/CaseRepresentationCard";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
const http = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body), json: async () => body }) as Response;

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
jest.mock("@/app/providers/DisasterModeProvider", () => ({ useDisasterLevel: () => "NORMAL" }));
const runAction = jest.fn();
jest.mock("@/hooks/legal/useCaseActions", () => ({
  useCaseActions: () => ({
    data: { available_actions: [
      { action_name: "upload_document", display_name: "Upload Document" },
      { action_name: "add_actor", display_name: "Add Actor" },
    ], transitions_available: [] },
    isLoading: false, runAction, runTransition: jest.fn(), running: false,
  }),
}));

const wrap = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

beforeEach(() => { jest.clearAllMocks(); });

describe("panel Acciones disponibles", () => {
  it("«Agregar parte» abre el formulario y NO envía la acción vacía (clic)", async () => {
    wrap(<CaseActionsMenu tenantId="t" caseId="c1" />);
    await userEvent.click(screen.getByRole("button", { name: "Agregar parte" }));
    expect(screen.getByTestId("form-agregar-parte")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre completo/)).toHaveFocus();
    expect(runAction).not.toHaveBeenCalled();
  });

  it("«Agregar parte» también se abre con teclado", async () => {
    wrap(<CaseActionsMenu tenantId="t" caseId="c1" />);
    screen.getByRole("button", { name: "Agregar parte" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByTestId("form-agregar-parte")).toBeInTheDocument();
  });

  it("«Subir documento» lleva a la pestaña Documentos y está en español", async () => {
    wrap(<CaseActionsMenu tenantId="t" caseId="c1" />);
    await userEvent.click(screen.getByRole("button", { name: "Subir documento" }));
    expect(push).toHaveBeenCalledWith("/legal/cases/c1/documents");
    expect(runAction).not.toHaveBeenCalled();
    expect(screen.queryByText("Upload Document")).toBeNull();
  });
});

describe("formulario Agregar parte", () => {
  const llenar = async (nombre: string) => {
    if (nombre) await userEvent.type(screen.getByLabelText(/Nombre completo/), nombre);
    await userEvent.click(screen.getByRole("button", { name: "Guardar parte" }));
  };

  it("nombre vacío: aviso y no llama al backend", async () => {
    wrap(<AddPartyForm tenantId="t" caseId="c1" onDone={jest.fn()} onCancel={jest.fn()} />);
    fireEvent.submit(screen.getByTestId("form-agregar-parte"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Escribe el nombre");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("éxito solo tras el 201; manda papel y tipo", async () => {
    const onDone = jest.fn();
    fetchMock.mockResolvedValueOnce(http(201, { actor_id: "a1", role: "contraparte" }));
    wrap(<AddPartyForm tenantId="t" caseId="c1" onDone={onDone} onCancel={jest.fn()} />);
    await llenar("Inversiones Caribe Prueba, S.R.L.");
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/cases/c1/actors");
    expect(JSON.parse(String(init!.body))).toMatchObject({ role: "contraparte", actor_kind: "persona_juridica" });
  });

  it.each([
    [409, { detail: { codigo: "PARTE_DUPLICADA", mensaje: "Esa parte ya figura en el expediente." } }, "ya figura"],
    [403, { detail: "insufficient_role" }, "Tu rol no permite agregar partes"],
    [503, { detail: "x" }, "No se guardó nada"],
  ])("HTTP %s: mensaje claro y no confirma", async (status, body, texto) => {
    const onDone = jest.fn();
    fetchMock.mockResolvedValueOnce(http(status, body));
    wrap(<AddPartyForm tenantId="t" caseId="c1" onDone={onDone} onCancel={jest.fn()} />);
    await llenar("Ana");
    expect(await screen.findByRole("alert")).toHaveTextContent(texto);
    expect(onDone).not.toHaveBeenCalled();
  });

  it("API lenta: el botón queda en «Guardando…» y deshabilitado", async () => {
    let resolver: (r: Response) => void = () => {};
    fetchMock.mockReturnValueOnce(new Promise((r) => { resolver = r; }));
    wrap(<AddPartyForm tenantId="t" caseId="c1" onDone={jest.fn()} onCancel={jest.fn()} />);
    await llenar("Ana");
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
    resolver(http(201, {}));
  });
});

describe("Subir documento", () => {
  const pdf = () => new File(["%PDF-1.7"], "demanda.pdf", { type: "application/pdf" });
  const storage = (body: unknown, status = 200) => fetchMock.mockResolvedValueOnce(http(status, body));

  it("valida tipo y tamaño en el navegador", () => {
    expect(validarArchivo(new File(["x"], "a.exe", { type: "application/x-msdownload" }), 15)).toMatch(/Solo se aceptan/);
    expect(validarArchivo(new File([new Uint8Array(2 * 1024 * 1024)], "a.pdf", { type: "application/pdf" }), 1)).toMatch(/máximo de 1 MB/);
    expect(validarArchivo(pdf(), 15)).toBeNull();
  });

  it("archivo inválido: aviso y el botón queda deshabilitado", async () => {
    storage({ disponible: true, motivo: null, max_mb: 15, tipos: [] });
    wrap(<CaseDocumentUploader tenantId="t" caseId="c1" onUploaded={jest.fn()} />);
    const input = screen.getByLabelText(/Archivo/);
    await userEvent.upload(input, new File(["MZ"], "virus.exe", { type: "application/x-msdownload" }), { applyAccept: false });
    expect(await screen.findByRole("alert")).toHaveTextContent("Solo se aceptan PDF");
    expect(screen.getByRole("button", { name: "Subir documento" })).toBeDisabled();
  });

  it("confirma solo tras el 201 y manda dirección y fechas", async () => {
    storage({ disponible: true, motivo: null, max_mb: 15, tipos: [] });
    const onUploaded = jest.fn();
    wrap(<CaseDocumentUploader tenantId="t" caseId="c1" onUploaded={onUploaded} />);
    await userEvent.upload(screen.getByLabelText(/Archivo/), pdf());
    fireEvent.change(screen.getByLabelText("Fecha del documento"), { target: { value: "2026-11-20" } });
    fireEvent.change(screen.getByLabelText(/Fecha de notificación/), { target: { value: "2026-11-20" } });
    fetchMock.mockResolvedValueOnce(http(201, { document_id: "d1" }));
    await userEvent.click(screen.getByRole("button", { name: "Subir documento" }));
    expect(await screen.findByRole("status")).toHaveTextContent("quedó guardado");
    expect(onUploaded).toHaveBeenCalled();
    const url = String(fetchMock.mock.calls[1][0]);
    expect(url).toContain("direction=incoming");
    expect(url).toContain("document_date=2026-11-20");
    expect(url).toContain("notification_date=2026-11-20");
  });

  it.each([
    [413, { detail: { codigo: "ARCHIVO_DEMASIADO_GRANDE", mensaje: "El archivo supera el máximo de 15 MB." } }, "supera el máximo"],
    [422, { detail: { codigo: "TIPO_NO_PERMITIDO", mensaje: "Solo se aceptan PDF, PNG o JPEG." } }, "Solo se aceptan"],
    [403, { detail: "insufficient_role" }, "Tu rol no permite subir documentos"],
    [503, { detail: { codigo: "ALMACENAMIENTO_NO_DISPONIBLE" } }, "No se guardó nada"],
  ])("HTTP %s: mensaje claro y no anuncia éxito", async (status, body, texto) => {
    storage({ disponible: true, motivo: null, max_mb: 15, tipos: [] });
    const onUploaded = jest.fn();
    wrap(<CaseDocumentUploader tenantId="t" caseId="c1" onUploaded={onUploaded} />);
    await userEvent.upload(screen.getByLabelText(/Archivo/), pdf());
    fetchMock.mockResolvedValueOnce(http(status, body));
    await userEvent.click(screen.getByRole("button", { name: "Subir documento" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(texto);
    expect(onUploaded).not.toHaveBeenCalled();
    expect(screen.queryByText(/quedó guardado/)).toBeNull();
  });

  it("almacenamiento no disponible: lo dice y no deja subir", async () => {
    storage({ disponible: false, motivo: "CLAVE_DE_CIFRADO_NO_CONFIGURADA", max_mb: 15, tipos: [] });
    wrap(<CaseDocumentUploader tenantId="t" caseId="c1" onUploaded={jest.fn()} />);
    expect(await screen.findByText(/almacenamiento seguro de documentos no está disponible/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Archivo/)).toBeDisabled();
  });
});

describe("asistente de creación", () => {
  function Card(props: { onRemove?: () => void; autoFocus?: boolean }) {
    const m = useLegalCasesMessages();
    return <ActorFormCard actor={{ role: "contraparte", actor_kind: "persona_fisica", full_name: "", is_primary: false }}
      onChange={jest.fn()} label="Parte 2" roleOptions={["contraparte"]} messages={m} {...props} />;
  }

  it("la parte nueva aparece abierta, con el foco en el nombre", () => {
    render(<Card autoFocus onRemove={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Parte 2" })).toHaveAttribute("aria-expanded", "true");
    expect(document.activeElement?.tagName).toBe("INPUT");
  });

  it("no hay botones anidados y «quitar» funciona con teclado", async () => {
    const onRemove = jest.fn();
    const { container } = render(<Card onRemove={onRemove} />);
    expect(container.querySelectorAll("button button, button [role=button]")).toHaveLength(0);
    screen.getByRole("button", { name: "Parte 2" }).focus();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onRemove).toHaveBeenCalled();
  });
});

describe("¿A quién representa el despacho?", () => {
  it("guarda la postura y avisa si no está confirmada", async () => {
    const onSaved = jest.fn();
    fetchMock.mockResolvedValueOnce(http(200, { client_roles: ["demandado"] }));
    wrap(<CaseRepresentationCard tenantId="t" caseId="c1" clientRoles={[]} onSaved={onSaved} />);
    expect(screen.getByText(/Sin confirmar/)).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Postura del cliente"), "demandado");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]!.body))).toEqual({ representa: "demandado" });
  });
});
