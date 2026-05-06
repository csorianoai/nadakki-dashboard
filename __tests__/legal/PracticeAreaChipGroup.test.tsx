import { fireEvent, render, screen } from "@testing-library/react";
import { PracticeAreaChipGroup } from "@/components/legal/PracticeAreaChipGroup";

describe("PracticeAreaChipGroup", () => {
  it("respeta maxVisible y muestra '+N más'", () => {
    const tags = ["bancario", "civil", "laboral", "penal"];
    render(<PracticeAreaChipGroup tags={tags} maxVisible={2} />);
    expect(screen.getByText("Bancario")).toBeInTheDocument();
    expect(screen.getByText("Civil")).toBeInTheDocument();
    expect(screen.queryByText("Laboral")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Mostrar 2 áreas más")).toBeInTheDocument();
  });

  it("expande al click en '+N más'", () => {
    const tags = ["bancario", "civil", "laboral"];
    render(<PracticeAreaChipGroup tags={tags} maxVisible={1} />);
    fireEvent.click(screen.getByLabelText("Mostrar 2 áreas más"));
    expect(screen.getByText("Laboral")).toBeInTheDocument();
  });

  it("no renderiza nada si tags está vacío", () => {
    const { container } = render(<PracticeAreaChipGroup tags={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
