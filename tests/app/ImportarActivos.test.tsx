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
import { ImportRechazado, parseImportResultado } from "@/lib/dealer-management/import-activos";

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

/* Forma REAL del backend: conteos de vehiculos y costos, e incidencias con nivel. */
const REVISION = {
  ok: true,
  aplicado: false,
  vehiculos: 1,
  costos: 1,
  incidencias: [{ hoja: "Vehiculos", fila: 2, codigo: "PROXIMAMENTE", detalle: "dominio no se guarda", nivel: "AVISO" }],
};

function resultado(body: Record<string, unknown>, modo: "revision" | "aplicar" = "revision") {
  return parseImportResultado(body, modo)!;
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
  postImport.mockResolvedValueOnce(resultado({ ...REVISION, aplicado: true }, "aplicar"));
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
        ok: false,
        incidencias: [{ hoja: "Vehiculos", fila: 5, codigo: "PRECIO", detalle: "DISPONIBLE exige precio_venta", nivel: "ERROR" }],
      }),
    ),
  );
  montar();
  subir();
  fireEvent.click(screen.getByTestId("import-revisar"));
  const errores = await screen.findByTestId("import-errores");
  // Un codigo que la pantalla no conoce: mensaje generico, sin inventarle significado.
  expect(errores).toHaveTextContent("Vehiculos · fila 5: La revisión marcó un problema que esta pantalla todavía no sabe explicar.");
  // El codigo y el detalle del backend quedan plegados.
  const detalle = errores.querySelector("details")!;
  expect(detalle).not.toHaveAttribute("open");
  expect(detalle).toHaveTextContent("PRECIO · DISPONIBLE exige precio_venta");
  expect(screen.getByTestId("import-aplicar")).toBeDisabled();
});

test("MONTO_INVALIDO y FECHA_INGRESO_FUTURA se leen en español con su fila; el codigo va plegado", async () => {
  postImport.mockRejectedValueOnce(
    new ImportRechazado(
      resultado({
        ok: false,
        aplicado: false,
        vehiculos: 0,
        costos: 0,
        incidencias: [
          { hoja: "Vehiculos", fila: 6, codigo: "FECHA_INGRESO_FUTURA", detalle: "fecha_ingreso_stock no puede ser posterior a hoy", nivel: "ERROR" },
          { hoja: "Costos_vehiculos", fila: 5, codigo: "MONTO_INVALIDO", detalle: "monto: '1.500' no es un monto (sin $ ni separador de miles)", nivel: "ERROR" },
        ],
      }),
    ),
  );
  montar();
  subir();
  fireEvent.click(screen.getByTestId("import-revisar"));
  const errores = await screen.findByTestId("import-errores");
  const [fecha, monto] = Array.from(errores.querySelectorAll("li"));
  expect(fecha).toHaveTextContent("Vehiculos · fila 6: La fecha de ingreso al stock no puede ser posterior a hoy.");
  expect(monto).toHaveTextContent("Costos_vehiculos · fila 5: El monto no es válido");
  expect(fecha.querySelector("summary")).toHaveTextContent("Detalle técnico");
  expect(fecha.querySelector("details code")).toHaveTextContent("FECHA_INGRESO_FUTURA");
  expect(monto.querySelector("details code")).toHaveTextContent("MONTO_INVALIDO");
  // Fuera del plegado no queda ningun codigo crudo.
  for (const li of [fecha, monto]) {
    const visible = li.cloneNode(true) as HTMLElement;
    visible.querySelector("details")?.remove();
    expect(visible.textContent).not.toMatch(/[A-Z]+_[A-Z_]+/);
  }
});

test("los avisos dicen la fila y 'fallará' con tilde", async () => {
  postImport.mockResolvedValueOnce(
    resultado({
      ...REVISION,
      incidencias: [
        {
          hoja: "Vehiculos",
          fila: 7,
          codigo: "SIN_COSTO_DE_COMPRA",
          detalle: "sin COMPRA en Costos_vehiculos: la venta fallara cerrada hasta que el auto tenga costo",
          nivel: "AVISO",
        },
      ],
    }),
  );
  montar();
  subir();
  fireEvent.click(screen.getByTestId("import-revisar"));
  await screen.findByTestId("import-revision");
  const aviso = screen.getByTestId("import-no-aplicado").querySelector("li")!;
  expect(aviso).toHaveTextContent("Vehiculos · fila 7: Sin costo de COMPRA en Costos_vehiculos: la venta de este vehículo fallará");
  expect(aviso.querySelector("details code")).toHaveTextContent("SIN_COSTO_DE_COMPRA");
});

test("planilla aplicada resume lo creado con los conteos de la respuesta", async () => {
  postImport.mockResolvedValueOnce(resultado(REVISION));
  postImport.mockResolvedValueOnce(
    resultado({ ...REVISION, aplicado: true, creados: { vehiculos: 2, costos: 3, adquisiciones: 1 } }, "aplicar"),
  );
  montar();
  subir();
  fireEvent.click(screen.getByTestId("import-revisar"));
  await screen.findByTestId("import-revision");
  await waitFor(() => expect(screen.getByTestId("import-aplicar")).toBeEnabled());
  fireEvent.click(screen.getByTestId("import-aplicar"));
  await screen.findByTestId("import-aplicado");
  expect(screen.getByTestId("import-aplicado-resumen")).toHaveTextContent(
    "Creados: 2 vehículos, 3 costos y 1 fecha de ingreso al stock.",
  );
});

test("sin `creados` en la respuesta no se inventa un resumen", async () => {
  postImport.mockResolvedValueOnce(resultado(REVISION));
  postImport.mockResolvedValueOnce(resultado({ ...REVISION, aplicado: true }, "aplicar"));
  montar();
  subir();
  fireEvent.click(screen.getByTestId("import-revisar"));
  await screen.findByTestId("import-revision");
  await waitFor(() => expect(screen.getByTestId("import-aplicar")).toBeEnabled());
  fireEvent.click(screen.getByTestId("import-aplicar"));
  await screen.findByTestId("import-aplicado");
  expect(screen.queryByTestId("import-aplicado-resumen")).toBeNull();
});

test("una revision sin conteos legibles no se aplica", async () => {
  postImport.mockResolvedValueOnce(resultado({ ok: true, aplicado: false, vehiculos: 1 }));
  montar();
  subir();
  fireEvent.click(screen.getByTestId("import-revisar"));
  await screen.findByTestId("import-revision");
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
