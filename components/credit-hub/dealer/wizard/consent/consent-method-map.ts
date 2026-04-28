export type RemoteConsentMethodKey = "WHATSAPP" | "EMAIL" | "SMS_OTP" | "SELFIE";

const ORDER: RemoteConsentMethodKey[] = ["WHATSAPP", "EMAIL", "SMS_OTP", "SELFIE"];

/** Normaliza códigos de tenant (incl. legacy) a claves de UI y API. */
export function normalizeRemoteConsentMethods(enabled: string[]): RemoteConsentMethodKey[] {
  const set = new Set<RemoteConsentMethodKey>();
  for (const raw of enabled) {
    const m = String(raw).trim();
    if (m === "WHATSAPP" || m === "WHATSAPP_LINK") set.add("WHATSAPP");
    else if (m === "EMAIL" || m === "OTP_EMAIL") set.add("EMAIL");
    else if (m === "SMS_OTP" || m === "OTP_SMS") set.add("SMS_OTP");
    else if (m === "SELFIE") set.add("SELFIE");
  }
  return ORDER.filter((k) => set.has(k));
}
