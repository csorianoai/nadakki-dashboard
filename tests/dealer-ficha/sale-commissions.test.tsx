/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DealerSaleCommissions } from "@/app/autos/dealer/inventario/[vehicleId]/DealerSaleCommissions";
import { apiFetch } from "@/lib/api/fetch-client";
import {
  commissionErrorMessage,
  saleCommissionListUrl,
} from "@/lib/dealer-management/vehicle-sale";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

const api = apiFetch as jest.MockedFunction<typeof apiFetch>;
const COMMISSION = {
  id: "commission-1",
  vehicle_id: "vehicle-1",
  salesperson_user_id: "22222222-2222-4222-8222-222222222222",
  amount: "1500.00",
  currency: "DOP",
  status: "pending",
  sold_at: "2026-11-20T15:00:00Z",
  paid_at: null,
  month: "2026-11",
};

function response(body: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => body } as Response;
}

describe("comisiones de venta del vehículo", () => {
  beforeEach(() => {
    api.mockReset();
    api.mockResolvedValue(response({ items: [], summary: [], tz: "America/Santo_Domingo" }));
  });

  it("consulta el vendedor/mes con la zona horaria y muestra el resumen real", async () => {
    api.mockResolvedValue(response({ items: [COMMISSION], summary: [{
      salesperson_user_id: COMMISSION.salesperson_user_id,
      month: "2026-11", currency: "DOP", pending_amount: "1500.00",
      paid_amount: "0.00", total_amount: "1500.00", pending_count: 1, paid_count: 0,
    }], tz: "America/Santo_Domingo" }));

    render(<DealerSaleCommissions vehicleId="vehicle-1" dealerId="dealer-1" tenantId="tenant-1" currency="DOP" timeZone="America/Santo_Domingo" />);

    expect(await screen.findByTestId("sale-commission-summary")).toHaveTextContent(/Pendiente 1500,00 DOP/);
    expect(api).toHaveBeenCalledWith(expect.stringContaining("/api/v1/autos/dealers/dealer-1/sale-commissions"), expect.anything());
    expect(saleCommissionListUrl("dealer-1", "2026-11", "America/Santo_Domingo")).toContain("month=2026-11");
  });

  it("registra la comisión con el vendedor, importe y moneda introducidos", async () => {
    api.mockImplementation(async (path) => {
      if (String(path).includes("sale-commissions")) return response({ items: [], summary: [], tz: "UTC" });
      return response({ id: "commission-1", status: "pending" });
    });
    render(<DealerSaleCommissions vehicleId="vehicle-1" dealerId="dealer-1" tenantId="tenant-1" currency="DOP" timeZone="UTC" />);

    fireEvent.change(screen.getByLabelText("ID del vendedor"), { target: { value: COMMISSION.salesperson_user_id } });
    fireEvent.change(screen.getByLabelText("Importe de la comisión"), { target: { value: "1500.00" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar comisión" }));

    await waitFor(() => expect(api).toHaveBeenCalledWith("/api/v1/autos/vehicles/vehicle-1/sale/commissions", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ salesperson_user_id: COMMISSION.salesperson_user_id, amount: "1500.00", currency: "DOP" }),
    })));
    await waitFor(() => expect(screen.getByLabelText("Mes de la venta")).toHaveValue(""));
  });

  it("paga con cash_account obligatorio y traduce errores del backend al español", async () => {
    api.mockResolvedValueOnce(response({ items: [COMMISSION], summary: [], tz: "UTC" }));
    render(<DealerSaleCommissions vehicleId="vehicle-1" dealerId="dealer-1" tenantId="tenant-1" currency="DOP" timeZone="UTC" />);
    await screen.findByTestId("sale-commission-commission-1");

    fireEvent.change(screen.getByLabelText("Medio de pago de commission-1"), { target: { value: "bank" } });
    fireEvent.click(screen.getByRole("button", { name: "Pagar comisión commission-1" }));

    await waitFor(() => expect(api).toHaveBeenCalledWith("/api/v1/autos/sale-commissions/commission-1/pay", expect.objectContaining({
      method: "POST", body: JSON.stringify({ cash_account: "bank" }),
    })));
    expect(commissionErrorMessage("SELF_PAYMENT_FORBIDDEN")).toMatch(/No puedes pagar/);
    expect(commissionErrorMessage("ALREADY_PAID")).toMatch(/ya fue pagada/);
    expect(commissionErrorMessage("PAID_BEFORE_SALE")).toMatch(/anterior a la fecha de la venta/);
    expect(commissionErrorMessage("DEALER_WITHOUT_UNIT")).toMatch(/unidad organizativa/);
  });

  it.each([
    ["SELF_PAYMENT_FORBIDDEN", "No puedes pagar una comisión"],
    ["ALREADY_PAID", "Esta comisión ya fue pagada"],
    ["PAID_BEFORE_SALE", "anterior a la fecha de la venta"],
    ["DEALER_WITHOUT_UNIT", "unidad organizativa"],
  ])("muestra en español el error %s al pagar", async (code, message) => {
    api.mockImplementation(async (path) => {
      if (String(path).includes("/pay")) return response({ detail: { reason_code: code } }, 409);
      return response({ items: [COMMISSION], summary: [], tz: "UTC" });
    });
    render(<DealerSaleCommissions vehicleId="vehicle-1" dealerId="dealer-1" tenantId="tenant-1" currency="DOP" timeZone="UTC" />);
    await screen.findByTestId("sale-commission-commission-1");
    fireEvent.change(screen.getByLabelText("Medio de pago de commission-1"), { target: { value: "cash" } });
    fireEvent.click(screen.getByRole("button", { name: "Pagar comisión commission-1" }));
    expect(await screen.findByTestId("sale-commission-pay-error-commission-1")).toHaveTextContent(message);
  });
});
