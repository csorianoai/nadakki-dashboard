/** @jest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";
import BankApplicationsQueuePage from "@/app/(bank)/bank/applications/queue/page";
import { BankQueueHttpError } from "@/lib/bank-queue/errors";
import { fetchBankApplicationsQueue, postBankApplicationClaim } from "@/lib/bank-queue/fetch-queue";
import { mockApplication, mockQueueResponse, seedBankQueueAuth, makeJwt } from "./test-utils";

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    message: jest.fn(),
  },
}));

jest.mock("@/lib/bank-queue/fetch-queue", () => ({
  fetchBankApplicationsQueue: jest.fn(),
  postBankApplicationClaim: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => "/bank/applications/queue",
}));

const mockFetchQueue = fetchBankApplicationsQueue as jest.Mock;
const mockPostClaim = postBankApplicationClaim as jest.Mock;

describe("BankApplicationsQueuePage", () => {
  beforeEach(() => {
    seedBankQueueAuth(makeJwt());
    mockFetchQueue.mockResolvedValue(mockQueueResponse([mockApplication({ borrower_name: "Cliente QA" })]));
    mockPostClaim.mockResolvedValue({ ok: true, status: 200 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loaded rows", async () => {
    render(<BankApplicationsQueuePage />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    expect(screen.getByText(/Cliente QA/)).toBeInTheDocument();
  });

  it("shows forbidden banner after 403 responses", async () => {
    mockFetchQueue.mockRejectedValue(new BankQueueHttpError("role_not_authorized", 403, "role_not_authorized"));

    render(<BankApplicationsQueuePage />);

    await waitFor(() => {
      expect(screen.getByText(/no está autorizado/)).toBeInTheDocument();
    });
  });
});
