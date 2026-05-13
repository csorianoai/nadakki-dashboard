import type { MarketingOnboardingStepId } from "./types";

export type MarketingOnboardingStepContent = {
  id: MarketingOnboardingStepId;
  title: string;
  shortLabel: string;
  summary: string;
  body: string[];
  instructions: string[];
  proTip: string;
  mistakes: string[];
  diagramCaption: string;
  useCaseNadakki: string;
  useCaseCredicefi: string;
};

export const MARKETING_ONBOARDING_STEPS: MarketingOnboardingStepContent[] = [
  {
    id: "welcome",
    shortLabel: "Bienvenida",
    title: "Bienvenida al Marketing Core de NADAKKI",
    summary:
      "Este asistente te lleva del cero a tu primera campaña coherente con datos, en menos de 30 minutos.",
    body: [
      "El Marketing Core concentra campañas multicanal, agentes de IA y flujos operativos en un solo lugar, pensado para instituciones financieras y operadores turísticos en LatAm.",
      "Sigue los pasos en orden o salta a cualquier sección para repasar; tu progreso se guarda automáticamente en este navegador y se intenta sincronizar con la suite cuando hay sesión activa.",
    ],
    instructions: [
      "Lee la ruta completa (8 pasos) para entender el recorrido.",
      "Prepara acceso de administrador a Meta Business Manager, Google Ads y (si aplica) LinkedIn Campaign Manager.",
      "Si trabajas en banca, confirma con compliance qué mensajes y segmentos están permitidos antes de publicar.",
    ],
    proTip:
      "Reserva un bloque de 25 minutos sin interrupciones: la mayor parte del tiempo se invierte en conectar cuentas y validar el pixel/conversiones.",
    mistakes: [
      "Saltar la conexión de cuentas y lanzar creatividades ‘a ciegas’ sin medición.",
      "Mezclar cuentas personales con cuentas de empresa en los conectores OAuth.",
    ],
    diagramCaption: "Ruta: conectar → objetivos → campaña → agentes → flujos → alertas.",
    useCaseNadakki:
      "Nadakki Excursions: priorizar remarketing de excursiones y captación en Google/Meta con creatividades estacionales.",
    useCaseCredicefi:
      "CrediCefi: campañas de producto responsable (crédito) con mensajes revisados por compliance y segmentación conservadora.",
  },
  {
    id: "connect",
    shortLabel: "Cuentas",
    title: "Conecta Google, Meta, LinkedIn y TikTok",
    summary: "Sin integraciones no hay señal unificada; este paso desbloquea informes y agentes.",
    body: [
      "OAuth enlaza tu tenant con cada plataforma; NADAKKI no almacena contraseñas, solo tokens revocables.",
      "Empieza por Google y Meta (donde suele estar el 80 % del gasto); LinkedIn y TikTok se añaden según tu mix.",
    ],
    instructions: [
      "Abre Social / conexiones en el portal y completa el flujo para cada red.",
      "Verifica que el administrador de la cuenta publicitaria acepte la vinculación.",
      "Para conversiones, confirma que el pixel / tag está activo en el sitio o app.",
    ],
    proTip:
      "Si tienes varios ‘customer IDs’ en Google, conecta primero el que usarás para prospecting; evita mezclar cuentas MCC sin etiquetar.",
    mistakes: [
      "Conectar un perfil personal de Meta en vez del Business Portfolio correcto.",
      "Olvidar permisos de lectura de facturación y quedarse sin visibilidad de costes.",
    ],
    diagramCaption: "OAuth: NADAKKI ↔ Meta / Google / LinkedIn / TikTok.",
    useCaseNadakki:
      "Vincular la cuenta de Meta donde corre el catálogo de tours y el pixel del sitio de reservas.",
    useCaseCredicefi:
      "Usar siempre cuentas corporativas aprobadas; documentar el Business Manager en el registro de tratamientos si aplica.",
  },
  {
    id: "goals",
    shortLabel: "Objetivos",
    title: "Define qué quieres lograr en los próximos 90 días",
    summary: "Los objetivos alinean presupuesto, creatividad y KPIs que verás en tableros.",
    body: [
      "Elige hasta tres focos: reconocimiento, generación de leads, solicitudes calificadas o retención.",
      "Para instituciones reguladas, anota riesgos de mensaje y aprueba un tono institucional único.",
    ],
    instructions: [
      "Marca en el panel interactivo los objetivos que aplican (puedes cambiarlos después).",
      "Añade una nota interna con la meta numérica (ej. +15 % leads calificados).",
      "Comparte el resumen con ventas / sucursales para alinear seguimiento.",
    ],
    proTip:
      "Un solo objetivo primario por trimestre simplifica la optimización de puja; lo demás puede ser secundario.",
    mistakes: [
      "Medir ‘likes’ como único KPI cuando el negocio paga por aplicaciones o créditos.",
      "Cambiar el objetivo cada semana antes de que el algoritmo estabilice aprendizaje.",
    ],
    diagramCaption: "Objetivos → métricas → creatividades → puja.",
    useCaseNadakki: "Objetivo principal: reservas; secundario: tráfico de calidad al landing de Miami.",
    useCaseCredicefi: "Objetivo: solicitudes calificadas; evitar promesas de tasa en creatividad sin disclaimer.",
  },
  {
    id: "campaign",
    shortLabel: "Campaña",
    title: "Crea tu primera campaña guiada",
    summary: "Plantilla mínima viable: audiencia, oferta, creatividad y medición.",
    body: [
      "Partimos de una estructura sencilla: una campaña, dos conjuntos de anuncios (prueba A/B) y tres creatividades.",
      "Los agentes pueden sugerir copys y palabras clave, pero tú decides políticas de marca y presupuesto.",
    ],
    instructions: [
      "Abre Campañas → nueva campaña y elige el objetivo que marcaste antes.",
      "Define presupuesto diario conservador para la primera semana de aprendizaje.",
      "Adjunta medición (pixel / conversiones) antes de activar.",
      "Usa el asistente inferior de “Perfil de tenant” si aún no activaste datos de negocio en la suite.",
    ],
    proTip:
      "Mantén el conjunto de audiencia amplio al inicio; restringe demasiado pronto y el sistema no encuentra señal.",
    mistakes: [
      "Editar creatividad y audiencia el mismo día — no sabrás qué movimiento funcionó.",
      "Pausar la campaña antes de 7 días de aprendizaje salvo alertas de compliance.",
    ],
    diagramCaption: "Campaña → conjuntos → anuncios → conversiones.",
    useCaseNadakki: "Promocionar ‘sunset cruise’ con creatividad UGC y extensión de ubicación.",
    useCaseCredicefi: "Campaña de ‘crédito personal’ con disclaimer visible y landing en HTTPS corporativo.",
  },
  {
    id: "agents",
    shortLabel: "Agentes",
    title: "Entiende el catálogo de agentes de IA",
    summary: "Cada agente cubre una micro-tarea: investigación, redacción, limpieza de términos, pacing, etc.",
    body: [
      "Piensa en los agentes como especialistas: tú orquestas, ellos ejecutan tareas repetibles con contexto del tenant.",
      "Desde el Marketing Core puedes lanzar dry-runs seguros antes de aplicar cambios en cuentas reales.",
    ],
    instructions: [
      "Explora la lista interactiva y lee el cometido de cada rol.",
      "Abre Marketing → Agentes para ejecutar uno con datos reales cuando estés listo.",
      "Documenta en tu equipo quién aprueba ejecuciones que gastan presupuesto.",
    ],
    proTip:
      "Empieza por agentes de diagnóstico (auditorías) antes de los que modifican pujas o creatividades.",
    mistakes: [
      "Ejecutar en producción sin revisar el payload sugerido.",
      "Asignar el mismo agente a tareas que requieren compliance distinto (banca vs turismo).",
    ],
    diagramCaption: "Catálogo de agentes por función (estrategia, creatividad, operación).",
    useCaseNadakki: "Generador de RSA + optimizador de términos de búsqueda para campañas estacionales.",
    useCaseCredicefi: "Agentes de riesgo/compliance solo en modo propuesta hasta aprobación legal.",
  },
  {
    id: "workflow",
    shortLabel: "Flujos",
    title: "Activa un flujo de trabajo de ejemplo",
    summary: "Los flujos automatizan secuencias largas: investigación competitiva, brief creativo, optimización semanal.",
    body: [
      "Un flujo conecta agentes, aprobaciones humanas y publicación; reduce trabajo manual en equipos pequeños.",
      "Puedes clonar plantillas y ajustar triggers (cron, umbral de CPA, stock de creatividades).",
    ],
    instructions: [
      "Selecciona una plantilla de ejemplo en el panel y revisa sus pasos.",
      "Visita Workflows en el portal para ver la versión completa cuando necesites profundizar.",
      "Define responsables de aprobación antes de activar automatismos con impacto en media spend.",
    ],
    proTip:
      "Activa notificaciones antes de encender un flujo que envía correos a clientes finales.",
    mistakes: [
      "Dejar pasos de aprobación en blanco y que el flujo publique sin revisión humana.",
      "Duplicar flujos sin renombrar — genera choques de programación.",
    ],
    diagramCaption: "Trigger → pasos de agente → revisión humana → acción en plataforma.",
    useCaseNadakki: "Flujo semanal de refresco de creatividades para campañas de barcos.",
    useCaseCredicefi: "Flujo mensual de revisión de mensajes con checklist compliance.",
  },
  {
    id: "notifications",
    shortLabel: "Alertas",
    title: "Configura notificaciones y alertas operativas",
    summary: "Las alertas evitan sorpresas en presupuesto, interrupciones de pixel o creatividades rechazadas.",
    body: [
      "Combina alertas in-app (rápidas) con correo para incidentes fuera de horario.",
      "En entornos regulados, documenta qué datos salen por cada canal.",
    ],
    instructions: [
      "Ajusta los toggles de demostración aquí; luego refina en Ajustes → notificaciones.",
      "Define umbrales de gasto y CPA con tu equipo financiero.",
      "Prueba una alerta de prueba antes del lanzamiento real.",
    ],
    proTip:
      "Menos alertas pero accionables mejor que decenas de ruido que tu equipo ignore.",
    mistakes: [
      "Enviar alertas solo al correo individual; si está de vacaciones, nadie reacciona.",
      "No registrar cambios de umbrales — imposible auditar después.",
    ],
    diagramCaption: "Evento → reglas → canal (email, Slack, in-app).",
    useCaseNadakki: "Alerta cuando el gasto diario supera 120 % en temporada alta.",
    useCaseCredicefi: "Alerta cuando una creatividad es rechazada o el sitio pierde el certificado TLS.",
  },
  {
    id: "done",
    shortLabel: "Listo",
    title: "¡Integración completa! Próximos pasos",
    summary: "Ya tienes el mapa mental del Marketing Core y los enlaces clave a mano.",
    body: [
      "Vuelve a este asistente cuando incorpores nuevos mercados o cambies de agencia: sirve como checklist vivo.",
      "Si eres tenant existente, puedes marcar pasos como completados y repasar solo lo que cambió.",
    ],
    instructions: [
      "Visita el tablero de Marketing para ver métricas en vivo.",
      "Programa una reunión de 15 minutos con tu CSM para validar KPIs.",
      "Archiva capturas de configuración en tu drive interno (útil para auditorías).",
    ],
    proTip:
      "Cada trimestre, repite el paso de objetivos y ajusta presupuestos; las cuentas maduran y la mezcla óptima cambia.",
    mistakes: [
      "Dar por cerrado el onboarding sin documentar quién mantiene tokens OAuth.",
      "No revisar permisos cuando rotan personas clave en Meta/Google.",
    ],
    diagramCaption: "Operación continua: medir → aprender → iterar.",
    useCaseNadakki: "Revisión quincenal de creatividades estacionales.",
    useCaseCredicefi: "Revisión legal trimestral de mensajes y landing.",
  },
];

export const GOAL_OPTIONS: { key: string; label: string }[] = [
  { key: "leads", label: "Generación de leads calificados" },
  { key: "brand", label: "Awareness y consideración de marca" },
  { key: "conv", label: "Conversiones / ventas en sitio o app" },
  { key: "credit", label: "Originación de crédito (retail/SME)" },
  { key: "cross", label: "Cross-sell a base actual" },
  { key: "geo", label: "Expansión a nuevas ciudades o países" },
];

export const WORKFLOW_SAMPLES: { id: string; title: string; description: string }[] = [
  {
    id: "win",
    title: "Optimización semanal de performance",
    description: "Revisa CPA, pausa creatividades fatigadas y escala las ganadoras automáticamente.",
  },
  {
    id: "brief",
    title: "Brief creativo asistido",
    description: "Junta insights de audiencia, propone tres ángulos de mensaje y genera variantes RSA.",
  },
  {
    id: "comp",
    title: "Pulso competitivo",
    description: "Monitorea menciones y avisos de competencia; resume hallazgos cada lunes.",
  },
];
