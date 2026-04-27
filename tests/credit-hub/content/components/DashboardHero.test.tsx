import { render, screen } from "@testing-library/react";
import { DashboardHero, getTimeGreeting } from "@/components/credit-hub/dealer/DashboardHero";

describe("DashboardHero", () => {
  test("shows time-aware greeting", () => {
    expect(getTimeGreeting(new Date("2026-04-27T09:00:00"))).toBe("Buenos días");
    expect(getTimeGreeting(new Date("2026-04-27T15:00:00"))).toBe("Buenas tardes");
    expect(getTimeGreeting(new Date("2026-04-27T21:00:00"))).toBe("Buenas noches");
  });

  test("shows pendingCount or null state", () => {
    const { rerender } = render(<DashboardHero pendingCount={null} />);
    expect(screen.getByText("Vista general de tu portafolio")).toBeInTheDocument();

    rerender(<DashboardHero pendingCount={0} />);
    expect(screen.getByText("No hay solicitudes pendientes hoy.")).toBeInTheDocument();
  });

  test("CTA buttons navigate correctly", () => {
    render(<DashboardHero pendingCount={2} />);
    expect(screen.getByRole("link", { name: /Nueva Solicitud/ })).toHaveAttribute("href", "/credit-hub/dealer/applications/new");
    expect(screen.getByRole("link", { name: /Ver Todas/ })).toHaveAttribute("href", "/credit-hub/dealer/applications");
  });
});
