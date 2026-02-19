// lib/agents/knowledge-base/system-knowledge.ts

export interface SystemDocument {
  id: string;
  title: string;
  content: string;
  category: 'workflow' | 'agent' | 'core' | 'feature' | 'faq' | 'tutorial' | 'module' | 'integration';
  tags: string[];
  priority: number;
}

const documents: SystemDocument[] = [
  // ==================== SISTEMA GENERAL ====================
  {
    id: 'system-overview',
    title: 'NADAKKI AI Suite - Visión General',
    content: `NADAKKI AI Suite es una plataforma enterprise de automatización de marketing con inteligencia artificial.

Características principales:
- Agentes de IA especializados
- 20 cores funcionales
- 10 workflows de marketing automatizados
- Dashboard multi-tenant
- Analytics en tiempo real
- Integración con múltiples canales

Tecnología:
- Backend: Python/FastAPI en Render
- Frontend: Next.js 14 + TypeScript
- Base de datos: PostgreSQL
- AI: Modelos propios + integración con LLMs externos

El sistema está diseñado para ser white-label y multi-tenant, permitiendo a diferentes organizaciones usar la plataforma con su propia marca.`,
    category: 'feature',
    tags: ['sistema', 'general', 'overview', 'nadakki'],
    priority: 100
  },

  // ==================== WORKFLOWS DETALLADOS ====================
  {
    id: 'workflow-campaign-optimization',
    title: 'Campaign Optimization Workflow',
    content: `Campaign Optimization es un workflow CORE con 5 agentes de IA.

Propósito: Optimizar campañas de marketing para maximizar ROI.

Agentes en secuencia:
1. AudienceAnalyzerAI - Segmenta audiencias usando ML clustering y análisis predictivo
   - Inputs: Descripción de audiencia, datos históricos
   - Outputs: Segmentos priorizados, buyer personas, scores de afinidad

2. BudgetOptimizerAI - Distribuye presupuesto óptimamente
   - Tecnología: Optimización convexa, Simulación Monte Carlo
   - Outputs: Distribución por canal, proyecciones de rendimiento

3. ContentGeneratorAI - Genera copies y creativos
   - Tecnología: GPT-4, análisis de sentimiento
   - Outputs: Headlines, CTAs, variantes A/B

4. ROIPredictorAI - Predice retorno de inversión
   - Tecnología: Regresión avanzada, series temporales
   - Outputs: ROI proyectado, intervalos de confianza, escenarios

5. RecommendationEngineAI - Sintetiza recomendaciones
   - Outputs: Plan de acción priorizado, quick wins, timeline

Cómo usar:
1. Ve a Workflows → Campaign Optimization
2. Configura nombre, objetivo, canal, presupuesto
3. Describe tu audiencia objetivo (opcional)
4. Haz clic en "Ejecutar Workflow"
5. Espera 2-4 segundos
6. Revisa resultados y recomendaciones

Casos de uso:
- Lanzamiento de nuevas campañas
- Optimización de campañas con bajo rendimiento
- Redistribución de presupuesto
- Predicción de ROI antes de invertir`,
    category: 'workflow',
    tags: ['campaign', 'optimization', 'roi', 'presupuesto', 'audiencia'],
    priority: 95
  },
  {
    id: 'workflow-customer-acquisition',
    title: 'Customer Acquisition Intelligence Workflow',
    content: `Customer Acquisition Intelligence es un workflow CORE con 7 agentes de IA.

Propósito: Optimizar la adquisición de nuevos clientes y mejorar la conversión del funnel.

Agentes en secuencia:
1. LeadScorerAI - Califica leads automáticamente
   - Tecnología: Gradient Boosting, análisis de comportamiento
   - Outputs: Score de lead (0-100), probabilidad de conversión

2. BehaviorAnalyzerAI - Analiza patrones de comportamiento
   - Tecnología: Análisis de secuencias, clustering
   - Outputs: Patrones identificados, triggers de compra

3. ChannelOptimizerAI - Optimiza canales de adquisición
   - Tecnología: Multi-armed bandit, attribution modeling
   - Outputs: Mix óptimo de canales, presupuesto por canal

4. MessagePersonalizerAI - Personaliza mensajes por segmento
   - Tecnología: NLP, generación de lenguaje natural
   - Outputs: Mensajes personalizados, variantes por segmento

5. FunnelAnalyzerAI - Analiza el funnel de conversión
   - Tecnología: Análisis de cohortes, survival analysis
   - Outputs: Puntos de fricción, tasas de conversión por etapa

6. OfferOptimizerAI - Optimiza ofertas y promociones
   - Tecnología: Price elasticity modeling, A/B testing
   - Outputs: Ofertas óptimas, descuentos recomendados

7. ConversionPredictorAI - Predice conversiones
   - Tecnología: Deep learning, series temporales
   - Outputs: Predicción de conversiones, intervalos de confianza

Cómo usar:
1. Ve a Workflows → Customer Acquisition
2. Define tu objetivo de adquisición
3. Ingresa datos de tu funnel actual (opcional)
4. Ejecuta el workflow
5. Analiza las recomendaciones de cada agente`,
    category: 'workflow',
    tags: ['acquisition', 'leads', 'funnel', 'conversion', 'clientes'],
    priority: 95
  },
  {
    id: 'workflow-customer-lifecycle',
    title: 'Customer Lifecycle Revenue Workflow',
    content: `Customer Lifecycle Revenue es un workflow CORE con 6 agentes de IA.

Propósito: Maximizar el valor del ciclo de vida del cliente (CLV) y reducir churn.

Agentes en secuencia:
1. LifecycleMapperAI - Mapea etapas del ciclo de vida
   - Tecnología: State machine learning, journey mapping
   - Outputs: Etapas identificadas, transiciones típicas

2. ChurnPredictorAI - Predice riesgo de abandono
   - Tecnología: Random Forest, análisis de supervivencia
   - Outputs: Score de churn (0-100), factores de riesgo

3. ExpansionIdentifierAI - Identifica oportunidades de expansión
   - Tecnología: Association rules, recommendation systems
   - Outputs: Productos recomendados, timing óptimo

4. EngagementOptimizerAI - Optimiza engagement
   - Tecnología: Reinforcement learning, MAB
   - Outputs: Acciones de engagement, frecuencia óptima

5. ValueCalculatorAI - Calcula valor del cliente
   - Tecnología: CLV modeling, RFM analysis
   - Outputs: CLV actual, CLV potencial, segmento

6. ActionRecommenderAI - Recomienda acciones
   - Tecnología: Rule engine + ML
   - Outputs: Next best action, priorización

Métricas clave:
- Customer Lifetime Value (CLV)
- Churn Rate
- Net Revenue Retention (NRR)
- Expansion Revenue`,
    category: 'workflow',
    tags: ['lifecycle', 'clv', 'churn', 'retention', 'expansion'],
    priority: 95
  },
  {
    id: 'workflow-content-performance',
    title: 'Content Performance Engine Workflow',
    content: `Content Performance Engine es un workflow EXECUTION con 5 agentes de IA.

Propósito: Optimizar el rendimiento del contenido en todos los canales.

Agentes:
1. ContentAnalyzerAI - Analiza contenido existente
   - Análisis de engagement, reach, conversiones
   - Identifica contenido top-performing

2. SEOOptimizerAI - Optimiza para motores de búsqueda
   - Keywords research, on-page optimization
   - Technical SEO recommendations

3. HeadlineGeneratorAI - Genera titulares optimizados
   - A/B testing de headlines
   - Emotional triggers, power words

4. ContentSchedulerAI - Programa contenido
   - Best time to post por canal
   - Frecuencia óptima

5. PerformanceTrackerAI - Trackea rendimiento
   - Métricas en tiempo real
   - Alertas de bajo rendimiento

Canales soportados:
- Blog/Website
- Redes sociales
- Email
- YouTube
- Podcast`,
    category: 'workflow',
    tags: ['content', 'seo', 'performance', 'headlines', 'scheduling'],
    priority: 90
  },
  {
    id: 'workflow-social-media',
    title: 'Social Media Intelligence Workflow',
    content: `Social Media Intelligence es un workflow EXECUTION con 4 agentes de IA.

Propósito: Inteligencia y automatización de redes sociales.

Agentes:
1. SocialListenerAI - Monitorea menciones y tendencias
   - Brand mentions, sentiment analysis
   - Trending topics, hashtags relevantes

2. AudienceInsightsAI - Análisis de audiencia
   - Demographics, intereses, comportamiento
   - Influencers identificados

3. ContentCuratorAI - Curación de contenido
   - UGC identification, content ideas
   - Competitor content analysis

4. EngagementBotAI - Automatización de engagement
   - Auto-responses, comment management
   - Community management assistance

Plataformas soportadas:
- Facebook/Instagram
- Twitter/X
- LinkedIn
- TikTok
- YouTube`,
    category: 'workflow',
    tags: ['social', 'media', 'redes', 'instagram', 'facebook', 'twitter'],
    priority: 90
  },
  {
    id: 'workflow-email-automation',
    title: 'Email Automation Master Workflow',
    content: `Email Automation Master es un workflow EXECUTION con 4 agentes de IA.

Propósito: Automatizar y optimizar campañas de email marketing.

Agentes:
1. SegmentBuilderAI - Construye segmentos de audiencia
   - RFM segmentation, behavioral segments
   - Dynamic segment updates

2. EmailComposerAI - Compone emails optimizados
   - Subject lines, preheaders, body copy
   - Personalization tokens

3. SendTimeOptimizerAI - Optimiza tiempo de envío
   - Best send time por subscriber
   - Timezone optimization

4. DeliverabilityGuardAI - Asegura entregabilidad
   - Spam score checking
   - List hygiene recommendations

Tipos de campañas:
- Welcome series
- Nurturing sequences
- Promotional campaigns
- Re-engagement
- Transactional emails`,
    category: 'workflow',
    tags: ['email', 'automation', 'marketing', 'newsletter', 'correo'],
    priority: 90
  },
  {
    id: 'workflow-attribution',
    title: 'Multi-Channel Attribution Workflow',
    content: `Multi-Channel Attribution es un workflow INTELLIGENCE con 4 agentes de IA.

Propósito: Atribuir conversiones a los canales correctos y optimizar el mix de marketing.

Agentes:
1. TouchpointTrackerAI - Trackea touchpoints
   - Cross-device tracking
   - Journey reconstruction

2. AttributionModelAI - Aplica modelos de atribución
   - First touch, last touch, linear
   - Time decay, position-based
   - Data-driven (ML-based)

3. ChannelValueAI - Calcula valor por canal
   - Assisted conversions
   - Channel incrementality

4. BudgetRecommenderAI - Recomienda presupuesto
   - Optimal budget allocation
   - What-if scenarios

Modelos disponibles:
- Last Click
- First Click
- Linear
- Time Decay
- Position Based
- Data-Driven (Markov chains)`,
    category: 'workflow',
    tags: ['attribution', 'multicanal', 'conversion', 'touchpoint'],
    priority: 85
  },
  {
    id: 'workflow-competitive-intel',
    title: 'Competitive Intelligence Hub Workflow',
    content: `Competitive Intelligence Hub es un workflow INTELLIGENCE con 3 agentes de IA.

Propósito: Monitorear y analizar la competencia para identificar oportunidades.

Agentes:
1. CompetitorMonitorAI - Monitorea competidores
   - Website changes, new products
   - Pricing changes, promotions
   - Social media activity

2. MarketAnalyzerAI - Analiza el mercado
   - Market trends, industry news
   - Regulatory changes
   - New entrants

3. StrategyRecommenderAI - Recomienda estrategias
   - Competitive positioning
   - Differentiation opportunities
   - Response strategies

Fuentes de datos:
- Websites de competidores
- Redes sociales
- News y press releases
- Job postings
- Patent filings
- SEC filings (public companies)`,
    category: 'workflow',
    tags: ['competitive', 'intelligence', 'competencia', 'mercado'],
    priority: 85
  },
  {
    id: 'workflow-ab-testing',
    title: 'A/B Testing & Experimentation Workflow',
    content: `A/B Testing & Experimentation es un workflow INTELLIGENCE con 3 agentes de IA.

Propósito: Diseñar, ejecutar y analizar experimentos de manera rigurosa.

Agentes:
1. ExperimentDesignerAI - Diseña experimentos
   - Sample size calculation
   - Hypothesis formulation
   - Variant creation

2. StatisticalAnalyzerAI - Analiza resultados
   - Significance testing
   - Confidence intervals
   - Bayesian analysis

3. InsightGeneratorAI - Genera insights
   - Winner declaration
   - Segment analysis
   - Learning documentation

Tipos de tests:
- A/B tests (2 variantes)
- A/B/n tests (múltiples variantes)
- Multivariate tests
- Bandit tests (adaptive allocation)

Métricas:
- Conversion rate
- Revenue per visitor
- Average order value
- Engagement metrics`,
    category: 'workflow',
    tags: ['ab', 'testing', 'experiment', 'estadistica', 'conversion'],
    priority: 85
  },
  {
    id: 'workflow-influencer',
    title: 'Influencer & Partnership Engine Workflow',
    content: `Influencer & Partnership Engine es un workflow INTELLIGENCE con 2 agentes de IA.

Propósito: Identificar, evaluar y gestionar influencers y partnerships.

Agentes:
1. InfluencerFinderAI - Encuentra influencers
   - Relevance scoring
   - Audience overlap analysis
   - Engagement rate verification
   - Fake follower detection

2. PartnershipManagerAI - Gestiona partnerships
   - Outreach automation
   - Contract management
   - Performance tracking
   - ROI calculation

Métricas de evaluación:
- Engagement rate
- Audience demographics match
- Brand safety score
- Cost per engagement
- Estimated media value`,
    category: 'workflow',
    tags: ['influencer', 'partnership', 'collaboration', 'creator'],
    priority: 80
  },

  // ==================== TIERS DE WORKFLOWS ====================
  {
    id: 'workflow-tiers',
    title: 'Tiers de Workflows (CORE, EXECUTION, INTELLIGENCE)',
    content: `Los workflows de NADAKKI están organizados en 3 tiers:

TIER CORE (Fundamentales):
Workflows esenciales para operaciones de marketing.
- Campaign Optimization (5 agentes)
- Customer Acquisition Intelligence (7 agentes)
- Customer Lifecycle Revenue (6 agentes)
Características: Máxima prioridad, más agentes, uso frecuente.

TIER EXECUTION (Ejecución):
Workflows para operaciones del día a día.
- Content Performance Engine (5 agentes)
- Social Media Intelligence (4 agentes)
- Email Automation Master (4 agentes)
Características: Automatización táctica, alta frecuencia.

TIER INTELLIGENCE (Inteligencia):
Workflows para análisis estratégico.
- Multi-Channel Attribution (4 agentes)
- Competitive Intelligence Hub (3 agentes)
- A/B Testing & Experimentation (3 agentes)
- Influencer & Partnership Engine (2 agentes)
Características: Insights profundos, decisiones estratégicas.

Total: 10 workflows, 43 agentes de marketing.`,
    category: 'feature',
    tags: ['tiers', 'core', 'execution', 'intelligence', 'clasificación'],
    priority: 90
  },

  // ==================== CORES FUNCIONALES ====================
  {
    id: 'cores-overview',
    title: 'Cores Funcionales - Resumen',
    content: `NADAKKI tiene 20 cores funcionales con agentes de IA distribuidos:

MARKETING (35 agentes):
- Automatización de campañas
- Personalización de contenido
- Optimización de canales

LEGAL (32 agentes):
- Análisis de contratos
- Compliance automation
- Document generation

LOGÍSTICA (23 agentes):
- Route optimization
- Inventory management
- Demand forecasting

CONTABILIDAD (22 agentes):
- Automated bookkeeping
- Financial reporting
- Tax optimization

RECURSOS HUMANOS (18 agentes):
- Recruitment automation
- Performance analysis
- Employee engagement

VENTAS (20 agentes):
- Lead scoring
- Pipeline management
- Forecasting

ATENCIÓN AL CLIENTE (15 agentes):
- Ticket routing
- Sentiment analysis
- Auto-responses

FINANZAS (16 agentes):
- Cash flow prediction
- Risk assessment
- Investment analysis

Otros cores: Operaciones, IT, Compras, Calidad, I+D, Estrategia, Comunicaciones, Seguridad, Facilities, Training, Analytics, BI.`,
    category: 'core',
    tags: ['cores', 'funcionales', 'agentes', 'departamentos'],
    priority: 85
  },

  // ==================== TUTORIALES ====================
  {
    id: 'tutorial-execute-workflow',
    title: 'Cómo ejecutar un workflow paso a paso',
    content: `Tutorial: Ejecutar un workflow en NADAKKI

Paso 1: Navegar al workflow
- Ve al menú lateral → WORKFLOWS
- Selecciona el workflow que deseas ejecutar
- O ve a "Todos los Workflows" para ver los 10 disponibles

Paso 2: Configurar el workflow
- Nombre de la campaña/proyecto
- Objetivo principal (awareness, conversión, retención)
- Canal principal (email, social, paid, web)
- Presupuesto (si aplica)
- Audiencia target (descripción en lenguaje natural)

Paso 3: Ejecutar
- Haz clic en el botón "Ejecutar Workflow"
- El sistema procesa cada agente en secuencia
- Tiempo estimado: 2-10 segundos dependiendo del workflow

Paso 4: Revisar resultados
- Cada agente muestra su output específico
- Expande "Ver Output Completo" para JSON detallado
- Las recomendaciones están priorizadas

Paso 5: Tomar acción
- Usa los insights para crear campañas
- Exporta el reporte si necesitas compartirlo
- Programa ejecuciones recurrentes si es necesario

Tips:
- Mientras más contexto des, mejores resultados
- Ejecuta workflows relacionados para visión completa
- Revisa el historial para comparar ejecuciones`,
    category: 'tutorial',
    tags: ['ejecutar', 'workflow', 'paso', 'tutorial', 'guía'],
    priority: 85
  },
  {
    id: 'tutorial-dashboard',
    title: 'Cómo usar el Dashboard Principal',
    content: `Tutorial: Navegando el Dashboard de NADAKKI

Sección Superior - Métricas en Tiempo Real:
- Estado del Backend: Indica si la API está operativa
- Agentes Cargados: agentes disponibles desde catálogo
- Cores Activos: 20 cores funcionales
- Workflows Activos: 10 workflows listos

Menú Lateral:
SISTEMA:
- Dashboard Principal: Vista general
- Multi-Tenant: Gestión de tenants
- Configuración: Settings del sistema

WORKFLOWS:
- Todos los Workflows: Lista completa
- Acceso directo a cada workflow individual

Acciones Rápidas:
- Ejecutar Workflow: Acceso rápido a ejecución
- Marketing Agents: Ver agentes de marketing
- Analytics: Métricas y reportes
- Motor de Decisiones: Scoring en tiempo real

Información del Sistema:
- Tenant actual
- Plan activo
- Versión del backend
- Última actualización

Tips de navegación:
- Usa el sidebar para acceso rápido
- El botón de refresh actualiza datos del backend
- El indicador de estado muestra conexión en tiempo real`,
    category: 'tutorial',
    tags: ['dashboard', 'navegación', 'interfaz', 'tutorial'],
    priority: 80
  },
  {
    id: 'tutorial-analytics',
    title: 'Cómo usar Analytics y Reportes',
    content: `Tutorial: Analytics en NADAKKI

Acceder a Analytics:
1. Dashboard → Analytics (Acciones Rápidas)
2. O desde el menú superior

Métricas disponibles:
- Ejecuciones de workflows por período
- Tiempo promedio de procesamiento
- Distribución por tipo de workflow
- Uso de agentes por core
- Tendencias de uso

Filtros:
- Por fecha (hoy, semana, mes, custom)
- Por workflow específico
- Por tenant (si eres admin)

Exportar datos:
- CSV para análisis en Excel
- JSON para integración
- PDF para reportes

Insights automáticos:
- El sistema detecta patrones
- Sugiere workflows subutilizados
- Alerta sobre anomalías

Métricas de Copilot:
- Conversaciones totales
- Tasa de satisfacción (feedback)
- Preguntas más frecuentes
- Intents más comunes`,
    category: 'tutorial',
    tags: ['analytics', 'reportes', 'métricas', 'datos'],
    priority: 75
  },

  // ==================== FAQs ====================
  {
    id: 'faq-what-is-workflow',
    title: '¿Qué es un workflow?',
    content: `Un workflow en NADAKKI es una secuencia automatizada de agentes de IA que trabajan juntos para lograr un objetivo de marketing específico.

Características:
- Múltiples agentes en secuencia o paralelo
- Cada agente tiene un rol especializado
- El output de un agente puede ser input del siguiente
- Automatización end-to-end

Ejemplo: Campaign Optimization Workflow
1. AudienceAnalyzerAI analiza tu audiencia
2. BudgetOptimizerAI distribuye el presupuesto
3. ContentGeneratorAI crea el contenido
4. ROIPredictorAI predice resultados
5. RecommendationEngineAI da recomendaciones

Beneficios:
- Ahorro de tiempo (minutos vs horas)
- Consistencia en el análisis
- Decisiones basadas en datos
- Escalabilidad`,
    category: 'faq',
    tags: ['workflow', 'qué es', 'definición', 'básico'],
    priority: 90
  },
  {
    id: 'faq-what-is-agent',
    title: '¿Qué es un agente de IA?',
    content: `Un agente de IA es un componente especializado que realiza una tarea específica.

Características:
- Usa machine learning o inteligencia artificial
- Recibe inputs específicos
- Procesa datos con modelos ML/NLP
- Genera outputs estructurados
- Puede encadenarse con otros agentes

Tipos de agentes:
- Analizadores (procesan datos)
- Predictores (hacen predicciones)
- Generadores (crean contenido)
- Optimizadores (mejoran métricas)
- Recomendadores (sugieren acciones)

NADAKKI tiene agentes distribuidos en 20 cores.

Ejemplo:
AudienceAnalyzerAI:
- Input: Descripción de audiencia
- Proceso: ML clustering + análisis predictivo
- Output: Segmentos, personas, scores`,
    category: 'faq',
    tags: ['agente', 'ia', 'qué es', 'definición'],
    priority: 90
  },
  {
    id: 'faq-post-workflow',
    title: '¿Qué puedo hacer después de ejecutar un workflow?',
    content: `Acciones disponibles después de ejecutar:

1. Revisar resultados detallados
   - Expande "Ver Output" para JSON completo
   - Revisa cada paso y su duración

2. Crear campaña
   - Usa las recomendaciones para configurar
   - Ve a Marketing → Campaigns → Nueva

3. Exportar reporte
   - Descarga el análisis en PDF
   - Comparte con tu equipo

4. Ejecutar workflow relacionado
   - A/B Testing para probar variantes
   - Email Automation para nurturing

5. Programar ejecución recurrente
   - Configura en Scheduler
   - Ejecuta diaria o semanalmente

6. Ver en Analytics
   - Monitorea resultados de las acciones
   - Compara con predicciones`,
    category: 'faq',
    tags: ['después', 'ejecutar', 'acciones', 'siguiente'],
    priority: 80
  },
  {
    id: 'faq-workflow-time',
    title: '¿Cuánto tarda un workflow en ejecutarse?',
    content: `El tiempo de ejecución varía según el workflow:

Tiempos típicos:
- Workflows CORE: 3-8 segundos
- Workflows EXECUTION: 2-5 segundos
- Workflows INTELLIGENCE: 4-10 segundos

Factores que afectan el tiempo:
- Número de agentes en el workflow
- Complejidad del análisis
- Cantidad de datos a procesar
- Carga del servidor

El sistema muestra progreso en tiempo real:
- Indicador de cada agente procesando
- Tiempo transcurrido
- Estimación de tiempo restante

Tips para mejor rendimiento:
- Proporciona inputs concisos
- Ejecuta en horarios de baja carga
- Usa filtros para reducir datos`,
    category: 'faq',
    tags: ['tiempo', 'duración', 'velocidad', 'performance'],
    priority: 75
  },
  {
    id: 'faq-pricing',
    title: '¿Cuáles son los planes disponibles?',
    content: `NADAKKI ofrece diferentes planes:

Plan Starter:
- 5 workflows activos
- 50 ejecuciones/mes
- Soporte por email
- 1 usuario

Plan Professional:
- Todos los workflows
- 500 ejecuciones/mes
- Soporte prioritario
- 5 usuarios
- Analytics avanzado

Plan Enterprise:
- Workflows ilimitados
- Ejecuciones ilimitadas
- Soporte 24/7
- Usuarios ilimitados
- White-label
- Multi-tenant
- API access
- Custom integrations

Contacta a ventas para pricing específico y demos personalizadas.`,
    category: 'faq',
    tags: ['planes', 'pricing', 'precios', 'suscripción'],
    priority: 70
  },
  {
    id: 'faq-integrations',
    title: '¿Con qué herramientas se integra NADAKKI?',
    content: `NADAKKI se integra con múltiples plataformas:

CRM:
- Salesforce
- HubSpot
- Pipedrive
- Zoho CRM

Email Marketing:
- Mailchimp
- SendGrid
- Klaviyo
- ActiveCampaign

Ads:
- Google Ads
- Facebook/Meta Ads
- LinkedIn Ads
- Twitter Ads

Analytics:
- Google Analytics
- Mixpanel
- Amplitude
- Segment

Social Media:
- Hootsuite
- Buffer
- Sprout Social

E-commerce:
- Shopify
- WooCommerce
- Magento

Webhooks y API:
- REST API disponible
- Webhooks para eventos
- Zapier integration`,
    category: 'faq',
    tags: ['integración', 'herramientas', 'api', 'conexión'],
    priority: 75
  },
  {
    id: 'faq-data-security',
    title: '¿Cómo protege NADAKKI mis datos?',
    content: `NADAKKI implementa múltiples capas de seguridad:

Encriptación:
- Datos en tránsito: TLS 1.3
- Datos en reposo: AES-256
- Claves rotadas regularmente

Acceso:
- Autenticación multi-factor (MFA)
- Role-based access control (RBAC)
- Audit logs completos
- Session management

Infraestructura:
- Hosting en providers certificados (AWS/GCP)
- SOC 2 Type II compliant
- GDPR compliant
- ISO 27001

Privacidad:
- No vendemos datos
- Data Processing Agreement disponible
- Derecho al olvido implementado
- Data residency options

Backups:
- Backups diarios automáticos
- Retención de 30 días
- Disaster recovery plan`,
    category: 'faq',
    tags: ['seguridad', 'datos', 'privacidad', 'gdpr'],
    priority: 80
  },

  // ==================== MÓDULOS DEL DASHBOARD ====================
  {
    id: 'module-multi-tenant',
    title: 'Módulo Multi-Tenant',
    content: `El módulo Multi-Tenant permite gestionar múltiples organizaciones:

Características:
- Cada tenant tiene datos aislados
- Configuración independiente por tenant
- Branding personalizado (white-label)
- Usuarios y permisos por tenant

Crear un nuevo tenant:
1. Ve a Sistema → Multi-Tenant
2. Click "Crear Tenant"
3. Configura nombre, dominio, logo
4. Define plan y límites
5. Invita usuarios iniciales

Gestión de tenants:
- Dashboard por tenant
- Métricas de uso
- Billing por tenant
- Support ticketing

Casos de uso:
- Agencias gestionando múltiples clientes
- Franquicias con unidades independientes
- Grupos empresariales con subsidiarias
- SaaS white-label para partners`,
    category: 'module',
    tags: ['multi-tenant', 'organizaciones', 'white-label'],
    priority: 85
  },
  {
    id: 'module-configuration',
    title: 'Módulo de Configuración',
    content: `El módulo de Configuración permite personalizar el sistema:

General:
- Nombre de la organización
- Logo y branding
- Idioma y timezone
- Notificaciones

Workflows:
- Activar/desactivar workflows
- Configurar defaults
- Programar ejecuciones
- Establecer límites

Integraciones:
- Conectar CRM
- Configurar email provider
- APIs de terceros
- Webhooks

Usuarios:
- Gestión de usuarios
- Roles y permisos
- Equipos
- Invitaciones

Billing:
- Plan actual
- Uso del mes
- Facturas
- Método de pago

API:
- API keys
- Rate limits
- Documentación
- Testing sandbox`,
    category: 'module',
    tags: ['configuración', 'settings', 'personalización'],
    priority: 80
  },

  // ==================== MARKETING ESPECÍFICO ====================
  {
    id: 'marketing-best-practices',
    title: 'Mejores prácticas de Marketing con NADAKKI',
    content: `Guía de mejores prácticas para maximizar resultados:

1. Empieza con Campaign Optimization
   - Es el workflow más completo
   - Da una visión holística de tu campaña
   - Usa los insights para workflows específicos

2. Combina workflows complementarios
   - Campaign Optimization + Content Performance
   - Customer Acquisition + Email Automation
   - A/B Testing + Social Media Intelligence

3. Ejecuta regularmente
   - Semanalmente: Content, Social, Email
   - Mensualmente: Campaign, Attribution, Competitive
   - Trimestralmente: Lifecycle, Influencer

4. Usa el feedback loop
   - Implementa recomendaciones
   - Mide resultados
   - Re-ejecuta para comparar
   - Ajusta estrategia

5. Aprovecha los datos
   - Exporta insights a tu BI
   - Comparte con stakeholders
   - Documenta aprendizajes

6. Itera y mejora
   - No todas las recomendaciones aplican
   - Prioriza por impacto y esfuerzo
   - Mide todo lo que implementes`,
    category: 'tutorial',
    tags: ['mejores', 'prácticas', 'tips', 'estrategia'],
    priority: 85
  }
];

