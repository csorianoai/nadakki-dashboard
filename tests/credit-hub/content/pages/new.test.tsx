import { render, screen } from "@testing-library/react";
import NewApplicationPage from "@/app/(forge)/credit-hub/dealer/applications/new/page";
import { useCreateCreditApplication } from "@/lib/credit-hub/hooks/useCreateCreditApplication";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreateCreditApplication", () => ({
  useCreateCreditApplication: jest.fn(),
}));

describe("NewApplicationPage", () => {
  test("renders wizard page with lazy loading shell", () => {
    (useCreateCreditApplication as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });
    const { container } = render(<NewApplicationPage />);
    expect(screen.getByText("Nueva Solicitud")).toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
