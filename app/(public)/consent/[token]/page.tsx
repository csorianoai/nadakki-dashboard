"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import {
  PublicConsentClient,
  ConsentTokenInvalidError,
  ConsentOtpInvalidError,
  isUsableStatus,
  type PublicConsentView,
} from "@/lib/credit-hub/api/public-consent-client";
import { ConsentBrandingHeader } from "./_components/ConsentBrandingHeader";
import { RegulatoryTextViewer } from "./_components/RegulatoryTextViewer";
import { ConsentCheckboxes } from "./_components/ConsentCheckboxes";
import { SignatureField } from "./_components/SignatureField";
import { OtpInputField } from "./_components/OtpInputField";
import { SelfieCapture } from "./_components/SelfieCapture";
import { ConsentSuccessView } from "./_components/ConsentSuccessView";
import { ConsentInvalidView } from "./_components/ConsentInvalidView";
import { ConsentLoadingView } from "./_components/ConsentLoadingView";
import { ConsentAlreadyAcceptedView } from "./_components/ConsentAlreadyAcceptedView";

type ViewState = "loading" | "form" | "success" | "invalid" | "already";

export default function PublicConsentPage() {
  const routeParams = useParams();
  const pathname = usePathname();
  const routeToken = routeParams?.token;
  const tokenFromParams = Array.isArray(routeToken) ? routeToken[0] : routeToken;
  const tokenFromPath = pathname?.match(/^\/consent\/([^/]+)\/?$/)?.[1] ?? "";
  const token = decodeURIComponent(String(tokenFromParams || tokenFromPath));
  const t = useTranslations();

  const [view, setView] = useState<ViewState>("loading");
  const [data, setData] = useState<PublicConsentView | null>(null);

  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [fullName, setFullName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [otpFieldError, setOtpFieldError] = useState<string | null>(null);
  const [acceptedResult, setAcceptedResult] = useState<{ accepted_at: string; audit_hash: string } | null>(null);
  const [submitBlocked, setSubmitBlocked] = useState(false);
  const lastSubmitErrRef = useRef("");
  const sameSubmitErrCountRef = useRef(0);

  const clientRef = useRef(new PublicConsentClient());

  useEffect(() => {
    if (!token) {
      setView("invalid");
      return;
    }

    let mounted = true;
    void clientRef.current
      .getStatus(token)
      .then((status) => {
        if (!isUsableStatus(status.status)) {
          throw new ConsentTokenInvalidError("Token inválido o expirado");
        }
        return clientRef.current.getPublicView(token);
      })
      .then((d) => {
        if (!mounted) return;
        if (d.already_accepted) {
          setView("already");
          setData(d);
          return;
        }
        setData(d);
        setView("form");
      })
      .catch(() => {
        if (!mounted) return;
        setView("invalid");
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  const allConsentsAccepted =
    data?.consents_required?.every((c: string) => accepted[c]) ?? false;
  const signatureValid = fullName.trim().length >= 3;
  const otpRequired = data?.method === "SMS_OTP";
  const selfieRequired = data?.method === "SELFIE";
  const otpValid = !otpRequired || /^\d{6}$/.test(otpCode);
  const selfieValid = !selfieRequired || Boolean(selfieDataUrl);

  const canSubmit =
    allConsentsAccepted &&
    signatureValid &&
    otpValid &&
    selfieValid &&
    !submitting &&
    !submitBlocked;

  const handleSubmit = async () => {
    if (!canSubmit || !data) return;

    setSubmitting(true);
    setSubmitError(null);
    setOtpFieldError(null);

    try {
      const consents_accepted = Object.entries(accepted)
        .filter(([, v]) => v)
        .map(([k]) => k);

      const payload: {
        consents_accepted: string[];
        full_name: string;
        otp_code?: string;
        selfie_data_url?: string;
      } = {
        consents_accepted,
        full_name: fullName.trim(),
      };
      if (otpRequired) payload.otp_code = otpCode;
      if (selfieRequired && selfieDataUrl) payload.selfie_data_url = selfieDataUrl;

      const result = await clientRef.current.accept(token, payload);
      setAcceptedResult(result);
      setView("success");
      lastSubmitErrRef.current = "";
      sameSubmitErrCountRef.current = 0;
    } catch (e) {
      const msg =
        e instanceof ConsentOtpInvalidError
          ? t.consent.public.otp_invalid
          : e instanceof ConsentTokenInvalidError
            ? t.consent.public.invalid_link
            : t.consent.public.generic_submit_error;

      if (e instanceof ConsentOtpInvalidError) {
        setOtpFieldError(msg);
      } else {
        setSubmitError(msg);
      }

      const key = e instanceof ConsentOtpInvalidError ? "otp" : msg;
      if (key === lastSubmitErrRef.current) {
        sameSubmitErrCountRef.current += 1;
      } else {
        lastSubmitErrRef.current = key;
        sameSubmitErrCountRef.current = 1;
      }
      if (sameSubmitErrCountRef.current >= 2) {
        setSubmitBlocked(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "loading") return <ConsentLoadingView />;
  if (view === "invalid") return <ConsentInvalidView />;
  if (view === "already") return <ConsentAlreadyAcceptedView />;
  if (view === "success" && acceptedResult && data) {
    return (
      <ConsentSuccessView
        institutionName={data.institution_name}
        acceptedAt={acceptedResult.accepted_at}
        auditHash={acceptedResult.audit_hash}
      />
    );
  }

  if (!data || view !== "form") return <ConsentLoadingView />;

  const primary = data.branding?.primary_color?.trim() || "#2563eb";

  return (
    <main className="container mx-auto max-w-2xl space-y-6 px-4 py-6 pb-16">
      <ConsentBrandingHeader institutionName={data.institution_name} branding={data.branding} />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white md:text-3xl">{t.consent.public.welcome_title}</h1>
        <p className="text-slate-300">{t.consent.public.welcome_subtitle}</p>
      </div>

      <p className="text-sm italic text-slate-400">{t.consent.public.read_carefully}</p>

      <RegulatoryTextViewer consentsRequired={data.consents_required} regulatoryTexts={data.regulatory_texts} />

      <ConsentCheckboxes
        consents={data.consents_required}
        accepted={accepted}
        onChange={setAccepted}
        institutionName={data.institution_name}
      />

      {otpRequired && (
        <OtpInputField
          value={otpCode}
          onChange={(v) => {
            setOtpCode(v);
            setOtpFieldError(null);
          }}
          error={otpFieldError}
        />
      )}

      {selfieRequired && <SelfieCapture onCapture={setSelfieDataUrl} captured={selfieDataUrl} />}

      <SignatureField value={fullName} onChange={setFullName} />

      {submitError && (
        <p className="text-sm text-rose-400" role="alert">
          {submitError}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={!canSubmit}
        className="w-full rounded-lg bg-blue-600 px-4 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500 disabled:hover:bg-slate-700"
        style={canSubmit ? { backgroundColor: primary } : undefined}
        data-testid="consent-submit"
      >
        {submitting ? t.consent.public.submitting : t.consent.public.submit_authorize}
      </button>

      <footer className="border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
        <p>
          {t.consent.public.powered_by} {t.consent.public.footer_brand(data.institution_name)}
        </p>
        <p className="mt-2">{t.consent.public.contact_help}</p>
      </footer>
    </main>
  );
}
