import { render, screen } from "@testing-library/react";
import { ForgeMetricCard } from "@/components/credit-hub/dealer/ForgeMetricCard";

describe("ForgeMetricCard", () => {
  test("shows skeleton when loading", () => {
    const { container } = render(<ForgeMetricCard label="Total" value={10} loading />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  test('shows "—" when value is null', () => {
    render(<ForgeMetricCard label="Total" value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  test("animates number on first render", () => {
    render(<ForgeMetricCard label="Total" value={8} />);
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  test("trend indicator shows correct direction", () => {
    render(<ForgeMetricCard label="Semana" value={4} trend={{ direction: "up", delta: 4, label: "últimos 7 días" }} />);
    expect(screen.getByText("+4")).toHaveClass("font-semibold");
    expect(screen.getByText("últimos 7 días")).toBeInTheDocument();
  });
});
