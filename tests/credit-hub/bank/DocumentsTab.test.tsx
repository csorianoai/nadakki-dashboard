import { render, screen } from "@testing-library/react";
import { DocumentsTab } from "@/components/credit-hub/bank/sections/DocumentsTab";

describe("DocumentsTab", () => {
  test("disables preview button when document has no URL", () => {
    render(<DocumentsTab docs={[{ id: "d1", name: "Cédula", status: "pendiente" }]} />);
    const btn = screen.getByRole("button", { name: /ver documento/i });
    expect(btn).toBeDisabled();
  });
});
