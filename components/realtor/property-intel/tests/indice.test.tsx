import { fireEvent, render, screen } from "@testing-library/react";
import PropertyIntelIndexPage from "@/app/realtor/property-intel/page";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const ID = "0b9f6d3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f";
beforeEach(() => { push.mockReset(); mockApiFetch.mockReset(); });

it("(a) la página índice renderiza pi-index", () => {
  render(<PropertyIntelIndexPage />);
  expect(screen.getByTestId("pi-index")).toBeInTheDocument();
});

it("(b) UUID válido navega, a propiedad y a unidad", () => {
  render(<PropertyIntelIndexPage />);
  fireEvent.change(screen.getByLabelText("Identificador"), { target: { value: ID } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar propiedad" }));
  expect(push).toHaveBeenCalledWith(`/realtor/property-intel/${ID}`);
  fireEvent.click(screen.getByRole("button", { name: "Buscar unidad" }));
  expect(push).toHaveBeenCalledWith(`/realtor/property-intel/${ID}?unit=${ID}`);
});

it("(b) id no UUID: «Identificador no válido», sin navegar ni llamar a la API", () => {
  render(<PropertyIntelIndexPage />);
  fireEvent.change(screen.getByLabelText("Identificador"), { target: { value: "abc" } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar propiedad" }));
  expect(screen.getByText("Identificador no válido")).toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
  expect(mockApiFetch).not.toHaveBeenCalled();
});
