import { render, screen } from "@testing-library/react";
import NewApplicationPage from "@/app/credit-hub/dealer/applications/new/page";
import { useCreateApplication } from "@/lib/credit-hub/hooks/useCreateApplication";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreateApplication", () => ({
  useCreateApplication: jest.fn(),
}));

describe("NewApplicationPage", () => {
  test("renders wizard entry step", () => {
    (useCreateApplication as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });
    render(<NewApplicationPage />);
    expect(screen.getByText("Nueva Solicitud")).toBeInTheDocument();
    expect(screen.getByText("Información del Cliente")).toBeInTheDocument();
  });
});
