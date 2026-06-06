import { render, screen, waitFor } from "@testing-library/react";
import BankApplicationDetailPage from "@/app/(bank)/bank/applications/[id]/page";
import { fetchBankApplicationDetail } from "@/lib/bank-application-detail/fetch-detail";
import { BankApplicationHttpError } from "@/lib/bank-application-detail/errors";
import type { BankApplicationDetailResponse } from "@/lib/bank-application-detail/types";

jest.mock("@/lib/bank-application-detail/fetch-detail", () => ({
  fetchBankApplicationDetail: jest.fn(),
}));

jest.mock("@/lib/bank-application-detail/claim-application", () => ({
  claimBankApplication: jest.fn().mockResolvedValue({ ok: true, status: 200 }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "test-analyst-id", email: "test@test.com", is_active: true, mfa_enabled: false } }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/bank/applications/test-app-id",
}));

jest.mock("next/link", () => {
  const React = require("react");
  function MockLink({ children, href }: { children?: React.ReactNode; href: string }) {
    return React.createElement("a", { href }, children);
  }
  return { __esModule: true, default: MockLink };
});

jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn(), message: jest.fn(), info: jest.fn() },
}));

jest.mock("react", () => {
  const React = jest.requireActual("react");
  return {
    ...React,
    use: (input: unknown) => {
      if (input != null && typeof (input as PromiseLike<unknown>).then === "function") {
        return { id: "test-app-id" };
      }
      return input as { id: string };
    },
  };
});

const mockDetail = (): BankApplicationDetailResponse => ({
  application_id: "test-app-id",
  queue_status: "pending",
  borrower_name_masked: "F. *** Last",
  amount: 1000,
  currency: "DOP",
  dealer: { id: "d1", name: "Dealer" },
  borrower: { cedula_masked: "XXX" },
  vehicle: { year: 2020, make: "Kia", model: "Rio" },
  scoring: { pti: 10, dti: 30 },
  documents: [],
  stipulations: [],
  events_count: 0,
  recent_events: [],
});

describe("BankApplicationDetailPage", () => {
  test("shows skeleton while loading", () => {
    (fetchBankApplicationDetail as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<BankApplicationDetailPage params={Promise.resolve({ id: "test-app-id" }) as never} />);
    expect(screen.getByRole("status", { name: /cargando detalle/i })).toBeInTheDocument();
  });

  test("renders main sections after load", async () => {
    (fetchBankApplicationDetail as jest.Mock).mockResolvedValue(mockDetail());
    render(<BankApplicationDetailPage params={Promise.resolve({ id: "test-app-id" }) as never} />);
    await waitFor(() => expect(screen.getByRole("main", { name: /detalle de solicitud bancaria/i })).toBeInTheDocument());
    expect(screen.getByText("F. *** Last")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /solicitante/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^scoring$/i })).toBeInTheDocument();
  });

  test("shows not found copy on 404", async () => {
    (fetchBankApplicationDetail as jest.Mock).mockRejectedValue(
      new BankApplicationHttpError("NOT_FOUND", 404, "NOT_FOUND"),
    );
    render(<BankApplicationDetailPage params={Promise.resolve({ id: "x" }) as never} />);
    await waitFor(() => expect(screen.getByText(/solicitud no encontrada/i)).toBeInTheDocument());
  });
});
