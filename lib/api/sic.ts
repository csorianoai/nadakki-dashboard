/**
 * Servicios API SIC — Sistema de Información Crediticia
 * Consume endpoints backend /api/v1/sic
 */

const API_BASE = "";

export type EstadoExpediente =
  | "RECIBIDO"
  | "EN_VALIDACION"
  | "EN_ANALISIS_IA"
  | "EN_REVISION_ANALISTA"
  | "EN_COMITE"
  | "REQUIERE_INFORMACION"
  | "APROBADO"
  | "RECHAZADO"
  | "ARCHIVADO"
  | "REABIERTO";

export interface Expediente {
  expediente_id: string;
  tenant_id?: string;
  referencia_cliente?: string;
  referencia_producto?: string;
  estado_expediente?: EstadoExpediente | string;
  decision_actual?: string;
  confianza_decision?: number;
  creado_por?: string;
  asignado_a?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  metadata_json?: Record<string, unknown>;
}

export interface Nota {
  nota_id: string;
  expediente_id: string;
  usuario_id?: string;
  rol_usuario?: string;
  contenido: string;
  fecha_creacion?: string;
}

export interface EventoAuditoria {
  evento_id: string;
  expediente_id?: string;
  tipo_evento?: string;
  actor_id?: string;
  actor_rol?: string;
  detalle?: string;
  fecha_evento?: string;
}

export interface VersionAnalisis {
  version_id: string;
  expediente_id: string;
  numero_version?: number;
  origen_version?: string;
  decision_version?: string;
  fecha_version?: string;
}

export interface Exportacion {
  exportacion_id: string;
  expediente_id: string;
  tipo_exportacion?: string;
  estado_exportacion?: string;
  fecha_generacion?: string;
}

function headers(tenantId: string, overrides?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Tenant-ID": tenantId,
    ...overrides,
  };
}

export async function fetchExpedientes(tenantId: string): Promise<Expediente[]> {
  const res = await fetch(`${API_BASE}/api/v1/sic/expedientes`, {
    headers: headers(tenantId),
  });
  if (!res.ok) {
    if (res.status === 404 || res.status === 500 || res.status === 503) return [];
    throw new Error(`Expedientes: ${res.status}`);
  }
  const data = await res.json();
  return data.expedientes ?? data.data ?? (Array.isArray(data) ? data : []);
}

export async function fetchExpediente(expedienteId: string, tenantId: string): Promise<Expediente | null> {
  const res = await fetch(`${API_BASE}/api/v1/sic/expedientes/${expedienteId}`, {
    headers: headers(tenantId),
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Expediente: ${res.status}`);
  }
  return res.json();
}

export async function fetchTimeline(expedienteId: string, tenantId: string): Promise<unknown[]> {
  const res = await fetch(`${API_BASE}/api/v1/sic/expedientes/${expedienteId}/timeline`, {
    headers: headers(tenantId),
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Timeline: ${res.status}`);
  }
  const data = await res.json();
  return data.timeline ?? data.eventos ?? (Array.isArray(data) ? data : []);
}

export async function fetchNotas(expedienteId: string, tenantId: string): Promise<Nota[]> {
  const res = await fetch(`${API_BASE}/api/v1/sic/expedientes/${expedienteId}/notas`, {
    headers: headers(tenantId),
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Notas: ${res.status}`);
  }
  const data = await res.json();
  return data.notas ?? (Array.isArray(data) ? data : []);
}

export async function crearNota(
  expedienteId: string,
  tenantId: string,
  contenido: string
): Promise<Nota | null> {
  const res = await fetch(`${API_BASE}/api/v1/sic/expedientes/${expedienteId}/notas`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify({ contenido }),
  });
  if (!res.ok) throw new Error(`Crear nota: ${res.status}`);
  return res.json();
}

export async function fetchVersiones(expedienteId: string, tenantId: string): Promise<VersionAnalisis[]> {
  const res = await fetch(`${API_BASE}/api/v1/sic/expedientes/${expedienteId}/versiones`, {
    headers: headers(tenantId),
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Versiones: ${res.status}`);
  }
  const data = await res.json();
  return data.versiones ?? (Array.isArray(data) ? data : []);
}

export async function fetchAuditoria(expedienteId: string, tenantId: string): Promise<EventoAuditoria[]> {
  const res = await fetch(`${API_BASE}/api/v1/sic/expedientes/${expedienteId}/auditoria`, {
    headers: headers(tenantId),
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Auditoría: ${res.status}`);
  }
  const data = await res.json();
  return data.eventos ?? data.auditoria ?? (Array.isArray(data) ? data : []);
}

export async function fetchExportaciones(
  expedienteId: string,
  tenantId: string
): Promise<Exportacion[]> {
  const res = await fetch(`${API_BASE}/api/v1/sic/expedientes/${expedienteId}/exportaciones`, {
    headers: headers(tenantId),
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Exportaciones: ${res.status}`);
  }
  const data = await res.json();
  return data.exportaciones ?? (Array.isArray(data) ? data : []);
}

export async function generarExportacionPDF(
  expedienteId: string,
  tenantId: string
): Promise<{ exportacion_id?: string; url?: string } | null> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/exportaciones/pdf`,
    { method: "POST", headers: headers(tenantId) }
  );
  if (!res.ok) throw new Error(`Generar PDF: ${res.status}`);
  return res.json();
}

export async function generarExportacionZIP(
  expedienteId: string,
  tenantId: string
): Promise<{ exportacion_id?: string; url?: string } | null> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/exportaciones/zip`,
    { method: "POST", headers: headers(tenantId) }
  );
  if (!res.ok) throw new Error(`Generar ZIP: ${res.status}`);
  return res.json();
}
