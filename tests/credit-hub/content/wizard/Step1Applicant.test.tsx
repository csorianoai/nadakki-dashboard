import { fireEvent, render, screen } from "@testing-library/react";
import { Step1Applicant } from "@/components/credit-hub/dealer/wizard/Step1Applicant";
import type { ApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";

const data: ApplicationFormData = {
  applicant_name: "",
  applicant_email: "",
  applicant_phone: "",
  vehicle_year: "",
  vehicle_make: "",
  vehicle_model: "",
  vehicle_vin: "",
  requested_amount: "",
  down_payment: "",
};

describe("Step1Applicant", () => {
  test("requires applicant_name", () => {
    render(<Step1Applicant data={data} onChange={jest.fn()} />);
    expect(screen.getByLabelText("Nombre completo *")).toBeRequired();
  });

  test("updates applicant fields", () => {
    const onChange = jest.fn();
    render(<Step1Applicant data={data} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Nombre completo *"), { target: { value: "Ana Pérez" } });
    expect(onChange).toHaveBeenCalledWith("applicant_name", "Ana Pérez");
  });
});
