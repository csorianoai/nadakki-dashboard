/**
 * Qué hace cada página del menú de los módulos que usan ModuleShell (Marketing, Legal, Proyectos y
 * Administración), en una línea y en español. Se escribió leyendo cada ruta en app/ (título y contenido), sin
 * frases genéricas. Se indexa por id de item del registro (lib/modulos/registro.ts), que es quien las aplica:
 * tests/nav/modulos-grupos.test.tsx falla si un item de menú queda sin descripción o pasa de 110 caracteres.
 */
export const MAX_DESCRIPCION = 110;

export const DESCRIPCIONES: Record<string, string> = {
  // Marketing · Campañas
  "mkt-campanas-/marketing-hub": "Entrada de Marketing: te lleva al panel con el resumen de campañas, canales y resultados.",
  "mkt-campanas-/marketing/campaigns": "Lista de campañas con su estado y total; abre cada una o crea otra desde aquí.",
  "mkt-campanas-/marketing/campaigns/new": "Asistente paso a paso para crear una campaña: nombre, descripción, canales y publicación.",
  "mkt-campanas-/marketing/journeys": "Recorridos automáticos del cliente: cuántos hay, su estado y cómo avanza cada contacto.",
  "mkt-campanas-/marketing/calendar": "Calendario mensual con las campañas programadas del tenant seleccionado.",
  "mkt-campanas-/email/campaigns": "Campañas de correo con enviados, abiertos y clics de cada una.",
  "mkt-campanas-/marketing/whatsapp": "Canal de ventas conversacional por WhatsApp: estado de la conexión y su configuración.",
  "mkt-campanas-/workflows": "Flujos de marketing con IA por etapa: cuántos hay activos y qué agentes usa cada uno.",
  "mkt-campanas-/automations": "Secuencias automáticas: sus disparadores y cuántas veces se han ejecutado.",
  "mkt-campanas-/autopilot": "Centro de control del piloto automático que optimiza campañas; muestra su estado y errores.",
  "mkt-campanas-/ame": "Vista de solo lectura del motor de marketing autónomo: estado, ejecuciones y acciones registradas.",
  // Marketing · Anuncios
  "mkt-anuncios-/advertising": "Entrada de publicidad de pago: métricas del panel y acceso a cada plataforma de anuncios.",
  "mkt-anuncios-/advertising/google-ads": "Google Ads: auditoría de conversiones, diagnóstico PMax y propuestas de campañas y creativos.",
  "mkt-anuncios-/advertising/meta-ads": "Meta Ads: panel de métricas de anuncios, conectado al API de publicidad.",
  "mkt-anuncios-/advertising/linkedin-ads": "LinkedIn Ads: panel de métricas de anuncios, conectado al API de publicidad.",
  "mkt-anuncios-/advertising/tiktok-ads": "TikTok Ads: métricas agregadas de publicidad en TikTok desde el panel de anuncios.",
  "mkt-anuncios-/advertising/unified": "Resumen de todas las plataformas de anuncios juntas, calculado desde el mismo panel.",
  // Marketing · Redes
  "mkt-redes-/social": "Gestión unificada de redes sociales con IA; indica qué módulos piden conectar tus cuentas.",
  "mkt-redes-/social/inbox": "Bandeja única de mensajes, comentarios y menciones de tus redes.",
  "mkt-redes-/marketing/social-connections": "Conexiones sociales: conecta o revisa la sesión de cada red por OAuth manual.",
  "mkt-redes-/social/analytics": "Rendimiento en redes: alcance, seguidores e interacción por cuenta.",
  // Marketing · Contenido
  "mkt-contenido-/content": "Centro de creación y gestión de contenido, con acceso a sus herramientas.",
  "mkt-contenido-/content/calendar": "Calendario mensual de publicaciones programadas por red: posts, hilos, correos y reels.",
  "mkt-contenido-/marketing/templates": "Plantillas de campaña: crea, edita y elimina las que reutilizas.",
  "mkt-contenido-/library": "Biblioteca de recursos: banco de imágenes, videos y documentos, y biblioteca de prompts.",
  "mkt-contenido-/ai-studio": "Herramientas de IA para generar textos, imágenes y otro contenido de marketing.",
  // Marketing · Leads
  "mkt-leads-/leads": "Gestión de leads con puntuación por IA y acceso a sus módulos.",
  "mkt-leads-/leads/pipeline": "Embudo de ventas por etapa con el número de leads y el valor de cada una.",
  "mkt-leads-/segments": "Segmentos de clientes para dirigir campañas. Hoy es una pantalla inicial.",
  "mkt-leads-/audiences": "Segmentación y gestión de audiencias: ver segmentos y contactos.",
  // Marketing · Resultados
  "mkt-resultados-/analytics": "Centro de analítica: reúne resultados, retorno de inversión, informes y vistas de marketing.",
  "mkt-resultados-/analytics/campaigns": "Rendimiento detallado de cada campaña: impresiones, clics, conversiones y retorno.",
  "mkt-resultados-/analytics/roi": "Retorno de la inversión por canal. El desglose por canal está en desarrollo.",
  "mkt-resultados-/marketing/attribution": "Atribución: agentes de la categoría que asignan el mérito de cada venta a su canal.",
  "mkt-resultados-/intelligence": "Análisis de mercado y de la competencia para decidir dónde invertir.",
  // Legal
  "legal-home": "Portada de Legal: accesos rápidos y asistencia legal automatizada.",
  "legal-cases": "Lista de expedientes del despacho, con acceso al detalle de cada caso.",
  "legal-cases-new": "Asistente para abrir un expediente nuevo con sus partes y datos.",
  "legal-contracts": "Revisa un contrato: cláusulas riesgosas, validación legal y cumplimiento por área de práctica.",
  "legal-research": "Investigación jurídica asistida por IA, a pantalla completa.",
  "legal-audit": "Trazabilidad de lo que se hizo en Legal: eventos y cifras de auditoría.",
  "legal-config": "Configuración de Legal: manifiesto del paquete de conocimiento y jurisdicciones disponibles.",
  "legal-audiencias": "Calendario de audiencias del despacho.",
  "legal-library": "Biblioteca legal: búsqueda normativa indexada y el estado de su base de conocimiento.",
  // Proyectos
  "projects-dash": "Mesa de obra digital: indicadores en vivo y accesos a los tableros de la cartera.",
  "projects-portfolio": "Portafolio inmobiliario: mosaicos de proyecto con estado y presupuesto; abre cada obra.",
  "projects-dash-ceo": "Tablero de dirección: presión de presupuesto, dispersión por estado y vitalidad de la cartera.",
  "projects-dash-pm": "Tablero del gerente de proyecto: consumo de presupuesto, avance por fases y obras críticas.",
  "projects-dash-inv": "Tablero del inversionista: modelos ilustrativos de viabilidad y presupuestos de la cartera.",
  "projects-new": "Asistente de alta de un proyecto nuevo, enviado al servicio de proyectos del tenant.",
  // Administración · Plataforma
  "adm-home": "Panel de administración: agentes, tenants, registros y configuración del sistema.",
  "adm-gates": "Gates de configuración que devuelve el API; actívalos o ciérralos para el tenant.",
  "adm-network-cockpit": "Cabina de la red: vista de tenants, usuarios, finanzas y crédito de toda la plataforma.",
  "adm-real-estate": "Administración de Real Estate: llegará en breve; hoy sin pantalla, por eso no tiene enlace.",
  "adm-flags": "Interruptores de funciones: ver cuáles están activas. Hoy muestra una lista de ejemplo.",
  // Administración · Cuenta
  "set-home": "Ajustes generales del sistema y preferencias, incluida tu clave de API.",
  "set-integrations": "Integraciones disponibles con servicios externos.",
  "adm-billing-root": "Plan contratado, pago con Stripe e historial de facturas.",
  "adm-audit": "Registro de auditoría en vivo del tenant seleccionado, con filtros.",
};
