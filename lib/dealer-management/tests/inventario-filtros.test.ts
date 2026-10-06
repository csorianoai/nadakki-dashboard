/** Busqueda, filtro por estado y orden del inventario (auditoria Mapaal QA, P1). */
import { FILTROS_VACIOS, estadosPresentes, filtrarInventario } from "@/lib/dealer-management/inventario-filtros";
import type { DealerInventoryVehicle } from "@/lib/dealer-management/inventory";

const v = (id: string, extra: Partial<DealerInventoryVehicle>): DealerInventoryVehicle => ({
  id,
  make: null,
  model: null,
  year: null,
  status: null,
  ...extra,
});

const LISTA = [
  v("a", { make: "Toyota", model: "Hilux", year: "2021", status: "disponible", plate: "AB123CD", stock_number: "S-1", price_amount: 300 }),
  v("b", { make: "Peugeot", model: "208", year: "2018", status: "draft", stock_number: "S-2", price_amount: 100 }),
  v("c", { make: "Citroën", model: "C3", year: "2023", status: "disponible", vin: "8AJFA3CD9N0123456" }),
];

const ids = (r: DealerInventoryVehicle[]) => r.map((x) => x.id);

it("sin filtros devuelve todo en el orden del backend", () => {
  expect(ids(filtrarInventario(LISTA, FILTROS_VACIOS))).toEqual(["a", "b", "c"]);
});

it("busca por marca, modelo, año, dominio, stock y VIN, sin tildes ni mayusculas", () => {
  const busca = (texto: string) => ids(filtrarInventario(LISTA, { ...FILTROS_VACIOS, texto }));
  expect(busca("toyota")).toEqual(["a"]);
  expect(busca("citroen c3")).toEqual(["c"]);
  expect(busca("2018")).toEqual(["b"]);
  expect(busca("ab 123 cd")).toEqual(["a"]);
  expect(busca("s-2")).toEqual(["b"]);
  expect(busca("0123456")).toEqual(["c"]);
  expect(busca("ferrari")).toEqual([]);
});

it("filtra por estado", () => {
  expect(ids(filtrarInventario(LISTA, { ...FILTROS_VACIOS, estado: "disponible" }))).toEqual(["a", "c"]);
});

it("ordena por año, marca y precio; sin precio va al final en ambos sentidos", () => {
  const ordena = (orden: Parameters<typeof filtrarInventario>[1]["orden"]) =>
    ids(filtrarInventario(LISTA, { ...FILTROS_VACIOS, orden }));
  expect(ordena("anio-desc")).toEqual(["c", "a", "b"]);
  expect(ordena("anio-asc")).toEqual(["b", "a", "c"]);
  expect(ordena("marca")).toEqual(["c", "b", "a"]);
  expect(ordena("precio-asc")).toEqual(["b", "a", "c"]);
  expect(ordena("precio-desc")).toEqual(["a", "b", "c"]);
});

it("no muta la lista recibida", () => {
  const copia = [...LISTA];
  filtrarInventario(LISTA, { ...FILTROS_VACIOS, orden: "anio-asc" });
  expect(LISTA).toEqual(copia);
});

it("el filtro de estado ofrece solo los presentes, en el orden del ciclo", () => {
  expect(estadosPresentes(LISTA, ["draft", "disponible", "reservado"])).toEqual(["draft", "disponible"]);
});
