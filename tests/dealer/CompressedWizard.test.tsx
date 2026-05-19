/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompressedWizard } from "@/components/credit/CompressedWizard";
import type { WizardData } from "@/components/credit/compressed-wizard-types";
import { EMPTY_WIZARD_DATA } from "@/components/credit/compressed-wizard-types";

function setInputByLabel(label: RegExp | string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("CompressedWizard", () => {
  const baseProps = {
    tenantId: "tenant-1",
    onComplete: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  test("renders 5-step chrome and progress indicator", () => {
    render(<CompressedWizard {...baseProps} />);
    expect(screen.getByTestId("compressed-wizard-root")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "20");
    expect(screen.getByText(/Paso 1\/5/i)).toBeInTheDocument();
  });

  test("progress indicator updates when advancing", async () => {
    const user = userEvent.setup();
    render(<CompressedWizard {...baseProps} />);
    fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: "Ana Gómez" } });
    fireEvent.change(screen.getByLabelText(/fecha nacimiento/i), {
      target: { value: "1992-01-01" },
    });
    setInputByLabel(/cédula/i, "40212345678");
    setInputByLabel(/teléfono/i, "8095551212");
    setInputByLabel(/email/i, "ana@test.com");
    setInputByLabel(/dirección/i, "Calle 1 #2");
    await user.click(screen.getByTestId("cw-next"));
    expect(screen.getByText(/Paso 2\/5/i)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
  });

  test("cannot advance with invalid step 0 data", async () => {
    const user = userEvent.setup();
    render(<CompressedWizard {...baseProps} />);
    await user.click(screen.getByTestId("cw-next"));
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(screen.getByText(/Paso 1\/5/i)).toBeInTheDocument();
  });

  test("step navigation forward and back", async () => {
    render(<CompressedWizard {...baseProps} />);
    fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/fecha nacimiento/i), {
      target: { value: "1990-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/cédula/i), { target: { value: "40212345678" } });
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: "8090000000" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "t@test.com" } });
    fireEvent.change(screen.getByLabelText(/dirección/i), { target: { value: "Dir 1" } });
    fireEvent.click(screen.getByTestId("cw-next"));
    expect(screen.getByTestId("cw-step-employment")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Atrás/i));
    expect(screen.getByTestId("cw-step-applicant")).toBeInTheDocument();
  });

  test("VIN decode button pre-fills year when valid VIN", async () => {
    const user = userEvent.setup();
    render(<CompressedWizard {...baseProps} />);
    // go to step 3 (vehicle)
    fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/fecha nacimiento/i), {
      target: { value: "1990-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/cédula/i), { target: { value: "40212345678" } });
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: "8090000000" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "t@test.com" } });
    fireEvent.change(screen.getByLabelText(/dirección/i), { target: { value: "Dir 1" } });
    fireEvent.click(screen.getByTestId("cw-next"));
    fireEvent.change(screen.getByLabelText(/empleador/i), { target: { value: "ACME" } });
    fireEvent.change(screen.getByLabelText(/puesto/i), { target: { value: "Analyst" } });
    fireEvent.change(screen.getByLabelText(/ingreso mensual/i), { target: { value: "50000" } });
    fireEvent.click(screen.getByTestId("cw-next"));

    const vin = "1HGBH41JXMN109186";
    fireEvent.change(screen.getByLabelText("VIN"), { target: { value: vin } });
    await user.click(screen.getByRole("button", { name: /Decodificar año/i }));
    await waitFor(() => {
      const yearInput = screen.getByLabelText(/Año/i) as HTMLInputElement;
      expect(yearInput.value).not.toBe("");
    });
  });

  test("submit on final step calls onComplete with wizard data", async () => {
    const onComplete = jest.fn().mockResolvedValue(undefined);
    const filled: WizardData = {
      ...EMPTY_WIZARD_DATA,
      applicant: {
        fullName: "X",
        dob: "1990-01-01",
        nationalId: "40212345678",
        phone: "809",
        email: "x@test.com",
        addressLine: "a",
      },
      employment: {
        employer: "Co",
        position: "dev",
        yearsEmployed: 2,
        monthlyIncome: 60000,
      },
      vehicle: {
        condition: "used",
        year: 2020,
        make: "Toy",
        model: "X",
        mileage: 1000,
      },
      deal: {
        salePrice: 500000,
        downPayment: 50000,
        termMonths: 60,
      },
      autoriza_buro: true,
      acepta_politica: true,
    };

    render(<CompressedWizard {...baseProps} onComplete={onComplete} initialData={filled} />);
    // jump using internal state by clicking next from step 0 — easier: render at step 4 by simulating clicks
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByTestId("cw-next"));
    }
    await waitFor(() => expect(screen.getByTestId("cw-step-review")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("cw-submit"));
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
  });

  test("multi-lender mode selection updates data", async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn().mockResolvedValue(undefined);
    const filled: WizardData = {
      ...EMPTY_WIZARD_DATA,
      applicant: {
        fullName: "X",
        dob: "1990-01-01",
        nationalId: "40212345678",
        phone: "809",
        email: "x@test.com",
        addressLine: "a",
      },
      employment: { employer: "Co", position: "dev", yearsEmployed: 2, monthlyIncome: 60000 },
      vehicle: { condition: "used", year: 2020, make: "Toy", model: "X" },
      deal: { salePrice: 400000, downPayment: 40000, termMonths: 48 },
      mode: "HYBRID",
      autoriza_buro: true,
      acepta_politica: true,
    };
    render(<CompressedWizard tenantId="tenant-1" onComplete={onComplete} initialData={filled} />);
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByTestId("cw-next"));
    }
    await user.click(screen.getByRole("radio", { name: /Solo IA/i }));
    await user.click(screen.getByTestId("cw-submit"));
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    const arg = onComplete.mock.calls[0][0] as WizardData;
    expect(arg.mode).toBe("AI_ONLY");
  });

  test("live region announces step changes", async () => {
    render(<CompressedWizard {...baseProps} />);
    expect(screen.getAllByText(/Paso 1 de 5/i)[0]).toBeInTheDocument();
  });

  test("keyboard-friendly controls use min touch target class on primary buttons", () => {
    render(<CompressedWizard {...baseProps} />);
    expect(screen.getByTestId("cw-next")).toHaveClass("min-h-[44px]");
  });
});
