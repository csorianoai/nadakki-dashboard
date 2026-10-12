/** Web del agente: plantilla propia, formulario con consentimiento y brokerage licenciada. */
export interface PublishGates {
  domainVerified: boolean;
  licenseApproved: boolean;
  brokerApproved: boolean;
  policyApproved: boolean;
}

/** Sin backend de publicación todas las puertas están cerradas: nada se simula como aprobado. */
export const CLOSED_GATES: PublishGates = { domainVerified: false, licenseApproved: false, brokerApproved: false, policyApproved: false };

export interface AgentSiteProfile {
  agentName: string;
  domain: string;
  brokerageLicensedName: string;
  licenseNumber: string;
  email: string;
  phone: string;
}

/** Perfil de ejemplo: siempre se rotula DEMO en pantalla. */
export const DEMO_PROFILE: AgentSiteProfile = {
  agentName: "Agente de ejemplo",
  domain: "ejemplo-agente.example",
  brokerageLicensedName: "Brokerage Ejemplo, LLC",
  licenseNumber: "DEMO-0000",
  email: "contacto@ejemplo-agente.example",
  phone: "+1 000 000 0000",
};

export const PRIVACY_NOTICE =
  "Aviso de privacidad: usamos tus datos solo para responder a tu consulta. No los vendemos. Puedes pedir su acceso o borrado en cualquier momento.";

export const CONSENT_LABEL = "Acepto el aviso de privacidad y que me contacten por mi consulta";

export interface ContactForm {
  name: string;
  email: string;
  message: string;
  consent: boolean;
}

export type FormErrors = Partial<Record<keyof ContactForm, string>>;

export function validateContact(f: ContactForm): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim()) e.name = "Escribe tu nombre.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Escribe un correo válido.";
  if (!f.message.trim()) e.message = "Escribe tu mensaje.";
  if (!f.consent) e.consent = "Debes aceptar el aviso de privacidad para enviar.";
  return e;
}

/** Razones por las que no se puede publicar; vacío = publicable. Exige también nombre licenciado de la brokerage. */
export function publishBlockers(p: AgentSiteProfile, g: PublishGates): string[] {
  const out: string[] = [];
  if (!g.domainVerified) out.push("Dominio sin verificar");
  if (!g.licenseApproved || !p.licenseNumber.trim()) out.push("Licencia sin aprobar");
  if (!g.brokerApproved || !p.brokerageLicensedName.trim()) out.push("Broker sin aprobar");
  if (!g.policyApproved) out.push("Política sin aprobar");
  return out;
}
