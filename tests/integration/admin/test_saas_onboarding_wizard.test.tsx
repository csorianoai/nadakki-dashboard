import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SaasOnboardingWizard } from "@/components/admin/saas-onboarding/SaasOnboardingWizard";
import {
  createDealer,
  createInstitution,
  getOnboardingStatus,
  OnboardingApiError,
} from "@/lib/admin/saas-onboarding-api";

jest.mock("@/lib/admin/saas-onboarding-api", () => ({
  ...jest.requireActual("@/lib/admin/saas-onboarding-api"),
  createInstitution: jest.fn(),
  createDealer: jest.fn(),
  getOnboardingStatus: jest.fn(),
}));

const institutionId = "11111111-1111-1111-1111-111111111111";
const dealerId = "22222222-2222-2222-2222-222222222222";
const password = "temporary-password";

function fillInstitution() {
  fireEvent.change(screen.getByTestId("field-tenant-name"), { target: { value: "Banco Uno" } });
  fireEvent.change(screen.getByTestId("field-institution-slug"), { target: { value: "banco-uno" } });
  fireEvent.change(screen.getByTestId("field-institution-email"), { target: { value: "admin@example.com" } });
  fireEvent.change(screen.getByTestId("field-institution-password"), { target: { value: password } });
  fireEvent.change(screen.getByTestId("field-lender-code"), { target: { value: "pilot" } });
}

function fillDealer() {
  fireEvent.change(screen.getByTestId("field-dealer-name"), { target: { value: "Dealer Uno" } });
  fireEvent.change(screen.getByTestId("field-dealer-slug"), { target: { value: "dealer-uno" } });
  fireEvent.change(screen.getByTestId("field-dealer-email"), { target: { value: "dealer@example.com" } });
  fireEvent.change(screen.getByTestId("field-dealer-password"), { target: { value: password } });
  fireEvent.change(screen.getByTestId("field-institution-tenant"), { target: { value: institutionId } });
  fireEvent.change(screen.getByTestId("field-allowed-lenders"), { target: { value: "pilot" } });
}

beforeEach(() => {
  jest.clearAllMocks();
});

test("renders the functional institution wizard", () => {
  render(<SaasOnboardingWizard />);
  expect(screen.getByTestId("saas-onboarding-wizard")).toBeInTheDocument();
  expect(screen.getByTestId("field-tenant-name")).toBeInTheDocument();
  expect(screen.getByTestId("field-institution-password")).toHaveAttribute("type", "password");
});

test("switches between Institution and Dealer modes", () => {
  render(<SaasOnboardingWizard />);
  fireEvent.click(screen.getByTestId("mode-dealer"));
  expect(screen.getByTestId("field-dealer-name")).toBeInTheDocument();
  expect(screen.queryByTestId("field-tenant-name")).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId("mode-institution"));
  expect(screen.getByTestId("field-tenant-name")).toBeInTheDocument();
});

test("submits an institution and reads back ACTIVE status", async () => {
  (createInstitution as jest.Mock).mockResolvedValue({ tenant_id: institutionId, onboarding_status: "ACTIVE" });
  (getOnboardingStatus as jest.Mock).mockResolvedValue({ entity_id: institutionId, onboarding_status: "ACTIVE" });
  render(<SaasOnboardingWizard />);
  fillInstitution();
  fireEvent.click(screen.getByTestId("submit-onboarding"));

  expect(await screen.findByTestId("onboarding-result")).toHaveTextContent("ACTIVE");
  expect(createInstitution).toHaveBeenCalledWith(expect.objectContaining({
    slug: "banco-uno",
    admin_password: password,
  }));
  expect(getOnboardingStatus).toHaveBeenCalledWith(institutionId);
});

test("submits a dealer with explicit institution and lender mappings", async () => {
  (createDealer as jest.Mock).mockResolvedValue({ dealer_id: dealerId, admin_user_id: "user-1", onboarding_status: "ACTIVE" });
  (getOnboardingStatus as jest.Mock).mockResolvedValue({ entity_id: dealerId, onboarding_status: "ACTIVE" });
  render(<SaasOnboardingWizard />);
  fireEvent.click(screen.getByTestId("mode-dealer"));
  fillDealer();
  fireEvent.click(screen.getByTestId("submit-onboarding"));

  expect(await screen.findByTestId("onboarding-result")).toHaveTextContent(dealerId);
  expect(createDealer).toHaveBeenCalledWith(expect.objectContaining({
    institution_tenant_id: institutionId,
    admin_password: password,
    lender_access: [expect.objectContaining({ lender_code: "pilot" })],
  }));
});

