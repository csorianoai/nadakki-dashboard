import { fireEvent, render, screen } from "@testing-library/react";
import { Step3Review } from "@/components/credit-hub/dealer/wizard/Step3Review";
import type { ApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";

const data: ApplicationFormData = {
  applicant_name: "Ana Pérez",
  applicant_email: "ana@example.com",
  applicant_phone: "",
  vehicle_year: "2023",
  vehicle_make: "Toyota",
  vehicle_model: "Hilux",
  vehicle_vin: "",
  requested_amount: "",
  down_payment: "",
};

describe("Step3Review", () => {
  test("updates amount fields with numeric values only", () => {
    const onChange = jest.fn();
    render(<Step3Review data={data} onChange={onChange} onSubmit={jest.fn()} submitStatus="idle" />);
    fireEvent.change(screen.getByLabelText("Monto solicitado"), { target: { value: "RD$ 500,000" } });
    expect(onChange).toHaveBeenCalledWith("requested_amount", "500000");
  });

  test("submits selected draft mode", () => {
    const onSubmit = jest.fn();
    render(<Step3Review data={data} onChange={jest.fn()} onSubmit={onSubmit} submitStatus="idle" />);
    fireEvent.click(screen.getByRole("radio", { name: /Guardar como borrador/ }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar Borrador" }));
    expect(onSubmit).toHaveBeenCalledWith("draft");
  });
});
