import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentSection, type ConsentWizardPatch } from "@/components/credit-hub/dealer/wizard/consent/ConsentSection";
import { useConsentApi } from "@/lib/credit-hub/hooks/useConsentApi";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { ConsentApiError } from "@/lib/credit-hub/api/consent-client";

jest.mock("@/components/credit-hub/system/ForgeToaster", () => ({
  forgeToast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/credit-hub/hooks/useConsentApi", () => ({
  useConsentApi: jest.fn(),
}));

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: jest.fn(),
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => ({
    common: { confirm: "Confirmar" },
    consent: {
      step_title: "Consentimientos del solicitante",
      presence_question: "¿El solicitante está físicamente presente?",
      presence_present: "Sí, está aquí",
      presence_remote: "No, está remoto",
      present_intro: "Marca los consentimientos firmados por el solicitante.",
      consent_ley_172_13_label: "Autorización Ley 172-13",
      consent_buro_label: "Autorización consulta de buró de crédito",
      consent_data_policy_label: (institutionName: string) => `Política de tratamiento de datos de ${institutionName}`,
      signature_label: "Nombre completo (firma digital)",
      signature_date: "Fecha:",
      signature_required: "Nombre completo obligatorio",
      consents_required: "Debes marcar todos los consentimientos obligatorios",
      legal_text_version_label: "Versión del texto:",
      legal_text_missing: "No se pudo obtener el texto oficial.",
      channel_unavailable_reason: "Canal no disponible",
      application_id_required: "Se requiere el identificador de la solicitud.",
      public: {
        submitting: "Procesando autorización...",
        generic_submit_error: "No se pudo completar la autorización.",
      },
    },
  }),
}));

const mockUseConsentApi = useConsentApi as unknown as jest.Mock;
const mockUseTenantConfig = useTenantConfig as unknown as jest.Mock;
const mockConsentApi = {
  initiate: jest.fn(),
  acceptPresent: jest.fn(),
  getPresentText: jest.fn(),
  fetchPresentText: jest.fn(),
};

const PREFILL = {
  NOMBRE_TITULAR: "Ana Perez",
  CEDULA: "000-0000000-0",
  NOMBRE_CONCESIONARIO: "Concesionario Prueba",
  VEHICULO: "Toyota Corolla 2022",
  LISTA_ENTIDADES: "Entidad A",
  CONTACTO_DERECHOS: "derechos@example.invalid",
  LUGAR: "Santo Domingo",
  FECHA: "20/10/2026",
};

const LEGAL_TEXT = "  Texto oficial\n  {{tal cual}}  línea 2\n";

const baseFields = {
  applicationId: "app-1",
  applicationIdReady: true,
  consent_bureau_authorization: false,
  consent_terms_accepted: false,
  consent_data_processing_authorization: false,
  consent_signature_full_name: "",
  consent_present_confirmed: false,
  consent_method: "",
  consent_audit_hash: "",
  consent_accepted_at: "",
  consent_sms_otp_sent: false,
  consent_dealer_otp_code: "",
};

function ConsentSectionHarness({ initialPresence }: { initialPresence: "present" | "remote" }) {
  const [form, setForm] = useState({
    ...baseFields,
    consent_presence: initialPresence,
  });
  const onPatch = (patch: ConsentWizardPatch) => setForm((prev) => ({ ...prev, ...patch }));
  return <ConsentSection {...form} onPatch={onPatch} />;
}

