/**
 * PS-1-SESION-UI: pantalla /cambiar-contrasena. Envía el cambio, muestra errores
 * del backend por error_code y vuelve a / cuando la sesión carga.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CambiarContrasenaPage from "@/app/(auth)/cambiar-contrasena/page";
import { useAuth } from "@/hooks/useAuth";
import { tokenStorage } from "@/lib/auth/token-storage";

const replace = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { getRefreshToken: jest.fn(() => "refresh-ficticio") },
}));

const useAuthMock = useAuth as jest.Mock;
const changePassword = jest.fn();

function estado(over: Record<string, unknown> = {}) {
  useAuthMock.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    mustChangePassword: true,
    changePassword,
    ...over,
  });
}

function llenar(actual: string, nueva: string, conf: string) {
  fireEvent.change(screen.getByLabelText("Contraseña actual"), { target: { value: actual } });
  fireEvent.change(screen.getByLabelText("Contraseña nueva"), { target: { value: nueva } });
  fireEvent.change(screen.getByLabelText("Confirmar contraseña nueva"), { target: { value: conf } });
  fireEvent.submit(screen.getByRole("form", { name: "Cambiar contraseña" }));
}

beforeEach(() => {
  jest.clearAllMocks();
  (tokenStorage.getRefreshToken as jest.Mock).mockReturnValue("refresh-ficticio");
  estado();
});

describe("CambiarContrasenaPage", () => {
  it("no envía si la confirmación no coincide", () => {
    render(<CambiarContrasenaPage />);
    llenar("actual-ficticia", "nueva-ficticia-1234", "otra-ficticia-1234");
    expect(screen.getByRole("alert").textContent).toMatch(/no coincide/);
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("no envía si la nueva es demasiado corta", () => {
    render(<CambiarContrasenaPage />);
    llenar("actual-ficticia", "corta", "corta");
    expect(screen.getByRole("alert").textContent).toMatch(/al menos 12/);
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("envía el cambio y no muestra error si el backend acepta", async () => {
    changePassword.mockResolvedValue({ ok: true });
    render(<CambiarContrasenaPage />);
    llenar("actual-ficticia", "nueva-ficticia-1234", "nueva-ficticia-1234");
    await waitFor(() => expect(changePassword).toHaveBeenCalledWith("actual-ficticia", "nueva-ficticia-1234"));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("muestra el mensaje del error_code INVALID_CURRENT_PASSWORD", async () => {
    changePassword.mockResolvedValue({ ok: false, errorCode: "INVALID_CURRENT_PASSWORD" });
    render(<CambiarContrasenaPage />);
    llenar("actual-ficticia", "nueva-ficticia-1234", "nueva-ficticia-1234");
    expect((await screen.findByRole("alert")).textContent).toMatch(/actual no es correcta/);
  });

  it("muestra el mensaje genérico ante un error desconocido", async () => {
    changePassword.mockResolvedValue({ ok: false });
    render(<CambiarContrasenaPage />);
    llenar("actual-ficticia", "nueva-ficticia-1234", "nueva-ficticia-1234");
    expect((await screen.findByRole("alert")).textContent).toMatch(/No se pudo cambiar/);
  });

  it("vuelve a / cuando la sesión ya cargó sin cambio pendiente", () => {
    estado({ isAuthenticated: true, mustChangePassword: false });
    render(<CambiarContrasenaPage />);
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("manda a /login si no hay sesión ni refresh token", () => {
    estado({ mustChangePassword: false });
    (tokenStorage.getRefreshToken as jest.Mock).mockReturnValue(null);
    render(<CambiarContrasenaPage />);
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
