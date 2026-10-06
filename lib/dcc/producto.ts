/**
 * Constantes del PRODUCTO (no del tenant). La firma es la marca de Nadakki y se
 * muestra igual para todo tenant; el nombre y el logo siguen saliendo del
 * branding. Dealer: decision de Cesar en la R1. Banco: decision D-B4.
 */
export const DCC_PRODUCTOS = {
  dealer: { firma: "con Nadakki Dealer OS" },
  banco: { firma: "con Nadakki Credit Hub" },
} as const;

export type ProductoDcc = keyof typeof DCC_PRODUCTOS;

/** Producto del dealer. Se conserva para quien ya lo importa (DealerSidebar). */
export const DCC_PRODUCTO = DCC_PRODUCTOS.dealer;
