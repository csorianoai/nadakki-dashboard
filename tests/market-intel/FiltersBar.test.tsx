import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  FiltersBar,
  countActiveMeeFilters,
} from "@/app/market-intel/components/FiltersBar";
import type { MeeFilters } from "@/app/market-intel/lib/types";

function FiltersHarness({ initial }: { initial: MeeFilters }) {
  const [filters, setFilters] = useState(initial);
  return <FiltersBar filters={filters} setFilters={setFilters} />;
}

describe("FiltersBar polish", () => {
  test("countActiveMeeFilters cuenta filtros no-default", () => {
    expect(
      countActiveMeeFilters({ segment: "all", confidence: "alto", tier: "Tier1" }),
    ).toBe(2);
  });

  test("muestra contador y botón Limpiar cuando hay filtros activos", async () => {
    render(
      <FiltersHarness
        initial={{ segment: "usados", confidence: "alto", tier: "all" }}
      />,
    );

    expect(screen.getByLabelText("2 filtros activos")).toHaveTextContent("· 2");
    expect(screen.getByRole("button", { name: /Limpiar/i })).toBeInTheDocument();

    const segButton = screen.getByRole("button", { name: "Usados" });
    expect(segButton).toHaveAttribute("aria-pressed", "true");
    expect(segButton).toHaveAttribute("data-on", "true");

    await userEvent.click(screen.getByRole("button", { name: /Limpiar/i }));
    expect(screen.queryByLabelText(/filtros activos/i)).not.toBeInTheDocument();
  });

  test("sin filtros activos no muestra contador ni Limpiar", () => {
    render(
      <FiltersHarness
        initial={{ segment: "all", confidence: "all", tier: "all" }}
      />,
    );

    expect(screen.getByText("Filtros")).toBeInTheDocument();
    expect(screen.queryByLabelText(/filtros activos/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Limpiar/i })).not.toBeInTheDocument();
  });
});
