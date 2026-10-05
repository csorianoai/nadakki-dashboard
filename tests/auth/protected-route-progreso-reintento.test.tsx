/**
 * W0-2: el spinner "Verificando sesion..." no se queda mudo mientras el init
 * reintenta. ProtectedRoute pinta el progreso que expone el AuthProvider.
 */
import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "@/components/forge/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));

const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;

function conAuth(parcial: Partial<ReturnType<typeof useAuth>>) {
  useAuthMock.mockReturnValue({
    isAuthenticated: false,
    isLoading: true,
    initError: null,
    initProgress: null,
    retryInit: jest.fn(),
    logout: jest.fn(),
    ...parcial,
  } as unknown as ReturnType<typeof useAuth>);
}

describe("ProtectedRoute: progreso del reintento bajo el spinner", () => {
  test("primer intento: solo 'Verificando sesion...'", () => {
    conAuth({});
    render(<ProtectedRoute>panel</ProtectedRoute>);
    expect(screen.getByText("Verificando sesion...")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });

  test.each(["Reintentando conexión (2 de 3)…", "Reintentando conexión (3 de 3)…"])(
    "reintentando: pinta %s",
    (texto) => {
      conAuth({ initProgress: texto });
      render(<ProtectedRoute>panel</ProtectedRoute>);
      expect(screen.getByText("Verificando sesion...")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(texto);
      expect(screen.queryByText("panel")).toBeNull();
    },
  );
});
