import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { planificar, clienteDe, tituloDocumento } from "@/lib/legal/importacion/plan";
import { importar, type Deps } from "@/lib/legal/importacion/ejecutar";
import { ImportarExpedientes } from "@/components/legal/importacion/ImportarExpedientes";
import * as archivo from "@/lib/legal/archivo-api";

const archivoEn = (ruta: string, size = 1000, tipo = "application/pdf") => {
  const f = new File([new Uint8Array(Math.min(size, 10))], ruta.split("/").pop()!, { type: tipo });
  Object.defineProperty(f, "size", { value: size });
  Object.defineProperty(f, "webkitRelativePath", { value: ruta });
  return f;
};
const MB = 1024 * 1024;

describe("plan de importación", () => {
  it("cada subcarpeta es un expediente; lo profundo va con su subcarpeta; la raíz forma uno propio", () => {
    const p = planificar([
      archivoEn("Casos/Pérez - Cobro/demanda.pdf"),
      archivoEn("Casos/Pérez - Cobro/pruebas/factura 1.jpg", 2000, "image/jpeg"),
      archivoEn("Casos/Gómez/sentencia.PDF"),
      archivoEn("Casos/indice.pdf"),
    ]);
    expect(p.grupos.map((g) => [g.titulo, g.cliente, g.archivos.length])).toEqual([
      ["Casos", "Casos", 1], ["Gómez", "Gómez", 1], ["Pérez - Cobro", "Pérez", 2]]);
    expect(p.documentos).toBe(4);
    expect(p.bytes).toBe(5000);
  });

  it("omite formatos no admitidos, archivos grandes, vacíos y del sistema", () => {
    const p = planificar([
      archivoEn("C/A/nota.docx"), archivoEn("C/A/grande.pdf", 16 * MB), archivoEn("C/A/vacio.pdf", 0),
      archivoEn("C/A/.DS_Store"), archivoEn("C/A/Thumbs.db"), archivoEn("C/A/ok.png", 10, "image/png"),
    ]);
    expect(p.documentos).toBe(1);
    expect(p.omitidos.map((o) => o.motivo).sort()).toEqual(["oculto", "oculto", "tamano", "tipo", "vacio"]);
  });

  it("cliente y título del documento", () => {
    expect(clienteDe("Banco X – Ejecución")).toBe("Banco X");
    expect(clienteDe("Sin guion")).toBe("Sin guion");
    expect(tituloDocumento("C/A/acto de alguacil.pdf")).toBe("acto de alguacil");
  });
});

const fakeDeps = (over: Partial<Deps> = {}) => {
  const llamadas: string[] = [];
  const deps: Deps = {
    existentes: async () => new Map([["Gómez", "case-g"]]),
    documentosDe: async () => new Set(["sentencia"]),
    crearExpediente: async (t, c) => { llamadas.push(`crear:${t}:${c}`); return `case-${t}`; },
    subir: async (id, f, t) => { llamadas.push(`subir:${id}:${t}`); },
    ...over,
  };
  return { deps, llamadas };
};

describe("ejecución de la importación", () => {
  const plan = () => planificar([
    archivoEn("C/Gómez/sentencia.pdf"), archivoEn("C/Gómez/recurso.pdf"), archivoEn("C/Pérez/demanda.pdf"),
  ]);

  it("reutiliza el expediente existente, no repite documentos y crea los que faltan", async () => {
    const { deps, llamadas } = fakeDeps();
    const r = await importar(plan(), deps);
    expect(llamadas).toEqual(["subir:case-g:recurso", "crear:Pérez:Pérez", "subir:case-Pérez:demanda"]);
    expect(r).toMatchObject({ creados: 1, reutilizados: 1, subidos: 2, yaEstaban: 1, detenido: null });
  });

  it("se detiene si el archivo se llena (402)", async () => {
    const { deps } = fakeDeps({ subir: async () => { throw Object.assign(new Error("x"), { status: 402, detail: "El archivo del despacho está lleno." }); } });
    const r = await importar(plan(), deps);
    expect(r.detenido).toBe("ESPACIO_AGOTADO");
    expect(r.subidos).toBe(0);
    expect(r.errores[0].mensaje).toMatch(/lleno/);
  });

  it("sin permiso para crear expedientes se detiene; otros errores se anotan y sigue", async () => {
    const sinPermiso = fakeDeps({ existentes: async () => new Map(), crearExpediente: async () => { throw Object.assign(new Error("no"), { status: 403 }); } });
    expect((await importar(plan(), sinPermiso.deps)).detenido).toBe("SIN_PERMISO");
    let n = 0;
    const uno = fakeDeps({ subir: async () => { n += 1; if (n === 1) throw Object.assign(new Error("PDF dañado"), { status: 422 }); } });
    const r = await importar(plan(), uno.deps);
    expect(r.detenido).toBeNull();
    expect(r.errores).toHaveLength(1);
    expect(r.subidos).toBe(1);
  });
});

describe("pantalla de importación", () => {
  afterEach(() => jest.restoreAllMocks());
  const envolver = (ui: React.ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

  it("muestra el resumen, avisa si no cabe y no deja importar", async () => {
    jest.spyOn(archivo, "leerEspacio").mockResolvedValue({ libre_bytes: 500 } as archivo.Espacio);
    envolver(<ImportarExpedientes tenantId="t" deps={fakeDeps().deps} />);
    await waitFor(() => expect(archivo.leerEspacio).toHaveBeenCalled());
    fireEvent.change(screen.getByTestId("importar-input"), { target: { files: [archivoEn("C/Pérez/demanda.pdf", 2000)] } });
    expect(await screen.findByText(/1 expedientes · 1 documentos/)).toBeTruthy();
    expect(screen.getByText(/No cabe en el espacio libre/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Importar 1 expedientes" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("importa y muestra el informe", async () => {
    jest.spyOn(archivo, "leerEspacio").mockResolvedValue({ libre_bytes: 10 * MB } as archivo.Espacio);
    envolver(<ImportarExpedientes tenantId="t" deps={fakeDeps().deps} />);
    await waitFor(() => expect(archivo.leerEspacio).toHaveBeenCalled());
    fireEvent.change(screen.getByTestId("importar-input"), { target: { files: [archivoEn("C/Pérez/demanda.pdf", 2000)] } });
    fireEvent.click(await screen.findByRole("button", { name: "Importar 1 expedientes" }));
    expect(await screen.findByText(/Listo: 1 documentos subidos, 1 expedientes nuevos/)).toBeTruthy();
  });
});