describe("ConsentSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsentApi.initiate.mockResolvedValue({ status: "INITIATED" });
    mockConsentApi.acceptPresent.mockResolvedValue({
      consent_id: "consent-1",
      status: "ACCEPTED",
      accepted_at: "2026-08-30T12:00:00.000Z",
      audit_hash: "audit-hash-1",
      consent_text_version: "v1",
    });
    mockConsentApi.getPresentText.mockResolvedValue({ consent_text: null, consent_text_version: null, unavailable: true });
    mockConsentApi.fetchPresentText.mockResolvedValue({ consent_text: LEGAL_TEXT, consent_text_version: "1.0" });
    mockUseConsentApi.mockReturnValue(mockConsentApi);
    mockUseTenantConfig.mockReturnValue({
      tenantConfig: {
        tenant_id: "consent-test-tenant",
        institution_name: "Banco Test",
        consent_methods_enabled: ["WHATSAPP", "EMAIL", "SMS_OTP", "SELFIE"],
      },
      loading: false,
    });
  });

  it("renders presence question", () => {
    render(<ConsentSectionHarness initialPresence="present" />);
    expect(screen.getByTestId("consent-section")).toBeInTheDocument();
    expect(screen.getByText(/físicamente presente/i)).toBeInTheDocument();
  });

  it("shows present form when 'aquí' is selected", async () => {
    const user = userEvent.setup();
    render(<ConsentSectionHarness initialPresence="remote" />);
    await user.click(screen.getByLabelText(/Sí, está aquí/i));
    expect(screen.getByTestId("present-consent-form")).toBeInTheDocument();
  });

  it("shows remote selector when 'remoto' is selected", async () => {
    const user = userEvent.setup();
    render(<ConsentSectionHarness initialPresence="present" />);
    await user.click(screen.getByLabelText(/No, está remoto/i));
    expect(screen.getByTestId("remote-consent-selector")).toBeInTheDocument();
  });

  const signedProps = {
    ...baseFields,
    consent_presence: "present" as const,
    consent_bureau_authorization: true,
    consent_terms_accepted: true,
    consent_data_processing_authorization: true,
    consent_signature_full_name: "Ana Perez",
  };

  it("carga el texto oficial v1.0 con los datos del documento y firma con esos mismos texto_campos, sin reiniciar el evento", async () => {
    const user = userEvent.setup();
    const onPatch = jest.fn();
    render(<ConsentSection {...signedProps} presentTextPrefill={PREFILL} onPatch={onPatch} />);

    expect(screen.getByTestId("present-submit")).toBeDisabled();
    await user.click(screen.getByTestId("present-load-text"));
    await screen.findByTestId("present-legal-text");
    expect(mockConsentApi.fetchPresentText).toHaveBeenCalledWith("app-1", PREFILL);

    await user.click(screen.getByTestId("present-submit"));
    await waitFor(() => expect(mockConsentApi.acceptPresent).toHaveBeenCalled());
    expect(mockConsentApi.acceptPresent).toHaveBeenCalledWith("app-1", {
      consents_accepted: ["bureau_authorization", "terms_accepted", "data_processing_authorization"],
      full_name: "Ana Perez",
      texto_campos: PREFILL,
    });
    expect(mockConsentApi.initiate).not.toHaveBeenCalled();
    expect(onPatch).toHaveBeenCalledWith({
      consent_present_confirmed: true,
      consent_method: "PRESENT",
      consent_accepted_at: "2026-08-30T12:00:00.000Z",
      consent_audit_hash: "audit-hash-1",
    });
  });

  it("sin evento PRESENT pendiente lo inicia una vez y vuelve a pedir el texto", async () => {
    const user = userEvent.setup();
    mockConsentApi.fetchPresentText
      .mockRejectedValueOnce(new ConsentApiError(409, "Conflict", "consent_present_not_initiated", []))
      .mockResolvedValueOnce({ consent_text: LEGAL_TEXT, consent_text_version: "1.0" });
    render(<ConsentSection {...signedProps} presentTextPrefill={PREFILL} onPatch={jest.fn()} />);

    await user.click(screen.getByTestId("present-load-text"));
    await screen.findByTestId("present-legal-text");
    expect(mockConsentApi.initiate).toHaveBeenCalledTimes(1);
    expect(mockConsentApi.initiate).toHaveBeenCalledWith("app-1", "PRESENT", {});
    expect(mockConsentApi.fetchPresentText).toHaveBeenCalledTimes(2);
  });

  it("pinta el texto legal exactamente como lo entrega el backend y muestra la versión 1.0", async () => {
    const user = userEvent.setup();
    render(<ConsentSection {...signedProps} presentTextPrefill={PREFILL} onPatch={jest.fn()} />);
    await user.click(screen.getByTestId("present-load-text"));
    const node = await screen.findByTestId("present-legal-text");
    expect(node.textContent).toBe(LEGAL_TEXT);
    expect(screen.getByTestId("present-legal-text-version")).toHaveTextContent("1.0");
  });

  it("con datos del documento incompletos no pide el texto ni permite firmar", () => {
    render(<ConsentSection {...signedProps} presentTextPrefill={{ NOMBRE_TITULAR: "Ana Perez" }} onPatch={jest.fn()} />);
    expect(screen.getByTestId("present-load-text")).toBeDisabled();
    expect(screen.getByTestId("present-legal-text-missing")).toBeInTheDocument();
    expect(screen.getByTestId("present-submit")).toBeDisabled();
    expect(mockConsentApi.fetchPresentText).not.toHaveBeenCalled();
  });

  it("cambiar un dato después de cargar el texto obliga a cargarlo de nuevo", async () => {
    const user = userEvent.setup();
    render(<ConsentSection {...signedProps} presentTextPrefill={PREFILL} onPatch={jest.fn()} />);
    await user.click(screen.getByTestId("present-load-text"));
    await screen.findByTestId("present-legal-text");
    expect(screen.getByTestId("present-submit")).toBeEnabled();

    await user.type(screen.getByTestId("present-field-LUGAR"), "x");
    expect(screen.queryByTestId("present-legal-text")).not.toBeInTheDocument();
    expect(screen.getByTestId("present-submit")).toBeDisabled();
  });

  it("un 409 consent_text_incomplete nombra los datos que faltan y no permite firmar", async () => {
    const user = userEvent.setup();
    mockConsentApi.fetchPresentText.mockRejectedValue(
      new ConsentApiError(409, "Conflict", "consent_text_incomplete", ["LISTA_ENTIDADES"])
    );
    render(<ConsentSection {...signedProps} presentTextPrefill={PREFILL} onPatch={jest.fn()} />);
    await user.click(screen.getByTestId("present-load-text"));
    expect(await screen.findByTestId("present-legal-text-missing")).toHaveTextContent(/LISTA_ENTIDADES/);
    expect(screen.getByTestId("present-submit")).toBeDisabled();
  });

  it("con todos los métodos habilitados WhatsApp, Email, SMS y Selfie quedan deshabilitados y PRESENT sigue operativo", async () => {
    const user = userEvent.setup();
    render(<ConsentSectionHarness initialPresence="remote" />);
    for (const k of ["whatsapp", "email", "sms_otp", "selfie"]) {
      expect(within(screen.getByTestId(`method-${k}`)).getByRole("radio")).toBeDisabled();
    }
    await user.click(screen.getByLabelText(/Sí, está aquí/i));
    expect(screen.getByTestId("present-consent-form")).toBeInTheDocument();
    expect(mockConsentApi.initiate).not.toHaveBeenCalled();
  });
});
