import { render, screen } from "@testing-library/react";
import NewApplicationPage from "@/app/(forge)/credit-hub/dealer/applications/new/page";
import { useCreateApplication } from "@/lib/credit-hub/hooks/useCreateApplication";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreateApplication", () => ({
  useCreateApplication: jest.fn(),
}));

describe("NewApplicationPage", () => {
  test("renders wizard page with lazy loading shell", () => {
    (useCreateApplication as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });
    const { container } = render(<NewApplicationPage />);
    expect(screen.getByText("Nueva Solicitud")).toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
