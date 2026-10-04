/**
 * Pantalla del importador (D7).
 *
 * Lo que se prueba es que no se escriba nada que no se haya revisado: aplicar
 * nace apagado, solo se enciende con una revision limpia de la v4, cambiar el
 * archivo la tira, y un 422 se pinta fila por fila. Mas la puerta: las dos
 * claves del batch, y el 403 con su reason_code.
 *
 * `postImportActivos` se mockea; su contrato vive en
 * tests/lib/dealer-management/import-activos.test.ts.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ImportarActivosPage from "@/app/autos/dealer/inventario/importar/page";
import { ImportRechazado, PLANTILLA_VERSION, parseImportResultado } from "@/lib/dealer-management/import-activos";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

const fetchAsignaciones = jest.fn();
jest.mock("@/lib/dealer/dealer-context-api", () => ({
  ...jest.requireActual("@/lib/dealer/dealer-context-api"),
  fetchMyDealerContext: () => fetchAsignaciones(),
}));

const postImport = jest.fn();
jest.mock("@/lib/dealer-management/import-activos", () => ({
  ...jest.requireActual("@/lib/dealer-management/import-activos"),
  postImportActivos: (...args: unknown[]) => postImport(...args),
}));

const batchMock = jest.fn();
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => batchMock(keys),
}));

function batch(denegar?: string) {
  const results = Object.fromEntries(
    ["autos.inventory.create", "accounting.ledger.entries"].map((k) => [
      k,
      { allowed: k !== denegar, reason_code: k === denegar ? "PLAN_NOT_ENTITLED" : "ALLOWED" },
    ]),
  );
  return { isPending: false, isLoading: false, error: null, data: { results } };
}

const REVISION = {
  modo: "revision",
  version: PLANTILLA_VERSION,
  aplicado: false,
  hojas: [
    { hoja: "Vehiculos", filas: 1, crear: 1 },
    { hoja: "Costos_vehiculos", filas: 1, crear: 1, apertura: 1, operacion: 0 },
  ],
  errores: [],
  no_aplicado: [{ hoja: "Vehiculos", columna: "dominio", motivo: "PROXIMAMENTE" }],
};

function resultado(body: Record<string, unknown>) {
  return parseImportResultado(body)!;
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ImportarActivosPage />
    </QueryClientProvider>,
  );
}

function subir(nombre = "Plantilla_Activos_Mapaal_v4.xlsx") {
  const file = new File(["PK"], nombre);
  fireEvent.change(screen.getByTestId("import-archivo"), { target: { files: [file] } });
  return file;
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  window.localStorage.setItem("nadakki_dealer_id", "dealer-a");
  window.localStorage.setItem("nadakki_dealer_tenant_id", "tenant-a");
  batchMock.mockReturnValue(batch());
  fetchAsignaciones.mockResolvedValue([]);
  postImport.mockReset();
});

test("pide las dos claves y dice cual falta", () => {
  batchMock.mockReturnValue(batch("accounting.ledger.entries"));
  montar();
  expect(batchMock).toHaveBeenCalledWith(["autos.inventory.create", "accounting.ledger.entries"]);
  const denegado = screen.getByTestId("import-denegado");
  expect(denegado).toHaveAttribute("data-capability", "accounting.ledger.entries");
  expect(denegado).toHaveAttribute("data-reason-code", "PLAN_NOT_ENTITLED");
  expect(screen.queryByTestId("import-archivo")).toBeNull();
});

test("las reglas contables se leen antes de subir", () => {
  montar();
  const reglas = screen.getByTestId("import-reglas").textContent ?? "";
  expect(reglas).toMatch(/3020/);
  expect(reglas).toMatch(/2010/);
  expect(reglas).toMatch(/SIN IVA recuperable/);
});

test("otra extension no se revisa", () => {
  montar();
  subir("stock.csv");
  expect(screen.getByTestId("import-aviso")).toHaveTextContent(".xlsx");
  expect(screen.getByTestId("import-revisar")).toBeDisabled();
});

test("revisar -> revision limpia -> aplicar con la misma clave y el mismo archivo", async () => {
  postImport.mockResolvedValueOnce(resultado(REVISION));
  postImport.mockResolvedValueOnce(resultado({ ...REVISION, modo: "aplicar", aplicado: true }));
  montar();
  expect(screen.getByTestId("import-aplicar")).toBeDisabled();
  const file = subir();
  fireEvent.click(screen.getByTestId("import-revisar"));

  await screen.findByTestId("import-revision");
  expect(postImport).toHaveBeenNthCalledWith(1, "dealer-a", file, file.name, "revision");
  expect(screen.getByTestId("import-hoja-Costos_vehiculos")).toHaveAttribute("data-filas", "1");
  expect(screen.getByTestId("import-no-aplicado")).toHaveTextContent("dominio");

  const aplicar = screen.getByTestId("import-aplicar");
  await waitFor(() => expect(aplicar).toBeEnabled());
  fireEvent.click(aplicar);
  await screen.findByTestId("import-aplicado");
  const [dealer, enviado, , modo, clave] = postImport.mock.calls[1];
  expect([dealer, enviado, modo]).toEqual(["dealer-a", file, "aplicar"]);
  expect(typeof clave).toBe("string");
  expect(screen.getByTestId("import-aplicar")).toBeDisabled();
});

test("un 422 pinta las filas y aplicar sigue apagado", async () => {
  postImport.mockRejectedValueOnce(
    new ImportRechazado(
      resultado({
        ...REVISION,
        errores: [{ hoja: "Vehiculos", fila: 5, columna: "precio_venta", mensaje: "DISPONIBLE exige precio_venta" }],
      }),
    ),
  );
  montar();
  subir();
  fireEvent.click(screen.getByTestId("import-revisar"));
  const errores = await screen.findByTestId("import-errores");
  expect(errores).toHaveTextContent("Vehiculos · fila 5 · precio_venta: DISPONIBLE exige precio_venta");
  expect(screen.getByTestId("import-aplicar")).toBeDisabled();
});

test("otra version no se aplica aunque no traiga errores", async () => {
  postImport.mockResolvedValueOnce(resultado({ ...REVISION, version: "PLANTILLA_ACTIVOS_v3" }));
  montar();
  subir();
  fireEvent.click(screen.getByTestId("import-revisar"));
  await screen.findByTestId("import-version-distinta");
  expect(screen.getByTestId("import-aplicar")).toBeDisabled();
});

test("cambiar el archivo tira la revision", async () => {
  postImport.mockResolvedValueOnce(resultado(REVISION));
  montar();
  subir();
  fireEvent.click(screen.getByTestId("import-revisar"));
  await screen.findByTestId("import-revision");
  subir("otra.xlsx");
  expect(screen.queryByTestId("import-revision")).toBeNull();
  expect(screen.getByTestId("import-aplicar")).toBeDisabled();
});

test("sin dealer en la sesion y con una sola asignacion, usa esa", async () => {
  window.localStorage.removeItem("nadakki_dealer_id");
  fetchAsignaciones.mockResolvedValue([{ dealerId: "dealer-b", dealerName: "Mapaal" }]);
  postImport.mockResolvedValueOnce(resultado(REVISION));
  montar();
  await screen.findByTestId("import-archivo");
  subir();
  fireEvent.click(screen.getByTestId("import-revisar"));
  await screen.findByTestId("import-revision");
  expect(postImport.mock.calls[0][0]).toBe("dealer-b");
});
