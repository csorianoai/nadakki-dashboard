import {
  agruparTopN,
  calcularEmbudo,
  escalar,
  margenIzquierdo,
  estadoGrafico,
  ordenarCategorias,
  rutaLinea,
  ticksLineales,
} from "@/lib/analytics/graficos";
import { META_OK } from "./fixtures/graficos.fixture";

describe("estadoGrafico", () => {
  it("ok con fuente, fecha y datos", () => expect(estadoGrafico(META_OK, 3)).toBe("ok"));
  it("sin fuente => pendiente de integracion", () => expect(estadoGrafico({ ...META_OK, fuente: null }, 3)).toBe("pendiente_integracion"));
  it("fuente en blanco => pendiente de integracion", () => expect(estadoGrafico({ ...META_OK, fuente: "  " }, 3)).toBe("pendiente_integracion"));
  it("fecha invalida => pendiente de integracion", () => expect(estadoGrafico({ ...META_OK, fecha_dato: "no-es-fecha" }, 3)).toBe("pendiente_integracion"));
  it("sin datos => vacio", () => expect(estadoGrafico(META_OK, 0)).toBe("vacio"));
  it("menos del minimo => datos insuficientes", () => expect(estadoGrafico(META_OK, 1, 2)).toBe("datos_insuficientes"));
  it("el estado declarado distinto de ok manda", () => {
    expect(estadoGrafico({ ...META_OK, estado: "cargando" }, 5)).toBe("cargando");
    expect(estadoGrafico({ ...META_OK, estado: "error" }, 5)).toBe("error");
  });
});

describe("ticksLineales y escalar", () => {
  it("incluye el cero cuando hay positivos y negativos", () => {
    const t = ticksLineales(-5, 20, 4);
    expect(t).toContain(0);
    expect(t[0]).toBeLessThanOrEqual(-5);
    expect(t[t.length - 1]).toBeGreaterThanOrEqual(20);
  });
  it("dominio plano no produce NaN ni Infinity", () => {
    const t = ticksLineales(7, 7, 4);
    expect(t.every(Number.isFinite)).toBe(true);
    expect(t.length).toBeGreaterThanOrEqual(2);
  });
  it("escalar un dominio plano devuelve el punto medio", () => expect(escalar(7, [7, 7], [0, 100])).toBe(50));
  it("escalar interpola y nunca da NaN", () => {
    expect(escalar(5, [0, 10], [0, 100])).toBe(50);
    expect(Number.isNaN(escalar(Number.NaN, [0, 10], [0, 100]))).toBe(false);
  });
});

describe("rutaLinea", () => {
  it("rompe la linea en los nulos", () => {
    const d = rutaLinea([{ x: 0, y: 1 }, { x: 1, y: 2 }, null, { x: 3, y: 4 }, { x: 4, y: 5 }]);
    expect(d.match(/M/g)).toHaveLength(2);
    expect(d).not.toMatch(/NaN|Infinity/);
  });
  it("un solo punto no genera ruta de linea", () => expect(rutaLinea([{ x: 1, y: 1 }])).toBe(""));
});

describe("ordenarCategorias y agruparTopN", () => {
  it("ordena de mayor a menor sin mutar la entrada", () => {
    const entrada = [{ etiqueta: "a", valor: 1 }, { etiqueta: "b", valor: 5 }, { etiqueta: "c", valor: null }];
    const r = ordenarCategorias(entrada);
    expect(r.map((x) => x.etiqueta)).toEqual(["b", "a", "c"]);
    expect(entrada[0].etiqueta).toBe("a");
  });
  it("agrupa en 'Otros' por encima del maximo y conserva el total", () => {
    const datos = [10, 9, 8, 7, 6, 5, 4].map((valor, i) => ({ etiqueta: `c${i}`, valor }));
    const r = agruparTopN(datos, 3);
    expect(r.items).toHaveLength(4);
    expect(r.items[3].etiqueta).toBe("Otros");
    expect(r.items[3].valor).toBe(7 + 6 + 5 + 4);
    expect(r.items.reduce((s, x) => s + x.valor, 0)).toBe(49);
  });
  it("descarta negativos, ceros y no finitos y lo informa", () => {
    const r = agruparTopN([{ etiqueta: "a", valor: 5 }, { etiqueta: "b", valor: -2 }, { etiqueta: "c", valor: 0 }, { etiqueta: "d", valor: Number.NaN }, { etiqueta: "e", valor: null }], 5);
    expect(r.items.map((x) => x.etiqueta)).toEqual(["a"]);
    expect(r.descartados).toBe(4);
  });
  it("no agrupa si no se supera el maximo", () => {
    const r = agruparTopN([{ etiqueta: "a", valor: 1 }, { etiqueta: "b", valor: 2 }], 5);
    expect(r.items.map((x) => x.etiqueta)).toEqual(["b", "a"]);
  });
});

