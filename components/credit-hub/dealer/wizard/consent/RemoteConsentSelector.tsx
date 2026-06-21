"use client";

import { useState } from "react";
import { Camera, Hash, Mail, MessageCircle } from "lucide-react";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { WhatsAppConsentMethod } from "./WhatsAppConsentMethod";
import { EmailConsentMethod } from "./EmailConsentMethod";
import { SMSOTPConsentMethod } from "./SMSOTPConsentMethod";
import { SelfieConsentMethod } from "./SelfieConsentMethod";
import type { RemoteConsentMethodKey } from "./consent-method-map";

interface RemoteConsentSelectorProps {
  applicationId: string;
  applicationReady: boolean;
  enabledMethods: RemoteConsentMethodKey[];
  onRemoteComplete?: (data: { method: string; auditHash?: string }) => void;
  dealerOtpCode: string;
  onDealerOtpCodeChange: (v: string) => void;
  onSmsOtpSent: () => void;
  consentsAccepted: string[];
  fullName: string;
  onFullNameChange: (value: string) => void;
}

export function RemoteConsentSelector({
  applicationId,
  applicationReady,
  enabledMethods,
  onRemoteComplete,
  dealerOtpCode,
  onDealerOtpCodeChange,
  onSmsOtpSent,
  consentsAccepted,
  fullName,
  onFullNameChange,
}: RemoteConsentSelectorProps) {
  const t = useTranslations();
  const [selected, setSelected] = useState<RemoteConsentMethodKey | null>(null);

  const methods: Array<{
    key: RemoteConsentMethodKey;
    title: string;
    desc: string;
    Icon: typeof MessageCircle;
  }> = [
    { key: "WHATSAPP", title: t.consent.method_whatsapp_title, desc: t.consent.method_whatsapp_desc, Icon: MessageCircle },
    { key: "EMAIL", title: t.consent.method_email_title, desc: t.consent.method_email_desc, Icon: Mail },
    { key: "SMS_OTP", title: t.consent.method_sms_otp_title, desc: t.consent.method_sms_otp_desc, Icon: Hash },
    { key: "SELFIE", title: t.consent.method_selfie_title, desc: t.consent.method_selfie_desc, Icon: Camera },
  ];

  const visible = methods.filter((m) => enabledMethods.includes(m.key));

  return (
    <div className="mt-4 space-y-4 border-l-2 border-forge-warning/40 pl-6" data-testid="remote-consent-selector">
      <p className="text-sm text-forge-text-muted">{t.consent.remote_intro}</p>

      {!applicationReady && (
        <div className="rounded-xl border border-forge-warning/30 bg-forge-warning/10 p-3 text-sm text-forge-text" role="status">
          {t.consent.application_id_required}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {visible.map((m) => (
          <label
            key={m.key}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
              selected === m.key ? "border-forge-primary bg-forge-primary/10" : "border-forge-border hover:border-forge-primary/40"
            }`}
            data-testid={`method-${m.key.toLowerCase()}`}
          >
            <input
              type="radio"
              name="remote-method"
              value={m.key}
              checked={selected === m.key}
              onChange={() => setSelected(m.key)}
              className="mt-1"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <m.Icon className="h-5 w-5 shrink-0 text-forge-primary" aria-hidden />
                <span className="text-sm font-medium text-forge-text">{m.title}</span>
              </div>
              <p className="mt-1 text-xs text-forge-text-muted">{m.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {selected === "WHATSAPP" && (
        <WhatsAppConsentMethod applicationId={applicationId} applicationReady={applicationReady} onComplete={onRemoteComplete} />
      )}
      {selected === "EMAIL" && (
        <EmailConsentMethod applicationId={applicationId} applicationReady={applicationReady} onComplete={onRemoteComplete} />
      )}
      {selected === "SMS_OTP" && (
        <SMSOTPConsentMethod
          applicationId={applicationId}
          applicationReady={applicationReady}
          onOtpSent={onSmsOtpSent}
          dealerOtpCode={dealerOtpCode}
          onDealerOtpCodeChange={onDealerOtpCodeChange}
          onComplete={onRemoteComplete}
          consentsAccepted={consentsAccepted}
          fullName={fullName}
          onFullNameChange={onFullNameChange}
        />
      )}
      {selected === "SELFIE" && (
        <SelfieConsentMethod applicationId={applicationId} applicationReady={applicationReady} onComplete={onRemoteComplete} />
      )}
    </div>
  );
}
