// Consentimiento por canal. Las text_version vigentes NO viajan en C-SITES-RENDER: son una constante versionada de la
// plantilla (discrepancia reportada en el README). Deben coincidir con el texto realmente mostrado en el formulario.
export type Channel = 'email' | 'phone_sms' | 'whatsapp';
export type Locale = 'es' | 'en';
export interface Consent { channel: Channel; granted: boolean; text_version: string; text_locale: Locale }

export const TEXT_VERSIONS: Record<Channel, string> = {
  email: 'consent-email-2026-10',
  phone_sms: 'consent-sms-2026-10',
  whatsapp: 'consent-wa-2026-10',
};

const on = (v: unknown): boolean => v === true || v === 'on' || v === 'true' || v === '1';

/** Un elemento por canal. Sin marcar -> granted:false (nunca se asume). La casilla unica de Baylara ('consent') cubre llamada/SMS/WhatsApp, no email. */
export function consentsFor(f: Record<string, unknown>, locale: Locale): Consent[] {
  const single = on(f.consent);
  return (['email', 'phone_sms', 'whatsapp'] as const).map((channel) => ({
    channel,
    granted: channel === 'email' ? on(f.consent_email) : single || on(f[`consent_${channel}`]),
    text_version: TEXT_VERSIONS[channel],
    text_locale: locale,
  }));
}
