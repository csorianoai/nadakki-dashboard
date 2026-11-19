import type { CapabilityStatus, LifecycleStatus, Platform } from "./types";

export type Lang = "es" | "en";

export function detectLang(): Lang {
  if (typeof navigator !== "undefined" && /^en/i.test(navigator.language || "")) return "en";
  return "es";
}
type Dict = Record<string, string>;

const ES: Dict = {
  title: "Centro Social",
  subtitle: "Marcas y cuentas por plataforma, con el estado real de cada una.",
  brand: "Marca",
  loading: "Cargando el registro de cuentas…",
  unavailable: "Registro de cuentas no disponible todavía",
  unavailableHelp: "El servicio del Centro Social aún no responde. No mostramos datos de ejemplo: vuelve a intentarlo más tarde.",
  noBrands: "Aún no hay marcas registradas para tu organización.",
  none: "Sin registrar",
  noneHelp: "Esta plataforma aún no tiene ficha para la marca.",
  plan: "Planificar cuenta",
  wizardOpen: "Abrir asistente",
  wizardContinue: "Continuar alta",
  wizardClose: "Cerrar",
  handle: "Usuario",
  proposedHandle: "Usuario propuesto",
  neverAsk: "Nunca pedimos contraseñas ni códigos de tus redes. El alta la hace una persona en el sitio oficial.",
  officialSignup: "Ir al registro oficial",
  step1: "Paso 1 · Crea la cuenta en la plataforma y confirma que existe",
  profileUrl: "URL del perfil (https)",
  evidence: "Evidencia (URL o referencia de ticket)",
  confirmExists: "Confirmo que la cuenta existe y es nuestra",
  confirmExistsBtn: "Confirmar existencia",
  step2: "Paso 2 · Titularidad y seguridad",
  owner: "Responsable (nombre o rol)",
  ownerConfirmed: "Confirmo que somos el propietario",
  twoFactor: "La verificación en dos pasos (2FA) está activada",
  claimBtn: "Confirmar titularidad",
  step3: "Paso 3 · Perfil completo",
  photo: "Foto de perfil",
  cover: "Portada",
  bio: "Bio",
  website_url: "Enlace al sitio web en el perfil",
  profileBtn: "Marcar perfil completo",
  step4: "Paso 4 · Conectar",
  connect: "Conectar",
  connecting: "Conectando…",
  connectedInfo: "Conectada: verificada por OAuth en el servidor.",
  stepLater: "Esta cuenta ya está conectada; las siguientes etapas llegan con la publicación.",
  blockedHuman: "REQUIRES HUMAN: esta plataforma requiere un paso manual; Nadakki no puede conectarla sola.",
  blockedNot: "NOT SUPPORTED: esta plataforma no admite conexión con Nadakki por ahora.",
  blockedStub: "Aún no disponible (STUB): el flujo de conexión para esta plataforma no está implementado.",
  blockedUnknown: "No se pudo leer la matriz de capacidades: no ofrecemos Conectar sin saber si es posible.",
  actionError: "No se pudo completar la acción. Revisa los datos e inténtalo de nuevo.",
  connectError: "No se pudo iniciar la conexión.",
  demoNote: "Datos de ejemplo: el servicio real aún no está conectado.",
};
const EN: Dict = {
  title: "Social Center",
  subtitle: "Brands and accounts per platform, with each one's real status.",
  brand: "Brand",
  loading: "Loading the account registry…",
  unavailable: "Account registry not available yet",
  unavailableHelp: "The Social Center service is not responding yet. We show no sample data: please try again later.",
  noBrands: "No brands registered for your organization yet.",
  none: "Not registered",
  noneHelp: "This platform has no record for the brand yet.",
  plan: "Plan account",
  wizardOpen: "Open assistant",
  wizardContinue: "Continue setup",
  wizardClose: "Close",
  handle: "Handle",
  proposedHandle: "Proposed handle",
  neverAsk: "We never ask for passwords or codes from your networks. A person creates the account on the official site.",
  officialSignup: "Go to official sign-up",
  step1: "Step 1 · Create the account on the platform and confirm it exists",
  profileUrl: "Profile URL (https)",
  evidence: "Evidence (URL or ticket reference)",
  confirmExists: "I confirm the account exists and is ours",
  confirmExistsBtn: "Confirm existence",
  step2: "Step 2 · Ownership and security",
  owner: "Owner (name or role)",
  ownerConfirmed: "I confirm we are the owner",
  twoFactor: "Two-factor authentication (2FA) is enabled",
  claimBtn: "Confirm ownership",
  step3: "Step 3 · Complete profile",
  photo: "Profile photo",
  cover: "Cover",
  bio: "Bio",
  website_url: "Website link on the profile",
  profileBtn: "Mark profile complete",
  step4: "Step 4 · Connect",
  connect: "Connect",
  connecting: "Connecting…",
  connectedInfo: "Connected: verified by OAuth on the server.",
  stepLater: "This account is already connected; later stages arrive with publishing.",
  blockedHuman: "REQUIRES HUMAN: this platform needs a manual step; Nadakki cannot connect it on its own.",
  blockedNot: "NOT SUPPORTED: this platform cannot be connected through Nadakki for now.",
  blockedStub: "Not available yet (STUB): the connection flow for this platform is not implemented.",
  blockedUnknown: "The capability matrix could not be read: we do not offer Connect without knowing it is possible.",
  actionError: "The action could not be completed. Check the data and try again.",
  connectError: "The connection could not be started.",
  demoNote: "Sample data: the real service is not connected yet.",
};
export const COPY: Record<Lang, Dict> = { es: ES, en: EN };
export const STATUS_LABEL: Record<Lang, Record<LifecycleStatus | "NONE", string>> = {
  es: {
    NONE: "Sin registrar", PLANNED: "Planificada", EXISTS: "Existe", CLAIMED: "Titularidad confirmada",
    PROFILE_COMPLETE: "Perfil completo", CONNECTED: "Conectada", APPROVED: "Aprobada",
    READY_TO_PUBLISH: "Lista para publicar", ACTIVE: "Activa", ERROR: "Error", REVOKED: "Revocada",
  },
  en: {
    NONE: "Not registered", PLANNED: "Planned", EXISTS: "Exists", CLAIMED: "Ownership confirmed",
    PROFILE_COMPLETE: "Profile complete", CONNECTED: "Connected", APPROVED: "Approved",
    READY_TO_PUBLISH: "Ready to publish", ACTIVE: "Active", ERROR: "Error", REVOKED: "Revoked",
  },
};
export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", youtube: "YouTube", linkedin: "LinkedIn",
};

/** Registro oficial de cada plataforma (dato de plataforma, no de tenant). */
export const SIGNUP_URL: Record<Platform, string> = {
  instagram: "https://www.instagram.com/accounts/emailsignup/",
  facebook: "https://www.facebook.com/pages/create",
  tiktok: "https://www.tiktok.com/signup",
  youtube: "https://www.youtube.com/create_channel",
  linkedin: "https://www.linkedin.com/company/setup/new/",
};

/** Solo estos estados de la matriz permiten lanzar OAuth; el resto (y la ausencia de celda) falla cerrado. */
export const CONNECT_ALLOWED: CapabilityStatus[] = ["CONFIRMED_LIVE", "SANDBOX", "NO_MEDIDO"];
