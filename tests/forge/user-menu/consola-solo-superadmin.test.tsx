/**
 * DECISION_CESAR 16-nov-2026: «Consola de Plataforma» solo para platform_superadmin.
 */
import { fireEvent, render, screen } from "@testing-library/react";

import { UserMenu } from "@/components/forge/auth/UserMenu";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

type Role = { core_name: string; role_key: string };
let allRoles: Role[] = [];
let activeRole: Role | null = null;

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { email: "cesar@baylara.com", is_active: true },
    activeRole,
    allRoles,
    logout: jest.fn(),
  }),
}));

const TA: Role = { core_name: "platform", role_key: "tenant_admin" };
const SA: Role = { core_name: "platform", role_key: "platform_superadmin" };

function abrir() {
  render(<UserMenu />);
  fireEvent.click(screen.getByRole("button", { name: /user menu/i }));
}

describe("UserMenu: Consola de Plataforma", () => {
  it("tenant_admin no la ve", () => {
    allRoles = [TA];
    activeRole = TA;
    abrir();
    expect(screen.queryByText("Consola de Plataforma")).toBeNull();
    expect(screen.getByText("Cerrar sesion")).toBeTruthy();
  });

  it("platform_superadmin la ve", () => {
    allRoles = [SA];
    activeRole = SA;
    abrir();
    expect(screen.getByText("Consola de Plataforma")).toBeTruthy();
  });

  it("superadmin con rol activo distinto la ve", () => {
    allRoles = [TA, SA];
    activeRole = TA;
    abrir();
    expect(screen.getByText("Consola de Plataforma")).toBeTruthy();
  });
});
