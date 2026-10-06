/**
 * Panel de edicion de la ficha: publicar solo con precio guardado, errores en
 * su campo y el cuerpo real del PATCH.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { VehicleEditPanel } from "@/components/dealer-management/VehicleEditPanel";
import type { DealerVehicleStatusRow } from "@/lib/dealer/vehicle-status";

jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { locale: "es-AR", currency: "ARS" }, isPending: false }),
}));
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
const CONTEXT = { tenantId: "t-a", dealerId: "d-a", organizationUnitId: null };
const onSaved = jest.fn();

const BASE: DealerVehicleStatusRow = {
  id: "v-1",
  dealer_id: "d-a",
  make: "Toyota",
  model: "Hilux",
  year: 2021,
  status: "draft",
  vin: null,
  condition: "used",
  price_rd: null,
  price_usd: null,
  price_amount: null,
  price_currency: null,
  display_price_amount: null,
  display_price_currency: null,
  plate: null,
  plate_country: null,
  stock_number: null,
};

function respuesta(status: number, body: unknown) {
  return { ok: status < 300, status, json: async () => body } as unknown as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
  onSaved.mockReset();
});

it("sin precio guardado no ofrece publicar y dice que falta", () => {
  render(<VehicleEditPanel ficha={BASE} context={CONTEXT} onSaved={onSaved} />);
  expect(screen.queryByTestId("vehicle-publicar")).toBeNull();
  expect(screen.getByTestId("vehicle-publicar-falta-precio")).toHaveTextContent("primero cargá el precio");
});

it("con precio en BORRADOR publica con un PATCH de solo status y avisa", async () => {
  fetchMock.mockResolvedValue(respuesta(200, {}));
  render(<VehicleEditPanel ficha={{ ...BASE, price_amount: "100" }} context={CONTEXT} onSaved={onSaved} />);
  expect(screen.getByTestId("vehicle-publicar")).toHaveTextContent("Pasar a Disponible");
  fireEvent.click(screen.getByTestId("vehicle-publicar"));
  await waitFor(() => expect(screen.getByTestId("vehicle-edit-ack")).toHaveTextContent("quedó Disponible"));
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ status: "disponible" });
  expect(onSaved).toHaveBeenCalled();
});

it("ya DISPONIBLE no vuelve a ofrecer publicar", () => {
  render(<VehicleEditPanel ficha={{ ...BASE, status: "disponible", price_amount: "100" }} context={CONTEXT} onSaved={onSaved} />);
  expect(screen.queryByTestId("vehicle-publicar")).toBeNull();
  expect(screen.queryByTestId("vehicle-publicar-falta-precio")).toBeNull();
});

it("guardar manda solo lo que cambio y el reason_code vuelve a su campo", async () => {
  fetchMock.mockResolvedValue(respuesta(422, { detail: { reason_code: "STOCK_NUMBER_TAKEN" } }));
  render(<VehicleEditPanel ficha={BASE} context={CONTEXT} onSaved={onSaved} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Número de stock" }), { target: { value: "S-9" } });
  fireEvent.submit(screen.getByTestId("vehicle-edit-form"));
  await waitFor(() =>
    expect(document.getElementById("edit-stock_number-error")).toHaveTextContent("Ese número de stock ya lo tiene otro vehículo."),
  );
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ stock_number: "S-9" });
  expect(onSaved).not.toHaveBeenCalled();
});

it("la validacion es propia y en español: nada sale con la referencia en la moneda oficial", () => {
  render(<VehicleEditPanel ficha={{ ...BASE, price_amount: "100" }} context={CONTEXT} onSaved={onSaved} />);
  expect(screen.getByTestId("vehicle-edit-form")).toHaveAttribute("novalidate");
  fireEvent.change(screen.getByRole("textbox", { name: /Precio de referencia/ }), { target: { value: "5" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Moneda de la referencia" }), { target: { value: "ARS" } });
  fireEvent.submit(screen.getByTestId("vehicle-edit-form"));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(document.getElementById("edit-display_price_currency-error")).toHaveTextContent("otra moneda");
});

it("sin cambios lo dice y no llama al backend", () => {
  render(<VehicleEditPanel ficha={BASE} context={CONTEXT} onSaved={onSaved} />);
  fireEvent.submit(screen.getByTestId("vehicle-edit-form"));
  expect(screen.getByTestId("vehicle-edit-ack")).toHaveTextContent("No hay cambios");
  expect(fetchMock).not.toHaveBeenCalled();
});
