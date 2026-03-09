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
  decision_final_humana?: string;
  override_usuario?: string;
  override_justificacion?: string;
  version_activa?: string;
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
  evidencia_id?: string;
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
  generado_por?: string;
  mensaje_error?: string;
}

export interface Evidencia {
  evidencia_id?: string;
  tipo_evidencia?: string;
  referencia?: string;
  origen?: string;
  detalle?: string;
  expediente_id?: string;
  url?: string;
  metadata?: Record<string, unknown>;
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

export async function fetchAuditoriaGlobal(
  tenantId: string,
  limit?: number
): Promise<EventoAuditoria[]> {
  const q = limit ? `?limit=${limit}` : "";
  const res = await fetch(`${API_BASE}/api/v1/sic/auditoria${q}`, {
    headers: headers(tenantId),
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Auditoría global: ${res.status}`);
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

export async function fetchExportacionesGlobal(
  tenantId: string,
  limit?: number
): Promise<Exportacion[]> {
  const q = limit ? `?limit=${limit}` : "";
  const res = await fetch(`${API_BASE}/api/v1/sic/exportaciones${q}`, {
    headers: headers(tenantId),
  });
  if (!res.ok) {
    if (res.status === 404 || res.status === 500) return [];
    throw new Error(`Exportaciones global: ${res.status}`);
  }
  const data = await res.json();
  return data.exportaciones ?? data.data ?? (Array.isArray(data) ? data : []);
}

export async function fetchEvidencia(
  evidenciaId: string,
  tenantId: string,
  expedienteId?: string
): Promise<Evidencia | null> {
  const params = expedienteId ? `?expediente_id=${expedienteId}` : "";
  const res = await fetch(
    `${API_BASE}/api/v1/sic/evidencias/${evidenciaId}${params}`,
    { headers: headers(tenantId) }
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Evidencia: ${res.status}`);
  }
  return res.json();
}

export type FactorConEvidencia = string | { texto: string; evidencia_id?: string };

export interface Explicabilidad {
  factores_a_favor?: FactorConEvidencia[];
  factores_en_contra?: FactorConEvidencia[];
  narrativa_ejecutiva?: string;
  reglas_aplicadas?: string[];
  flags?: Record<string, unknown>;
}

export async function fetchExplicabilidad(
  expedienteId: string,
  tenantId: string
): Promise<Explicabilidad | null> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/explicabilidad`,
    { headers: headers(tenantId) }
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Explicabilidad: ${res.status}`);
  }
  return res.json();
}

export interface Permisos {
  rol?: string;
  usuario_id?: string;
  puede_decidir?: boolean;
  puede_override?: boolean;
  puede_exportar?: boolean;
  puede_cambiar_estado?: boolean;
  puede_ver_auditoria?: boolean;
  puede_abrir_comparador?: boolean;
  transiciones_disponibles?: string[];
}

export async function fetchPermisos(
  expedienteId: string,
  tenantId: string
): Promise<Permisos | null> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/permisos`,
    { headers: headers(tenantId) }
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Permisos: ${res.status}`);
  }
  return res.json();
}

export interface ComparacionVersiones {
  version_a?: VersionAnalisis & { decision_version?: string; confianza?: number; resumen_json?: unknown };
  version_b?: VersionAnalisis & { decision_version?: string; confianza?: number; resumen_json?: unknown };
  diferencias?: {
    decision?: { antes: string; despues: string };
    confianza?: { antes: number; despues: number };
    reglas?: string[];
    flags?: Record<string, { antes?: unknown; despues?: unknown }>;
  };
}

export async function compararVersiones(
  expedienteId: string,
  tenantId: string,
  versionA: string,
  versionB: string
): Promise<ComparacionVersiones | null> {
  const params = new URLSearchParams({ version_a: versionA, version_b: versionB });
  const res = await fetch(
    `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/versiones/comparar?${params}`,
    { headers: headers(tenantId) }
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Comparar versiones: ${res.status}`);
  }
  return res.json();
}

export interface OverrideRequest {
  decision_final: string;
  justificacion: string;
}

export async function cambiarEstado(
  expedienteId: string,
  tenantId: string,
  nuevoEstado: string,
  motivo?: string
): Promise<{ success?: boolean }> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/transiciones`,
    {
      method: "POST",
      headers: headers(tenantId),
      body: JSON.stringify({ nuevo_estado: nuevoEstado, motivo }),
    }
  );
  if (!res.ok) throw new Error(`Transición: ${res.status}`);
  return res.json();
}

