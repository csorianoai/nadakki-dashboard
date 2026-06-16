import { render, screen } from "@testing-library/react";
import { DealerProfileView } from "@/components/credit-hub/dealer/DealerProfileView";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ tenantName: "Jorge Salinas" }),
}));

describe("DealerProfileView", () => {
  test("renders profile form", () => {
    render(
      <div className="credit-hub-forge" data-persona="dealer">
        <DealerProfileView institutionName="Auto Plaza" locale="es-DO" roleLabel="Asesor" />
      </div>,
    );
    expect(screen.getByRole("heading", { name: /Perfil/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre para mostrar/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cambiar contraseña/i })).toBeDisabled();
  });
});
