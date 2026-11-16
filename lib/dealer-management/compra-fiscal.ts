/**
 * F4F-6 parte 1: condicion fiscal del vendedor y comprobante de la compra (criterio del contador, punto 1).
 *
 * A un PARTICULAR (consumidor_final) no hay factura: se reconoce con comprobante interno. A una EMPRESA se le pide
 * factura; si aun no la tiene se acepta como comprobante interno (factura pendiente). La alicuota la escribe quien
 * carga la factura: no hay valor por defecto. Lo vacio no se inventa: sin condicion fiscal no viaja bloque fiscal.
 */
import { normalizaImporte } from "@/lib/dealer-management/vehicle-manual";

export const SELLER_TAX_STATUS = [
  { value: "consumidor_final", label: "Particular (consumidor final)" },
  { value: "monotributista", label: "Monotributista" },
  { value: "responsable_inscripto", label: "Responsable inscripto" },
  { value: "exento", label: "Exento" },
] as const;

export type FiscalFields = {
  seller_tax_status: string;
  voucher_kind: string;
  invoice_letter: string;
  invoice_pos: string;
  invoice_number: string;
  net_amount: string;
  vat_amount: string;
  vat_rate: string;
};

export const FISCAL_EMPTY: FiscalFields = {
  seller_tax_status: "", voucher_kind: "", invoice_letter: "", invoice_pos: "", invoice_number: "",
  net_amount: "", vat_amount: "", vat_rate: "",
};

export const esParticular = (f: Pick<FiscalFields, "seller_tax_status">) => f.seller_tax_status === "consumidor_final";
export const conCondicion = (f: Pick<FiscalFields, "seller_tax_status">) =>
  SELLER_TAX_STATUS.some((s) => s.value === f.seller_tax_status);
/** Con particular siempre es interno; con empresa, lo que se elija (vacio = todavia sin factura = interno). */
export const tipoComprobante = (f: FiscalFields): "interno" | "factura" =>
  !esParticular(f) && f.voucher_kind === "factura" ? "factura" : "interno";

const aCentavos = (t: string): number | null => {
  const n = normalizaImporte(t);
  return n === null ? null : Math.round(Number(n) * 100);
};
const tasa = (t: string): number | null =>
  /^\d{1,3}(?:[.,]\d{1,2})?$/.test(t.trim()) && Number(t.replace(",", ".")) <= 100 ? Number(t.replace(",", ".")) : null;

export function validateFiscal(f: FiscalFields, costoCentavos: number | null = null): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.seller_tax_status) return e;
  if (!conCondicion(f)) {
    e.seller_tax_status = "Elige la condición fiscal del vendedor.";
    return e;
  }
  if (tipoComprobante(f) !== "factura") return e;
  if (!/^[ABC]$/.test(f.invoice_letter)) e.invoice_letter = "Elige la letra de la factura (A, B o C).";
  if (!/^\d{1,5}$/.test(f.invoice_pos)) e.invoice_pos = "Indica el punto de venta (hasta 5 números).";
  if (!/^\d{1,8}$/.test(f.invoice_number)) e.invoice_number = "Indica el número de la factura (hasta 8 números).";
  const neto = aCentavos(f.net_amount);
  const iva = aCentavos(f.vat_amount);
  const alic = tasa(f.vat_rate);
  if (neto === null) e.net_amount = "Indica el neto de la factura.";
  if (iva === null) e.vat_amount = "Indica el IVA de la factura (0 si no tiene).";
  if (alic === null) e.vat_rate = "Indica la alícuota tal como figura en la factura; no se supone ninguna.";
  if (neto !== null && iva !== null && alic !== null && Math.abs(iva - Math.round((neto * alic) / 100)) > 1) {
    e.vat_amount = "El IVA no sale del neto por la alícuota indicada. Revisa los tres valores.";
  } else if (neto !== null && iva !== null && costoCentavos !== null && neto + iva !== costoCentavos) {
    e.net_amount = "El neto más el IVA de la factura debe dar el costo de la compra. Revisa el neto, el IVA o el costo.";
  }
  return e;
}

/** Bloque `fiscal` de CompraIn; undefined si no se indico condicion fiscal. */
export function fiscalPayload(f: FiscalFields): Record<string, string> | undefined {
  if (!conCondicion(f)) return undefined;
  if (tipoComprobante(f) === "interno") return { seller_tax_status: f.seller_tax_status, voucher_kind: "interno" };
  return {
    seller_tax_status: f.seller_tax_status, voucher_kind: "factura", invoice_letter: f.invoice_letter,
    invoice_pos: f.invoice_pos, invoice_number: f.invoice_number, net_amount: normalizaImporte(f.net_amount) ?? "",
    vat_amount: normalizaImporte(f.vat_amount) ?? "", vat_rate: f.vat_rate.trim().replace(",", "."),
  };
}
