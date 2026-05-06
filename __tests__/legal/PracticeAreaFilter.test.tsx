import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { PracticeAreaFilter } from "@/components/legal/PracticeAreaFilter";

function FilterHarness({ initial }: { initial: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  return (
    <div>
      <PracticeAreaFilter selected={selected} onChange={setSelected} />
      <span data-testid="out">{selected.join(",")}</span>
    </div>
  );
}

describe("PracticeAreaFilter", () => {
  it("agrupa por categoría con labels en español", () => {
    render(<FilterHarness initial={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /filtrar por área legal/i }));
    expect(screen.getByText("Comercial / Financiero")).toBeInTheDocument();
    expect(screen.getByText("Litigio penal")).toBeInTheDocument();
  });

  it("toggle agrega/remueve del array selected", () => {
    render(<FilterHarness initial={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /filtrar por área legal/i }));
    const penalBtn = screen.getByRole("option", { name: "Penal" });
    fireEvent.click(penalBtn);
    expect(screen.getByTestId("out")).toHaveTextContent("penal");
    fireEvent.click(penalBtn);
    expect(screen.getByTestId("out")).toHaveTextContent("");
  });

  it("'Limpiar todo' vacía la selección", () => {
    render(<FilterHarness initial={["civil", "bancario"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar todo" }));
    expect(screen.getByTestId("out")).toHaveTextContent("");
  });

  it("dropdown se cierra con Escape", () => {
    render(<FilterHarness initial={[]} />);
    const trigger = screen.getByRole("button", { name: /filtrar por área legal/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opciones son keyboard-navigable", () => {
    render(<FilterHarness initial={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /filtrar por área legal/i }));
    const list = screen.getByRole("listbox");
    const opts = within(list).getAllByRole("option");
    expect(opts.length).toBeGreaterThan(5);
    opts[0]?.focus();
    expect(document.activeElement).toBe(opts[0]);
  });
});
