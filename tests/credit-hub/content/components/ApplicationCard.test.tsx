import { fireEvent, render, screen } from "@testing-library/react";
import { ApplicationCard } from "@/components/credit-hub/dealer/ApplicationCard";
import { makeApplication } from "../testData";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("ApplicationCard", () => {
  beforeEach(() => {
    push.mockReset();
  });

  test("renders mobile variant", () => {
    render(<ApplicationCard application={makeApplication()} variant="card" />);
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("2023 Toyota Hilux")).toBeInTheDocument();
  });

  test("renders compact variant", () => {
    render(<ApplicationCard application={makeApplication()} variant="compact" />);
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("RD$ 500,000")).toBeInTheDocument();
  });

  test("navigates on click", () => {
    render(<ApplicationCard application={makeApplication({ application_id: "app-99" })} />);
    fireEvent.click(screen.getByRole("button"));
    expect(push).toHaveBeenCalledWith("/credit-hub/dealer/applications/app-99");
  });

  test("avatar uses initials", () => {
    render(<ApplicationCard application={makeApplication({ applicant_name: "Juan Carlos Pérez" })} />);
    expect(screen.getByText("JP")).toBeInTheDocument();
  });

  test("status bar color matches status", () => {
    render(<ApplicationCard application={makeApplication({ status: "rejected" })} />);
    expect(screen.getByTestId("application-status-bar")).toHaveClass("bg-forge-danger");
  });
});