describe("calcularEmbudo", () => {
  it("conversion entre etapas y total", () => {
    const r = calcularEmbudo([{ etiqueta: "A", valor: 200 }, { etiqueta: "B", valor: 80 }, { etiqueta: "C", valor: 40 }]);
    expect(r.filas[0].conversion_previa).toBeNull();
    expect(r.filas[1].conversion_previa).toEqual({ estado: "ok", porcentaje: 40 });
    expect(r.filas[2].conversion_previa).toEqual({ estado: "ok", porcentaje: 50 });
    expect(r.filas[2].porcentaje_inicio).toEqual({ estado: "ok", porcentaje: 20 });
    expect(r.total).toEqual({ estado: "ok", porcentaje: 20 });
  });
  it("etapa previa en 0 => datos insuficientes, nunca NaN/Infinity", () => {
    const r = calcularEmbudo([{ etiqueta: "A", valor: 0 }, { etiqueta: "B", valor: 5 }, { etiqueta: "C", valor: 0 }]);
    expect(r.filas[1].conversion_previa).toEqual({ estado: "datos_insuficientes" });
    expect(r.filas[2].conversion_previa).toEqual({ estado: "ok", porcentaje: 0 });
    expect(r.total).toEqual({ estado: "datos_insuficientes" });
    const porcentajes: unknown[] = [r.total, ...r.filas.flatMap((f) => [f.conversion_previa, f.porcentaje_inicio])]
      .filter((x): x is { estado: "ok"; porcentaje: number } => !!x && (x as { estado: string }).estado === "ok")
      .map((x) => x.porcentaje);
    expect(porcentajes.every((n) => typeof n === "number" && Number.isFinite(n))).toBe(true);
  });
  it("valor nulo => datos insuficientes en esa etapa y la siguiente", () => {
    const r = calcularEmbudo([{ etiqueta: "A", valor: 10 }, { etiqueta: "B", valor: null }, { etiqueta: "C", valor: 3 }]);
    expect(r.filas[1].conversion_previa).toEqual({ estado: "datos_insuficientes" });
    expect(r.filas[2].conversion_previa).toEqual({ estado: "datos_insuficientes" });
  });
  it("marca la etapa que supera a la anterior como anomalia", () => {
    const r = calcularEmbudo([{ etiqueta: "A", valor: 10 }, { etiqueta: "B", valor: 15 }]);
    expect(r.filas[1].anomalia).toBe(true);
    expect(r.filas[1].conversion_previa).toEqual({ estado: "ok", porcentaje: 150 });
  });
  it("sin etapas: sin filas y total insuficiente", () => {
    const r = calcularEmbudo([]);
    expect(r.filas).toEqual([]);
    expect(r.total).toEqual({ estado: "datos_insuficientes" });
  });
});

describe("margenIzquierdo", () => {
  it("crece con la etiqueta mas larga y respeta un minimo", () => {
    expect(margenIzquierdo(["0", "5"])).toBe(40);
    expect(margenIzquierdo(["0", "12,00 US$"])).toBeGreaterThan(margenIzquierdo(["0", "12"]));
    expect(margenIzquierdo([])).toBe(40);
  });
});
