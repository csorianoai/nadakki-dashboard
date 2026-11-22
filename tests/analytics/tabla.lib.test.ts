import { nivelCalor, normalizarTexto, ordenarPor, paginar, rangoCalor } from "@/lib/analytics/tabla";

describe("ordenarPor", () => {
  const filas = [{ n: "b", v: 2 }, { n: "a", v: 3 }, { n: "c", v: null }, { n: "d", v: 1 }];
  it("ordena ascendente y descendente por numero", () => {
    expect(ordenarPor(filas, (f) => f.v, "asc").map((f) => f.n)).toEqual(["d", "b", "a", "c"]);
    expect(ordenarPor(filas, (f) => f.v, "desc").map((f) => f.n)).toEqual(["a", "b", "d", "c"]);
  });
  it("los nulos van SIEMPRE al final, en ambas direcciones", () => {
    expect(ordenarPor(filas, (f) => f.v, "asc").at(-1)?.n).toBe("c");
    expect(ordenarPor(filas, (f) => f.v, "desc").at(-1)?.n).toBe("c");
  });
  it("texto con acentos en orden del espanol y es estable con empates", () => {
    const t = [{ n: "Zeta", i: 1 }, { n: "Épsilon", i: 2 }, { n: "Alfa", i: 3 }, { n: "Alfa", i: 4 }];
    expect(ordenarPor(t, (f) => f.n, "asc").map((f) => f.i)).toEqual([3, 4, 2, 1]);
  });
  it("no muta la entrada", () => {
    const copia = [...filas];
    ordenarPor(filas, (f) => f.v, "asc");
    expect(filas).toEqual(copia);
  });
  it("NaN e Infinity cuentan como nulos", () => {
    const f = [{ v: Number.NaN }, { v: 1 }, { v: Number.POSITIVE_INFINITY }];
    expect(ordenarPor(f, (x) => x.v, "asc")[0].v).toBe(1);
  });
});

describe("paginar", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);
  it("primera, intermedia y ultima pagina", () => {
    expect(paginar(items, 1, 10)).toMatchObject({ pagina: 1, paginas: 3, total: 25, desde: 1, hasta: 10 });
    expect(paginar(items, 2, 10).items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(paginar(items, 3, 10)).toMatchObject({ pagina: 3, desde: 21, hasta: 25 });
  });
  it("limita la pagina fuera de rango", () => {
    expect(paginar(items, 99, 10).pagina).toBe(3);
    expect(paginar(items, 0, 10).pagina).toBe(1);
    expect(paginar(items, -4, 10).pagina).toBe(1);
  });
  it("lista vacia: 0 de 0, una pagina, sin NaN", () => {
    expect(paginar([], 1, 10)).toEqual({ items: [], pagina: 1, paginas: 1, total: 0, desde: 0, hasta: 0 });
  });
  it("tamano invalido (0, negativo, NaN) no divide por cero", () => {
    for (const t of [0, -5, Number.NaN]) {
      const r = paginar(items, 1, t);
      expect(Number.isFinite(r.paginas)).toBe(true);
      expect(r.items.length).toBeGreaterThan(0);
    }
  });
});

describe("escala de calor", () => {
  it("rangoCalor ignora nulos y no finitos", () => {
    expect(rangoCalor([3, null, 9, Number.NaN, 1])).toEqual({ min: 1, max: 9 });
    expect(rangoCalor([null, Number.NaN])).toBeNull();
    expect(rangoCalor([])).toBeNull();
  });
  it("nivelCalor reparte min..max en niveles 0..4", () => {
    expect(nivelCalor(0, 0, 100)).toBe(0);
    expect(nivelCalor(100, 0, 100)).toBe(4);
    expect(nivelCalor(50, 0, 100)).toBe(2);
    expect(nivelCalor(24, 0, 100)).toBe(1);
  });
  it("max === min: nivel 0, nunca NaN", () => {
    expect(nivelCalor(7, 7, 7)).toBe(0);
  });
  it("valor nulo o fuera de rango no produce nivel invalido", () => {
    expect(nivelCalor(null, 0, 10)).toBeNull();
    expect(nivelCalor(Number.NaN, 0, 10)).toBeNull();
    expect(nivelCalor(-5, 0, 10)).toBe(0);
    expect(nivelCalor(50, 0, 10)).toBe(4);
  });
});

describe("normalizarTexto", () => {
  it("sin acentos ni mayusculas ni espacios en los bordes", () => {
    expect(normalizarTexto("  ÉpSilón ")).toBe("epsilon");
  });
});
