import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { VENTA_FISCAL_EMPTY, type VentaFiscalForm } from "@/lib/dealer-management/venta-fiscal";
import { VentaFiscalFields } from "../vender/VentaFiscalFields";

function Host({ errors = {} }: { errors?: Record<string, string> }) {
  const [v, setV] = useState<VentaFiscalForm>(VENTA_FISCAL_EMPTY);
  return <VentaFiscalFields value={v} onChange={setV} errors={errors} />;
}

describe("venta: alicuota, base del IVA y permuta", () => {
  it("pide la alicuota vacia y muestra la base del IVA sin poder editarla", () => {
    render(<Host />);
    const alic = screen.getByLabelText(/alícuota/i) as HTMLInputElement;
    expect(alic.value).toBe("");
    const base = screen.getByTestId("venta-base-iva") as HTMLInputElement;
    expect(base.readOnly || base.disabled).toBe(true);
    fireEvent.change(base, { target: { value: "total" } });
    expect(base.value).not.toBe("total");
    expect(screen.getByText(/la calcula el sistema/i)).toBeInTheDocument();
  });

  it("la permuta aparece al pedirla con todos sus campos y avisa del consignado", () => {
    render(<Host />);
    expect(screen.queryByTestId("venta-permuta")).toBeNull();
    fireEvent.click(screen.getByLabelText(/parte de pago/i));
    for (const l of [/valor de toma/i, /marca/i, /modelo/i, /año/i, /vin/i, /kilómetros/i, /patente/i, /origen del usado/i]) {
      expect(screen.getByLabelText(l)).toBeInTheDocument();
    }
    fireEvent.change(screen.getByLabelText(/origen del usado/i), { target: { value: "consignacion" } });
    expect(screen.getByTestId("venta-permuta-consignado")).toHaveTextContent(/no se reconoce ganancia/i);
  });
});
