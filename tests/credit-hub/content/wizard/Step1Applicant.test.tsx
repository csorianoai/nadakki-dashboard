import { fireEvent, render, screen } from "@testing-library/react";
import { Step1Applicant } from "@/components/credit-hub/dealer/wizard/Step1Applicant";
import type { ApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";

const data: ApplicationFormData = {
  applicant_full_name: "",
  applicant_identification: "",
  applicant_date_of_birth: "",
  applicant_age: "",
  applicant_marital_status: "",
  applicant_email: "",
  applicant_phone: "",
  applicant_address: "",
  applicant_city: "",
  applicant_province: "",
  applicant_country: "",
  employment_type: "",
  employer_name: "",
  employment_position: "",
  time_in_job: "",
  monthly_income: "",
  other_income: "",
  payment_frequency: "",
  work_phone: "",
  requested_amount: "",
  desired_term: "",
  down_payment: "",
  monthly_debts: "",
  estimated_monthly_expenses: "",
  primary_bank: "",
  has_bank_account: "yes",
  has_late_payment_history: "no",
  max_late_payment_days: "",
  product_type: "",
  vehicle_make: "",
  vehicle_model: "",
  vehicle_year: "",
  vehicle_price: "",
  dealer_supplier: "",
  vehicle_condition: "",
  co_debtor_required: "no",
  co_debtor_full_name: "",
  co_debtor_identification: "",
  co_debtor_phone: "",
  co_debtor_monthly_income: "",
  co_debtor_relationship: "",
  co_debtor_employment: "",
  document_id_uploaded: false,
  document_income_proof_uploaded: false,
  document_bank_statement_uploaded: false,
  document_bureau_authorization_uploaded: false,
  document_invoice_uploaded: false,
  consent_bureau_authorization: false,
  consent_terms_accepted: false,
  consent_data_processing_authorization: false,
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
    expect(onChange).toHaveBeenCalledWith("applicant_full_name", "Ana Pérez");
  });
});
