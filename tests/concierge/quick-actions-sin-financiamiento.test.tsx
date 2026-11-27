import { render, screen } from "@testing-library/react";
import { QuickActions } from "@/components/concierge/QuickActions";

test("el concierge no ofrece cuotas ni financiamiento sin datos reales", () => {
  render(<QuickActions onAction={() => {}} />);
  expect(screen.getByRole("button", { name: "Agendar visita" })).toBeInTheDocument();
  expect(screen.queryByText(/Calcular cuota|Aplicar financiamiento/)).toBeNull();
});
