import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useAuth, AuthProvider } from "@/lib/auth-context";

describe("AuthContext", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn((key: string) => {
          if (key === "nadakki_sic_token") return "fake.jwt.token";
          if (key === "user_id") return "user-123";
          if (key === "nadakki_role") return "dealer";
          if (key === "nadakki_tenant_id") return "tenant-123";
          return null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
    document.documentElement.setAttribute("data-tenant", "nadakki");
  });

  test("useAuth throws outside provider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");
  });

  test("useAuth returns auth data inside provider", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.tenantId).toBe("tenant-123");
    expect(result.current.role).toBe("dealer");
    expect(result.current.userId).toBe("user-123");
  });
});
