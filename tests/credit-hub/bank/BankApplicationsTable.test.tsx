import { render, screen } from "@testing-library/react";
import { BankApplicationsTable } from "@/components/credit-hub/bank/BankApplicationsTable";

describe("BankApplicationsTable", () => {
  test("renders queue section header", () => {
    render(
      <div className="credit-hub-forge" data-persona="bank">
        <BankApplicationsTable
          items={[]}
          total={0}
          page={1}
          pageSize={20}
          search=""
          selected={new Set()}
          onToggle={() => undefined}
          onToggleAll={() => undefined}
          onClearSelection={() => undefined}
          onSearchChange={() => undefined}
          onPageChange={() => undefined}
        />
      </div>
    );
    expect(screen.getByRole("heading", { name: /Solicitudes priorizadas/i })).toBeInTheDocument();
  });
});
