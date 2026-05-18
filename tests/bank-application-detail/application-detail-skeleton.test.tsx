import { render, screen } from "@testing-library/react";
import { ApplicationDetailSkeleton } from "@/app/(bank)/bank/applications/[id]/components/ApplicationDetailSkeleton";

describe("ApplicationDetailSkeleton", () => {
  test("exposes loading status for assistive tech", () => {
    render(<ApplicationDetailSkeleton />);
    expect(screen.getByRole("status", { name: /cargando detalle/i })).toBeInTheDocument();
  });
});
