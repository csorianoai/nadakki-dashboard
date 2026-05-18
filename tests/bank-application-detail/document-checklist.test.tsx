import { render, screen } from "@testing-library/react";
import { DocumentChecklist } from "@/app/(bank)/bank/applications/[id]/components/DocumentChecklist";

describe("DocumentChecklist", () => {
  test("shows empty message when no documents", () => {
    render(<DocumentChecklist documents={[]} />);
    expect(screen.getByText(/no hay documentos listados/i)).toBeInTheDocument();
  });

  test("lists document name and status", () => {
    render(
      <DocumentChecklist documents={[{ id: "1", name: "ID", status: "ok" }]} />,
    );
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("ok")).toBeInTheDocument();
  });
});
