/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { CaseStrategyMultiSelect } from "@/components/legal/cases/CaseStrategyMultiSelect";
import type { CaseStrategy } from "@/lib/legal/cases/case-types";

const s = (id: string): CaseStrategy => ({
  strategy_id: id,
  name: `Estrategia ${id}`,
  description: "Desc",
  legal_basis: "Base",
  rationale: "Raz",
  expected_strength: 0.5,
  risks: [],
  selected: false,
  status: "proposed",
});

describe("CaseStrategyMultiSelect", () => {
  it("permite seleccionar varias estrategias", async () => {
    const onChange = jest.fn();
    render(
      <CaseStrategyMultiSelect
        strategies={[s("a"), s("b")]}
        selectedIds={[]}
        onChange={onChange}
        onSubmit={() => {}}
      />
    );
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(2);
  });
});