export async function enviarOverride(
  expedienteId: string,
  tenantId: string,
  body: OverrideRequest
): Promise<{ success?: boolean }> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/decision`,
    {
      method: "POST",
      headers: headers(tenantId),
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`Override: ${res.status}`);
  return res.json();
}

// ——— Comité ———

export interface SesionComite {
  sesion_id: string;
  tenant_id?: string;
  fecha_sesion?: string;
  estado_sesion?: "programada" | "abierta" | "cerrada" | "pospuesta";
  participantes?: string[];
  expedientes_count?: number;
  creado_por?: string;
}

export interface ExpedienteEnSesion {
  expediente_id: string;
  sesion_id: string;
  orden?: number;
  decision_ia?: string;
  confianza?: number;
  votos_a_favor?: number;
  votos_en_contra?: number;
  decision_final_sesion?: string;
  votos?: { participante: string; voto: "apruebo" | "rechazo" | "abstenido"; fecha?: string }[];
}

export async function fetchSesionesComite(
  tenantId: string,
  limit?: number
): Promise<SesionComite[]> {
  const q = limit ? `?limit=${limit}` : "";
  const res = await fetch(`${API_BASE}/api/v1/sic/comite/sesiones${q}`, {
    headers: headers(tenantId),
  });
  if (!res.ok) {
    if (res.status === 404 || res.status === 500) return [];
    throw new Error(`Sesiones comité: ${res.status}`);
  }
  const data = await res.json();
  return data.sesiones ?? data.data ?? (Array.isArray(data) ? data : []);
}

export async function fetchSesionComite(
  sesionId: string,
  tenantId: string
): Promise<SesionComite | null> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/comite/sesiones/${sesionId}`,
    { headers: headers(tenantId) }
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Sesión: ${res.status}`);
  }
  return res.json();
}

export async function fetchExpedientesSesion(
  sesionId: string,
  tenantId: string
): Promise<ExpedienteEnSesion[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/comite/sesiones/${sesionId}/expedientes`,
    { headers: headers(tenantId) }
  );
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Expedientes sesión: ${res.status}`);
  }
  const data = await res.json();
  return data.expedientes ?? data.data ?? (Array.isArray(data) ? data : []);
}

export async function votarExpediente(
  sesionId: string,
  expedienteId: string,
  tenantId: string,
  voto: "apruebo" | "rechazo" | "abstenido"
): Promise<{ success?: boolean }> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/comite/sesiones/${sesionId}/votar`,
    {
      method: "POST",
      headers: headers(tenantId),
      body: JSON.stringify({ expediente_id: expedienteId, voto }),
    }
  );
  if (!res.ok) throw new Error(`Voto: ${res.status}`);
  return res.json();
}

export async function cerrarSesionComite(
  sesionId: string,
  tenantId: string,
  memo?: string
): Promise<{ success?: boolean }> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/comite/sesiones/${sesionId}/cerrar`,
    {
      method: "POST",
      headers: headers(tenantId),
      body: JSON.stringify({ memo }),
    }
  );
  if (!res.ok) throw new Error(`Cerrar sesión: ${res.status}`);
  return res.json();
}

// ——— Replay ———

export interface ReplayData {
  expediente_id: string;
  version_analizada?: VersionAnalisis;
  decision_ia?: string;
  confianza?: number;
  decision_final?: string;
  override_activo?: boolean;
  override_usuario?: string;
  override_fecha?: string;
  reglas_aplicadas?: string[];
  evidencias_usadas?: Evidencia[];
  timeline?: { fecha?: string; evento?: string; actor?: string }[];
}

export async function fetchReplay(
  expedienteId: string,
  tenantId: string
): Promise<ReplayData | null> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/replay`,
    { headers: headers(tenantId) }
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Replay: ${res.status}`);
  }
  return res.json();
}

// ——— Portafolio / Analítica ———

export interface PortafolioAnalytics {
  expedientes_por_estado?: Record<string, number>;
  tiempo_promedio_dias?: number;
  tasa_overrides?: number;
  aprobados?: number;
  rechazados?: number;
  riesgos_frecuentes?: { riesgo: string; count: number }[];
  productividad_analista?: { analista: string; expedientes: number }[];
  actividad_comite?: { sesiones: number; expedientes_resueltos: number };
}

export async function fetchPortafolioAnalytics(
  tenantId: string
): Promise<PortafolioAnalytics | null> {
  const res = await fetch(`${API_BASE}/api/v1/sic/portafolio/analytics`, {
    headers: headers(tenantId),
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Analytics: ${res.status}`);
  }
  return res.json();
}

