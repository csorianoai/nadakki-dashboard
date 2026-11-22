/** Validacion en pantalla de contactos. Espejo de services/autos_portal/contactos.py; el servidor sigue siendo la autoridad. */

export const KINDS = [
  { value: "fisica", label: "Persona física" },
  { value: "juridica", label: "Persona jurídica" },
] as const;

export const IVA_CONDITIONS = [
  { value: "responsable_inscripto", label: "Responsable inscripto" },
  { value: "monotributo", label: "Monotributo" },
  { value: "exento", label: "Exento" },
  { value: "consumidor_final", label: "Consumidor final" },
] as const;

export const MARITAL_STATUSES = [
  { value: "soltero", label: "Soltero/a" },
  { value: "casado", label: "Casado/a" },
  { value: "divorciado", label: "Divorciado/a" },
  { value: "viudo", label: "Viudo/a" },
  { value: "union_convivencial", label: "Unión convivencial" },
] as const;

const DNI_RE = /^(\d{7,8}|\d{1,2}\.\d{3}\.\d{3})$/;

export function validarDni(valor: string): string | null {
  return DNI_RE.test(valor.trim()) ? null : "DNI no válido: 7 u 8 dígitos, con o sin puntos de millar.";
}

export function validarCuit(valor: string): string | null {
  const s = valor.replace(/[-\s]/g, "");
  const MSG = "CUIT/CUIL no válido: 11 dígitos y dígito verificador correcto.";
  if (!/^\d{11}$/.test(s)) return MSG;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((a, p, i) => a + p * Number(s[i]), 0);
  let dv = 11 - (suma % 11);
  if (dv === 11) dv = 0;
  if (dv === 10) return MSG; // sin digito valido
  return dv === Number(s[10]) ? null : MSG;
}


/** Solo forma (espejo de contactos_puntos.normalizar_valor): sin inventar prefijos ni reglas por pais. */
export function validarTelefono(valor: string): string | null {
  const d = valor.replace(/[\s().-]/g, "");
  return /^\+?\d{6,15}$/.test(d) ? null : "Teléfono no válido: 6 a 15 dígitos, con + opcional.";
}

export function validarEmail(valor: string): string | null {
  const s = valor.trim();
  return s.length <= 254 && /^[^@\s]{1,64}@[^@\s.]+(\.[^@\s.]+)+$/.test(s) ? null : "Email no válido: use el formato nombre@dominio.com.";
}
