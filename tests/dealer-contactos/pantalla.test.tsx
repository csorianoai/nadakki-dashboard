import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Pantalla from "@/app/autos/dealer/contactos/page";
import { ContactoSelector } from "@/app/autos/dealer/contactos/ContactoSelector";
import { contactosApi } from "@/app/autos/dealer/contactos/contactos-api";
jest.mock("@/app/autos/dealer/contactos/contactos-api", () => ({
  contactosApi: { listar: jest.fn(), obtener: jest.fn(), editar: jest.fn(), crear: jest.fn(), buscarDocumento: jest.fn() },
  ContactosError: class extends Error {},
}));
const contacto = { id: "c1", display_name: "Ana Pérez", kind: "fisica", dni: "*****678", deactivated_at: null };
beforeEach(() => { jest.clearAllMocks(); (contactosApi.listar as jest.Mock).mockResolvedValue({ items: [contacto] }); });
test("carga, ficha enmascarada y baja lógica sin DELETE", async () => {
  (contactosApi.obtener as jest.Mock).mockResolvedValue(contacto);
  (contactosApi.editar as jest.Mock).mockResolvedValue({ ...contacto, deactivated_at: "2026-11-13" });
  render(<Pantalla />);
  expect(screen.getByRole("status")).toHaveTextContent("Cargando");
  fireEvent.click(await screen.findByRole("button", { name: /Ana Pérez/ }));
  await screen.findByRole("region", { name: /Ficha de/ });
  expect(screen.queryByText("12345678")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /eliminar|borrar/i })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Motivo de baja"), { target: { value: "Duplicado" } });
  fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
  await waitFor(() => expect(contactosApi.editar).toHaveBeenCalledWith("c1", { deactivation_reason: "Duplicado" }));
  await screen.findByRole("button", { name: "Reactivar" });
});
test("vacío y error visibles", async () => {
  (contactosApi.listar as jest.Mock).mockResolvedValue({ items: [] });
  render(<Pantalla />);
  await screen.findByText("No hay contactos vigentes.");
  (contactosApi.buscarDocumento as jest.Mock).mockRejectedValue(new Error());
  fireEvent.change(screen.getByLabelText("Buscar por documento"), { target: { value: "12345678" } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
  await screen.findByRole("alert");
});
test("selector no elige automáticamente y excluye bajas", async () => {
  (contactosApi.listar as jest.Mock).mockResolvedValue({ items: [contacto, { ...contacto, id: "baja", display_name: "Baja", deactivated_at: "2026-11-13" }] });
  const cambio = jest.fn(); render(<ContactoSelector value="" onChange={cambio} />);
  await screen.findByRole("option", { name: /Ana/ });
  expect(cambio).not.toHaveBeenCalled();
  expect(screen.queryByRole("option", { name: /Baja/ })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Contacto vendedor"), { target: { value: "c1" } });
  expect(cambio).toHaveBeenCalledWith("c1");
});
