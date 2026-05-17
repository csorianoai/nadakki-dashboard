/** @jest-environment jsdom */

import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueueFilters } from "@/app/(bank)/bank/applications/queue/components/QueueFilters";

describe("QueueFilters", () => {
  it("updates search text", async () => {
    const user = userEvent.setup();
    const searchRef = createRef<HTMLInputElement>();
    const onSearchChange = jest.fn();
    const onFiltersChange = jest.fn();

    render(
      <QueueFilters
        searchRef={searchRef}
        search=""
        filters={{ status: "", sortBy: "sla_priority", limit: 50 }}
        onSearchChange={onSearchChange}
        onFiltersChange={onFiltersChange}
      />,
    );

    await user.type(screen.getByPlaceholderText(/Nombre, dealer o ID/), "ana");
    expect(onSearchChange).toHaveBeenCalled();
  });

  it("changes sort_by selection", async () => {
    const user = userEvent.setup();
    const searchRef = createRef<HTMLInputElement>();
    const onFiltersChange = jest.fn();

    render(
      <QueueFilters
        searchRef={searchRef}
        search=""
        filters={{ status: "", sortBy: "sla_priority", limit: 50 }}
        onSearchChange={jest.fn()}
        onFiltersChange={onFiltersChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/Ordenar por/), "created_at");
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ sortBy: "created_at" }));
  });

  it("exposes status filter values", () => {
    const searchRef = createRef<HTMLInputElement>();
    render(
      <QueueFilters
        searchRef={searchRef}
        search=""
        filters={{ status: "pending", sortBy: "hours_until_sla", limit: 25 }}
        onSearchChange={jest.fn()}
        onFiltersChange={jest.fn()}
      />,
    );
    expect(screen.getByLabelText(/Estado/)).toHaveValue("pending");
    expect(screen.getByLabelText(/Por página/)).toHaveValue("25");
  });
});