// ——— Paquete Regulatorio ———

export async function generarPaqueteRegulatorio(
  expedienteId: string,
  tenantId: string
): Promise<{ exportacion_id?: string; url?: string } | null> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/exportaciones/regulatorio`,
    { method: "POST", headers: headers(tenantId) }
  );
  if (!res.ok) throw new Error(`Paquete regulatorio: ${res.status}`);
  return res.json();
}

// ——— Métricas ejecutivas ———

export interface MetricasEjecutivas {
  expedientes_por_estado?: Record<string, number>;
  tiempo_promedio_decision_horas?: number;
  total_overrides?: number;
  tasa_overrides?: number;
  aprobados?: number;
  rechazados?: number;
  productividad_analista?: { analista: string; expedientes: number; resueltos: number }[];
  uso_por_rol?: { rol: string; sesiones: number; accesos: number }[];
  rendimiento_operativo?: { uptime_pct?: number; latencia_p50_ms?: number };
}

export async function fetchMetricasEjecutivas(tenantId: string): Promise<MetricasEjecutivas | null> {
  const res = await fetch(`${API_BASE}/api/v1/sic/metricas`, { headers: headers(tenantId) });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Métricas: ${res.status}`);
  }
  return res.json();
}

// ——— Estado del sistema ———

export interface EstadoSistema {
  salud?: "ok" | "degradado" | "error";
  conectividad?: boolean;
  eventos_criticos?: number;
  alertas_seguridad?: number;
  ultima_revision?: string;
}

export async function fetchEstadoSistema(tenantId: string): Promise<EstadoSistema | null> {
  const res = await fetch(`${API_BASE}/api/v1/sic/health`, { headers: headers(tenantId) });
  if (!res.ok) {
    if (res.status === 404) return { salud: "error", conectividad: false };
    return null;
  }
  return res.json();
}

// ——— Configuración por banco ———

export interface ConfigBanco {
  branding?: { logo_url?: string; nombre_institucion?: string; color_primario?: string };
  politicas?: Record<string, unknown>;
  matrices_riesgo?: unknown[];
  reglas_decision?: unknown[];
  roles_internos?: { rol: string; permisos: string[] }[];
  integraciones_sso?: { proveedor: string; activo: boolean }[];
}

export async function fetchConfigBanco(tenantId: string): Promise<ConfigBanco | null> {
  const res = await fetch(`${API_BASE}/api/v1/sic/configuracion`, { headers: headers(tenantId) });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Config: ${res.status}`);
  }
  return res.json();
}

// ——— Auditoría de acceso ———

export interface EventoAcceso {
  evento_id: string;
  usuario_id?: string;
  rol?: string;
  accion?: string;
  recurso?: string;
  datos_sensibles?: boolean;
  fecha?: string;
  ip?: string;
}

export async function fetchAuditoriaAcceso(
  tenantId: string,
  limit?: number
): Promise<EventoAcceso[]> {
  const q = limit ? `?limit=${limit}` : "";
  const res = await fetch(`${API_BASE}/api/v1/sic/auditoria-acceso${q}`, { headers: headers(tenantId) });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Auditoría acceso: ${res.status}`);
  }
  const data = await res.json();
  return data.eventos ?? data.data ?? (Array.isArray(data) ? data : []);
}

// ——— Modo Demo (backend simulador) ———

export type EscenarioDemoBackend =
  | "banco_conservador"
  | "banco_agresivo"
  | "crisis_economica"
  | "alta_morosidad"
  | "expansion_crediticia";

export async function fetchDemoExpedientes(
  tenantId: string,
  escenario: EscenarioDemoBackend
): Promise<Expediente[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/demo/expedientes?escenario=${escenario}`,
    { headers: headers(tenantId) }
  );
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Demo expedientes: ${res.status}`);
  }
  const data = await res.json();
  return data.expedientes ?? data.data ?? (Array.isArray(data) ? data : []);
}

export async function fetchDemoSesiones(
  tenantId: string,
  escenario: EscenarioDemoBackend
): Promise<{ sesion_id: string; fecha_sesion?: string; estado_sesion?: string; expedientes_count?: number; creado_por?: string }[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/sic/demo/sesiones?escenario=${escenario}`,
    { headers: headers(tenantId) }
  );
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Demo sesiones: ${res.status}`);
  }
  const data = await res.json();
  return data.sesiones ?? data.data ?? (Array.isArray(data) ? data : []);
}