class KnowledgeBase {
  search(query: string, limit: number = 5): SystemDocument[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    const scored = documents.map(doc => {
      let score = 0;

      // Title exact match
      if (doc.title.toLowerCase().includes(queryLower)) {
        score += 100;
      }

      // Title word match
      queryWords.forEach(word => {
        if (doc.title.toLowerCase().includes(word)) {
          score += 20;
        }
      });

      // Content word match
      queryWords.forEach(word => {
        const matches = (doc.content.toLowerCase().match(new RegExp(word, 'g')) || []).length;
        score += matches * 3;
      });

      // Tag match
      doc.tags.forEach(tag => {
        if (queryLower.includes(tag) || tag.includes(queryLower.split(' ')[0])) {
          score += 25;
        }
        queryWords.forEach(word => {
          if (tag.includes(word)) {
            score += 10;
          }
        });
      });

      // Priority bonus
      score += doc.priority / 10;

      return { doc, score };
    });

    return scored
      .filter(item => item.score > 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.doc);
  }

  getDocument(id: string): SystemDocument | undefined {
    return documents.find(doc => doc.id === id);
  }

  getAllWorkflows(): SystemDocument[] {
    return documents.filter(doc => doc.category === 'workflow');
  }

  getAllFaqs(): SystemDocument[] {
    return documents.filter(doc => doc.category === 'faq');
  }

  getAllTutorials(): SystemDocument[] {
    return documents.filter(doc => doc.category === 'tutorial');
  }

  getByCategory(category: SystemDocument['category']): SystemDocument[] {
    return documents.filter(doc => doc.category === category);
  }
}

export const knowledgeBase = new KnowledgeBase();