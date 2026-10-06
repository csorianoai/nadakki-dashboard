/**
 * El periodo se nombra con lo que trae `contable_periodos`: fiscal_year,
 * period_number, start_date, end_date y status. No hay columna de nombre.
 */
import { estadoPeriodo, nombrePeriodo, opcionPeriodo } from "@/lib/contable/periodo-nombre";

describe("nombrePeriodo", () => {
  it("un periodo mensual se llama por su mes: Julio 2026", () => {
    expect(
      nombrePeriodo({ fiscal_year: 2026, period_number: 7, fecha_inicio: "2026-07-01", fecha_fin: "2026-07-31" }),
    ).toBe("Julio 2026");
  });

  it("el mes sale de las fechas, no del numero: el periodo 1 de un ejercicio que empieza en abril es Abril", () => {
    expect(
      nombrePeriodo({ fiscal_year: 2026, period_number: 1, fecha_inicio: "2026-04-01", fecha_fin: "2026-04-30" }),
    ).toBe("Abril 2026");
  });

  it("un periodo que cruza meses no se nombra con un mes: numero y ejercicio", () => {
    expect(
      nombrePeriodo({ fiscal_year: 2026, period_number: 3, fecha_inicio: "2026-07-01", fecha_fin: "2026-09-30" }),
    ).toBe("Período 3 · 2026");
  });

  it("sin fechas usa numero y ejercicio", () => {
    expect(nombrePeriodo({ fiscal_year: 2026, period_number: 12, fecha_inicio: "", fecha_fin: "" })).toBe(
      "Período 12 · 2026",
    );
  });

  it("sin nada con que construirlo no inventa un mes", () => {
    expect(nombrePeriodo({ fiscal_year: Number.NaN, period_number: Number.NaN })).toBe("Período sin fechas");
  });

  it("si el backend manda label, manda el backend", () => {
    expect(nombrePeriodo({ label: "Cierre anual", fecha_inicio: "2026-07-01", fecha_fin: "2026-07-31" })).toBe(
      "Cierre anual",
    );
  });

  it("un label vacio no tapa el nombre construido", () => {
    expect(nombrePeriodo({ label: "  ", fecha_inicio: "2026-12-01", fecha_fin: "2026-12-31" })).toBe("Diciembre 2026");
  });
});

describe("estado del periodo", () => {
  it("open no se muestra crudo", () => {
    expect(estadoPeriodo("open")).toBe("Abierto");
    expect(estadoPeriodo("soft_closed")).toBe("Cierre suave");
    expect(estadoPeriodo("locked")).toBe("Cerrado");
  });

  it("un estado desconocido se muestra tal cual", () => {
    expect(estadoPeriodo("archived")).toBe("archived");
  });

  it("la opcion del selector: nombre y estado en minuscula", () => {
    expect(opcionPeriodo({ label: "Julio 2026", status: "open" })).toBe("Julio 2026 (abierto)");
  });
});
