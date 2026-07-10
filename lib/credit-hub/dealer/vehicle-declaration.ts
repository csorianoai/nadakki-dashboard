/** Dealer sworn vehicle declaration — contract-first (SECURITY_UI_LOOP F1). */

export type VehicleYesNo = "yes" | "no";
export type VehicleAccidentAnswer = "yes" | "no" | "unknown";

export interface VehicleDeclarationFields {
  vehicle_decl_perdida_total: "" | VehicleYesNo;
  vehicle_decl_accidentes: "" | VehicleAccidentAnswer;
  vehicle_decl_gravamenes: "" | VehicleYesNo;
  vehicle_decl_titulo_vendedor: "" | VehicleYesNo;
  vehicle_decl_km_coincide: "" | VehicleYesNo;
  vehicle_decl_signature_name: string;
  vehicle_decl_signed_at: string;
  vehicle_decl_hash: string;
}

export const INITIAL_VEHICLE_DECLARATION: VehicleDeclarationFields = {
  vehicle_decl_perdida_total: "",
  vehicle_decl_accidentes: "",
  vehicle_decl_gravamenes: "",
  vehicle_decl_titulo_vendedor: "",
  vehicle_decl_km_coincide: "",
  vehicle_decl_signature_name: "",
  vehicle_decl_signed_at: "",
  vehicle_decl_hash: "",
};

export function vehicleDeclarationQuestionsAnswered(data: VehicleDeclarationFields): boolean {
  return (
    data.vehicle_decl_perdida_total !== "" &&
    data.vehicle_decl_accidentes !== "" &&
    data.vehicle_decl_gravamenes !== "" &&
    data.vehicle_decl_titulo_vendedor !== "" &&
    data.vehicle_decl_km_coincide !== ""
  );
}

export function vehicleDeclarationComplete(data: VehicleDeclarationFields): boolean {
  return vehicleDeclarationQuestionsAnswered(data) && data.vehicle_decl_signature_name.trim().length >= 3;
}

/** Yellow inline alert when a "problem" answer is declared (does not block advance). */
export function vehicleDeclarationHasVisibleAlert(data: VehicleDeclarationFields): boolean {
  if (!vehicleDeclarationQuestionsAnswered(data)) return false;
  return (
    data.vehicle_decl_perdida_total === "yes" ||
    data.vehicle_decl_accidentes === "yes" ||
    data.vehicle_decl_gravamenes === "yes" ||
    data.vehicle_decl_titulo_vendedor === "no" ||
    data.vehicle_decl_km_coincide === "no"
  );
}

export interface DeclaracionVehiculoPayload {
  perdida_total: boolean;
  accidentes_reportados: VehicleAccidentAnswer;
  gravamenes_vigentes: boolean;
  titulo_a_nombre_vendedor: boolean;
  kilometraje_coincide: boolean;
  firma_dealer: string;
  fecha_firma: string;
  hash: string;
}

export function buildDeclaracionVehiculoPayload(data: VehicleDeclarationFields): DeclaracionVehiculoPayload | null {
  if (!vehicleDeclarationComplete(data)) return null;
  const signedAt = data.vehicle_decl_signed_at || new Date().toISOString();
  return {
    perdida_total: data.vehicle_decl_perdida_total === "yes",
    accidentes_reportados: data.vehicle_decl_accidentes as VehicleAccidentAnswer,
    gravamenes_vigentes: data.vehicle_decl_gravamenes === "yes",
    titulo_a_nombre_vendedor: data.vehicle_decl_titulo_vendedor === "yes",
    kilometraje_coincide: data.vehicle_decl_km_coincide === "yes",
    firma_dealer: data.vehicle_decl_signature_name.trim(),
    fecha_firma: signedAt,
    hash: data.vehicle_decl_hash,
  };
}

/** Bank verifications tab: green ✓ when clean, red ✗ when problem answer. */
export function getDeclaracionSemaforoRows(decl: DeclaracionVehiculoPayload): { label: string; isBad: boolean }[] {
  return [
    { label: "Pérdida total", isBad: decl.perdida_total },
    { label: "Accidentes reportados", isBad: decl.accidentes_reportados === "yes" },
    { label: "Gravámenes vigentes", isBad: decl.gravamenes_vigentes },
    { label: "Título a nombre del vendedor", isBad: !decl.titulo_a_nombre_vendedor },
    { label: "Kilometraje coincide", isBad: !decl.kilometraje_coincide },
  ];
}

function utf8Bytes(text: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text);
  const utf8 = unescape(encodeURIComponent(text));
  const bytes = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) bytes[i] = utf8.charCodeAt(i);
  return bytes;
}

export async function sha256Hex(text: string): Promise<string> {
  const enc = utf8Bytes(text);
  const buf = await crypto.subtle.digest("SHA-256", enc as BufferSource);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function computeVehicleDeclarationHash(data: VehicleDeclarationFields): Promise<string> {
  const body = {
    perdida_total: data.vehicle_decl_perdida_total,
    accidentes: data.vehicle_decl_accidentes,
    gravamenes: data.vehicle_decl_gravamenes,
    titulo: data.vehicle_decl_titulo_vendedor,
    km: data.vehicle_decl_km_coincide,
    firma: data.vehicle_decl_signature_name.trim().toLowerCase(),
  };
  return sha256Hex(JSON.stringify(body));
}
