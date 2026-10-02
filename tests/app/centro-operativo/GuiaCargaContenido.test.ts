/**
 * El contenido de la guia de carga de Mapaal (D9, packet de datos).
 *
 * El texto es la "Guia de carga y operacion inicial de Mapaal" redactada y
 * VALIDADA CONTABLEMENTE por Cesar (GUIA-CARGA-MAPAAL,
 * csorianoai/nadakki-ai-suite#1501, comentario 5952253812). Este fichero vigila
 * que no se degrade: si alguien le cambia un codigo de cuenta a un asiento, le
 * quita una regla o invierte el orden de arranque, cae.
 *
 * La pantalla que lo pinta va en su propio packet, con sus propios casos.
 */
import {
  contenidoCentroOperativo,
  type ContenidoCentroOperativo,
} from "@/app/centro-operativo/contenido";

const GUIA: ContenidoCentroOperativo = contenidoCentroOperativo("mapaal");

function bloque(id: string) {
  const b = GUIA.bloques.find((x) => x.id === id);
  if (!b) throw new Error(`falta el bloque ${id}`);
  return b;
}

describe("el plan de cuentas que fijo la guia", () => {
  it("son exactamente las 8 cuentas, con su codigo y su nombre", () => {
    expect(GUIA.cuentas).toEqual([
      { codigo: "1010", nombre: "Caja" },
      { codigo: "1020", nombre: "Banco" },
      { codigo: "1100", nombre: "Créditos por ventas" },
      { codigo: "1220", nombre: "Inventario de vehículos para la venta" },
      { codigo: "2010", nombre: "Proveedores" },
      { codigo: "3020", nombre: "Saldos iniciales" },
      { codigo: "4010", nombre: "Venta de vehículos" },
      { codigo: "5010", nombre: "Costo de vehículos vendidos" },
    ]);
  });

  it("el encabezado del plan tambien es dato, no texto de pantalla", () => {
    expect(GUIA.cuentasIntro).toContain("8 cuentas");
    expect(GUIA.tiposCostoIntro).toContain("Tipos de costo");
  });
});

describe("los asientos salen con las cuentas que fijo la guia", () => {
  it("la venta reconoce ingreso Y costo, no solo el ingreso", () => {
    const v = bloque("venta").asientos ?? [];
    expect(v).toHaveLength(2);
    expect(v[0].debe).toContain("1100");
    expect(v[0].haber).toContain("4010");
    expect(v[1].debe).toContain("5010");
    expect(v[1].haber).toContain("1220");
  });

  it("el cobro descarga Creditos por ventas contra Caja o Banco", () => {
    const c = bloque("cobro").asientos ?? [];
    expect(c).toHaveLength(2);
    expect(c.map((a) => a.debe)).toEqual([
      expect.stringContaining("1010"),
      expect.stringContaining("1020"),
    ]);
    for (const a of c) expect(a.haber).toContain("1100");
  });

  it("el pago descarga Proveedores contra Caja o Banco", () => {
    const p = bloque("pago").asientos ?? [];
    expect(p).toHaveLength(2);
    for (const a of p) expect(a.debe).toContain("2010");
    expect(p.map((a) => a.haber)).toEqual([
      expect.stringContaining("1010"),
      expect.stringContaining("1020"),
    ]);
  });

  it("la apertura va contra 3020, NO contra Proveedores", () => {
    const texto = (bloque("primeros-pasos").pasos ?? []).join(" ");
    expect(texto).toContain("is_opening=true");
    expect(texto).toContain("1220");
    expect(texto).toContain("3020");
    expect(texto).toContain("no Proveedores");
    expect(bloque("primeros-pasos").advertencia).toContain("compra ficticia");
  });

  it("el arranque pone el stock existente ANTES de la operacion normal", () => {
    const pasos = bloque("primeros-pasos").pasos ?? [];
    const inicial = pasos.findIndex((p) => /SALDOS INICIALES/.test(p));
    const normal = pasos.findIndex((p) => /operación normal/.test(p));
    expect(inicial).toBeGreaterThanOrEqual(0);
    expect(normal).toBeGreaterThan(inicial);
  });
});

describe("las reglas contables de la guia estan completas", () => {
  it("IVA recuperable, impuesto no recuperable y las dos comisiones", () => {
    const texto = (bloque("reglas-contables").vinetas ?? []).join(" ");
    expect(texto).toContain("SIN IVA recuperable");
    expect(texto).toContain("El IVA recuperable no forma parte del costo");
    expect(texto).toContain("impuesto no recuperable sí puede integrar el costo");
    expect(texto).toContain("exclusivamente comisión de compra");
    expect(texto).toContain("comisiones de venta no aumentan el costo");
  });

  it("el fundamento es RT 54 FACPCE y queda escrito", () => {
    expect((bloque("reglas-contables").parrafos ?? []).join(" ")).toContain("RT 54 FACPCE");
  });

  it("estan los ocho tipos de costo, y reparacion exige proveedor y factura", () => {
    expect(GUIA.tiposCosto).toHaveLength(8);
    expect(GUIA.tiposCosto.map((t) => t.id)).toContain("comision-compra");
    expect(GUIA.tiposCosto.find((t) => t.id === "reparacion")?.descripcion).toContain(
      "Proveedor y factura son obligatorios",
    );
  });

  it('"Otros" conserva su advertencia: no es un cajon de sastre', () => {
    const otros = GUIA.tiposCosto.find((t) => t.id === "otros");
    expect(otros?.descripcion).toContain("directamente atribuibles al vehículo");
    expect(otros?.descripcion).toContain("Evitá usar");
    expect(otros?.descripcion).toContain("categoría genérica por comodidad");
  });

  it("los impuestos no recuperables se distinguen del IVA recuperable", () => {
    const imp = GUIA.tiposCosto.find((t) => t.id === "impuestos-no-recuperables");
    expect(imp?.descripcion).toContain("no generan crédito fiscal recuperable");
  });

  it("el ARS es obligatorio y el USD nunca entra en calculos", () => {
    const texto = (bloque("alta-vehiculo").vinetas ?? []).join(" ");
    expect(texto).toContain("precio oficial en ARS es obligatorio");
    expect(texto).toContain("USD es opcional");
    expect(texto).toContain("nunca entra en cálculos contables");
  });

  it("la venta sin costos falla cerrado, y dice por que", () => {
    const a = bloque("venta").advertencia ?? "";
    expect(a).toContain("fallar cerrado");
    expect(a).toContain("margen artificialmente alto");
  });

  it("la facturacion electronica se gestiona en ARCA", () => {
    expect(bloque("que-muestra").advertencia).toContain("ARCA");
  });

  it("la regla final prohibe inventar cuentas, monedas, proveedores e importes", () => {
    expect(GUIA.reglaFinal).toContain("No inventes cuentas, monedas, proveedores ni importes");
  });
});

describe("el contenido por tenant", () => {
  it("sin tenant resuelto devuelve la guia validada, sin romperse", () => {
    for (const valor of [null, undefined, "", "   "] as (string | null | undefined)[]) {
      expect(contenidoCentroOperativo(valor).tenant).toBe("mapaal");
    }
  });

  it("no distingue la caja del tenant", () => {
    expect(contenidoCentroOperativo("MAPAAL")).toBe(contenidoCentroOperativo("mapaal"));
  });

  it("un tenant sin guia propia recibe la validada, no una vacia", () => {
    const otro = contenidoCentroOperativo("otro-concesionario");
    expect(otro.bloques.length).toBeGreaterThan(0);
    expect(otro.cuentas).toHaveLength(8);
  });
});