test("renders a clear 403 forbidden error", async () => {
  (createInstitution as jest.Mock).mockRejectedValue(new OnboardingApiError(403, "forbidden"));
  render(<SaasOnboardingWizard />);
  fillInstitution();
  fireEvent.click(screen.getByTestId("submit-onboarding"));
  expect(await screen.findByRole("alert")).toHaveTextContent("administrator permission is required");
});

test("renders a clear 401 session error", async () => {
  (createInstitution as jest.Mock).mockRejectedValue(new OnboardingApiError(401, "expired"));
  render(<SaasOnboardingWizard />);
  fillInstitution();
  fireEvent.click(screen.getByTestId("submit-onboarding"));
  expect(await screen.findByRole("alert")).toHaveTextContent("session expired");
});

test("renders a clear 409 duplicate/idempotency conflict", async () => {
  (createInstitution as jest.Mock).mockRejectedValue(new OnboardingApiError(409, "duplicate"));
  render(<SaasOnboardingWizard />);
  fillInstitution();
  fireEvent.click(screen.getByTestId("submit-onboarding"));
  expect(await screen.findByRole("alert")).toHaveTextContent("already exists");
  expect(screen.getByTestId("field-institution-password")).toHaveValue("");
});

test.each(["PENDING_ADAPTER", "PENDING_INTEGRATION"])("renders backend status %s", async (status) => {
  (createInstitution as jest.Mock).mockResolvedValue({ tenant_id: institutionId, onboarding_status: status });
  (getOnboardingStatus as jest.Mock).mockResolvedValue({ entity_id: institutionId, onboarding_status: status });
  render(<SaasOnboardingWizard />);
  fillInstitution();
  fireEvent.click(screen.getByTestId("submit-onboarding"));
  expect(await screen.findByTestId("onboarding-result")).toHaveTextContent(status);
});

test("renders FAILED exactly as returned by the backend", async () => {
  (createInstitution as jest.Mock).mockResolvedValue({ tenant_id: institutionId, onboarding_status: "FAILED" });
  (getOnboardingStatus as jest.Mock).mockResolvedValue({ entity_id: institutionId, onboarding_status: "FAILED" });
  render(<SaasOnboardingWizard />);
  fillInstitution();
  fireEvent.click(screen.getByTestId("submit-onboarding"));
  expect(await screen.findByTestId("onboarding-result")).toHaveTextContent("FAILED");
});

test("clears the password from React state after every submit", async () => {
  (createInstitution as jest.Mock).mockResolvedValue({ tenant_id: institutionId, onboarding_status: "ACTIVE" });
  (getOnboardingStatus as jest.Mock).mockResolvedValue({ entity_id: institutionId, onboarding_status: "ACTIVE" });
  render(<SaasOnboardingWizard />);
  fillInstitution();
  fireEvent.click(screen.getByTestId("submit-onboarding"));
  await waitFor(() => expect(screen.getByTestId("field-institution-password")).toHaveValue(""));
});

test("does not log or persist the password", async () => {
  const localSet = jest.spyOn(Storage.prototype, "setItem");
  const consoleLog = jest.spyOn(console, "log").mockImplementation(() => undefined);
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
  (createInstitution as jest.Mock).mockResolvedValue({ tenant_id: institutionId, onboarding_status: "ACTIVE" });
  (getOnboardingStatus as jest.Mock).mockResolvedValue({ entity_id: institutionId, onboarding_status: "ACTIVE" });

  render(<SaasOnboardingWizard />);
  fillInstitution();
  fireEvent.click(screen.getByTestId("submit-onboarding"));
  await screen.findByTestId("onboarding-result");

  expect(localSet).not.toHaveBeenCalled();
  expect(consoleLog).not.toHaveBeenCalled();
  expect(consoleError).not.toHaveBeenCalled();
  expect(window.location.search).not.toContain(password);

  localSet.mockRestore();
  consoleLog.mockRestore();
  consoleError.mockRestore();
});
