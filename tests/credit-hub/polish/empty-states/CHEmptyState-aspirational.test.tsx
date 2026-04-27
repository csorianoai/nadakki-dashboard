import { render, screen } from "@testing-library/react";
import { Plus } from "lucide-react";
import { CHEmptyState } from "@/components/credit-hub/system/CHEmptyState";

describe("CHEmptyState aspirational", () => {
  test("renders illustration and primary action", () => {
    render(
      <CHEmptyState
        title="Tu pipeline está esperando"
        description="Empieza ahora."
        primaryAction={{ label: "Crear Primera Solicitud", href: "/credit-hub/dealer/applications/new", icon: <Plus /> }}
      />
    );

    expect(screen.getByRole("img", { name: "Pipeline vacío" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Crear Primera Solicitud/ })).toHaveAttribute("href", "/credit-hub/dealer/applications/new");
  });
});
