import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Page from "@/app/autos/dealer/inventario/nuevo/page";
import { createVehiclePurchase } from "@/lib/dealer-management/vehicle-purchase";
import { accessApiErrorFromHttp } from "@/lib/access/client";
import { VEHICLE_FORM_EMPTY } from "@/lib/dealer-management/vehicle-manual";
import { PURCHASE_EMPTY } from "@/lib/dealer-management/vehicle-purchase";
const vehicle = { ...VEHICLE_FORM_EMPTY, make: "Toyota", model: "Hilux", year: "2021" };
const purchase = { ...PURCHASE_EMPTY, cost: "100", currency: "ARS" };
let branding: { tenant_id: string; currency: string } | null;
let doubleClick = false;
const push = jest.fn();
const uuid = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
jest.mock("@/lib/dealer/access-context", () => ({ selectedDealerIdentity: () => ({ tenantId: "t1", dealerId: "d1", organizationUnitId: null }), resolveDealerAccessContext: () => ({}) }));
jest.mock("@/lib/access/hooks", () => ({ useAccessEntitlementsBatch: () => ({ data: { results: { "autos.inventory.create": { allowed: true }, "autos.purchases.register": { allowed: true } } }, isLoading: false }) }));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({ useDealerManagementBranding: () => ({ data: branding, isPending: false, isLoading: false, error: null }) }));
jest.mock("@/lib/dealer-management/vehicle-purchase", () => ({ ...jest.requireActual("@/lib/dealer-management/vehicle-purchase"), createVehiclePurchase: jest.fn() }));
jest.mock("@/components/dealer-management/VehicleManualForm", () => ({ VehicleManualForm: ({ onSubmit, busy, errorReasonCode, ack }: { onSubmit: (v: unknown, p: unknown) => void; busy: boolean; errorReasonCode: string | null; ack: string | null }) => <div>
  <button disabled={busy} onClick={() => { onSubmit(vehicle, purchase); if (doubleClick) onSubmit(vehicle, purchase); }}>Enviar compra</button>
  {errorReasonCode && <p role="alert">{errorReasonCode}</p>}{ack && <p role="status">{ack}</p>}
</div> }));
beforeEach(() => {
  jest.clearAllMocks(); branding = { tenant_id: "t1", currency: "ARS" }; doubleClick = false;
  uuid.mockReturnValueOnce("11111111-1111-4111-8111-111111111111").mockReturnValueOnce("22222222-2222-4222-8222-222222222222");
  Object.defineProperty(globalThis.crypto, "randomUUID", { configurable: true, value: uuid });
  (createVehiclePurchase as jest.Mock).mockResolvedValue({ vehicle_id: "v1" });
});
test("firma real: cinco argumentos, moneda autorizada y UUID seguro", async () => {
  render(<Page />); fireEvent.click(screen.getByText("Enviar compra"));
  await waitFor(() => expect(createVehiclePurchase).toHaveBeenCalledTimes(1));
  expect((createVehiclePurchase as jest.Mock).mock.calls[0]).toEqual([{ tenantId: "t1", dealerId: "d1", organizationUnitId: null }, vehicle, purchase, "ARS", "11111111-1111-4111-8111-111111111111"]);
});
test.each([null, { tenant_id: "t1", currency: "" }, { tenant_id: "otro", currency: "USD" }])("sin moneda funcional autorizada falla cerrado: %j", (data) => {
  branding = data; render(<Page />); expect(screen.queryByText("Enviar compra")).not.toBeInTheDocument(); expect(createVehiclePurchase).not.toHaveBeenCalled();
});
test("doble clic síncrono: una sola operación y botón deshabilitado", async () => {
  doubleClick = true; (createVehiclePurchase as jest.Mock).mockReturnValue(new Promise(() => {}));
  render(<Page />); fireEvent.click(screen.getByText("Enviar compra"));
  expect(createVehiclePurchase).toHaveBeenCalledTimes(1); expect(uuid).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Enviar compra")).toBeDisabled();
});
test("error de red ambiguo: reintento explícito conserva la clave y no habilita compra nueva", async () => {
  (createVehiclePurchase as jest.Mock).mockRejectedValueOnce(new TypeError("Network failure")).mockResolvedValueOnce({ vehicle_id: "v1" });
  render(<Page />); fireEvent.click(screen.getByText("Enviar compra"));
  const retry = await screen.findByRole("button", { name: "Reintentar la misma compra" });
  expect(screen.getByText("Enviar compra")).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Registrar otra compra" })).not.toBeInTheDocument();
  fireEvent.click(retry); await waitFor(() => expect(createVehiclePurchase).toHaveBeenCalledTimes(2));
  const calls = (createVehiclePurchase as jest.Mock).mock.calls; expect(calls[1]).toEqual(calls[0]); expect(uuid).toHaveBeenCalledTimes(1);
});
test("compra completada no se repite y una compra independiente usa clave nueva", async () => {
  render(<Page />); fireEvent.click(screen.getByText("Enviar compra"));
  fireEvent.click(await screen.findByRole("button", { name: "Registrar otra compra" }));
  fireEvent.click(screen.getByText("Enviar compra"));
  await waitFor(() => expect(createVehiclePurchase).toHaveBeenCalledTimes(2));
  expect((createVehiclePurchase as jest.Mock).mock.calls.map(c => c[4])).toEqual(["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"]);
});
test.each([422, 403, 409, 500])("respuesta %s visible, sin reintento automático y con recuperación", async (status) => {
  (createVehiclePurchase as jest.Mock).mockRejectedValueOnce(accessApiErrorFromHttp(status, { detail: { reason_code: `HTTP_${status}` } }, "/purchase")).mockResolvedValueOnce({ vehicle_id: "v1" });
  render(<Page />); fireEvent.click(screen.getByText("Enviar compra"));
  expect(await screen.findByRole("alert")).toHaveTextContent(`HTTP_${status}`);
  expect(createVehiclePurchase).toHaveBeenCalledTimes(1);
  fireEvent.click(status >= 500 ? screen.getByRole("button", { name: "Reintentar la misma compra" }) : screen.getByText("Enviar compra"));
  await waitFor(() => expect(createVehiclePurchase).toHaveBeenCalledTimes(2));
  expect((createVehiclePurchase as jest.Mock).mock.calls[1][4]).toBe((createVehiclePurchase as jest.Mock).mock.calls[0][4]);
});
