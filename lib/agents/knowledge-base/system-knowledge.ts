// lib/agents/knowledge-base/system-knowledge.ts

export interface SystemDocument {
  id: string;
  title: string;
  content: string;
  category: 'workflow' | 'agent' | 'core' | 'feature' | 'faq' | 'tutorial' | 'module';
  tags: string[];
  priority: number;
}

export class SystemKnowledgeBase {
  private documents: SystemDocument[] = [];

  constructor() {
    this.loadKnowledge();
  }

  private loadKnowledge() {
    this.documents = [
      // ============================================
      // SISTEMA GENERAL
      // ============================================
      {
        id: 'system-overview',
        title: 'NADAKKI AI Suite - Visión General',
        content: `NADAKKI AI Suite es una plataforma enterprise de marketing automation con IA.

**Estadísticas del Sistema:**
- 225 agentes de IA especializados
- 20 cores funcionales
- 10 workflows de marketing automatizados
- Arquitectura multi-tenant

**Tecnología:**
- Backend: Python/FastAPI en Render
- Frontend: Next.js en Vercel
- Base de datos: SQLite/PostgreSQL

**URL del Backend:** https://nadakki-ai-suite.onrender.com
**Versión actual:** 4.0.1`,
        category: 'feature',
        tags: ['sistema', 'nadakki', 'overview', 'general', 'plataforma'],
        priority: 10
      },

      // ============================================
      // WORKFLOWS
      // ============================================
      {
        id: 'workflow-campaign-optimization',
        title: 'Campaign Optimization Workflow',
        content: `**Campaign Optimization** es un workflow CORE con 5 agentes de IA.

**Propósito:** Optimizar campañas de marketing para maximizar ROI.

**Agentes en secuencia:**
1. **AudienceAnalyzerAI** - Segmenta audiencias usando ML clustering y análisis predictivo
   - Inputs: Descripción de audiencia, datos históricos
   - Outputs: Segmentos priorizados, buyer personas, scores de afinidad

2. **BudgetOptimizerAI** - Distribuye presupuesto óptimamente
   - Tecnología: Optimización convexa, Simulación Monte Carlo
   - Outputs: Distribución por canal, proyecciones de rendimiento

3. **ContentGeneratorAI** - Genera copies y creativos
   - Tecnología: GPT-4, análisis de sentimiento
   - Outputs: Headlines, CTAs, variantes A/B

4. **ROIPredictorAI** - Predice retorno de inversión
   - Tecnología: Regresión avanzada, series temporales
   - Outputs: ROI proyectado, intervalos de confianza, escenarios

5. **RecommendationEngineAI** - Sintetiza recomendaciones
   - Outputs: Plan de acción priorizado, quick wins, timeline

**Cómo usar:**
1. Ve a Workflows → Campaign Optimization
2. Configura nombre, objetivo, canal, presupuesto
3. Describe tu audiencia objetivo (opcional)
4. Haz clic en "Ejecutar Workflow"
5. Espera 2-4 segundos
6. Revisa resultados y recomendaciones

**Casos de uso:**
- Lanzamiento de nuevas campañas
- Optimización de campañas con bajo rendimiento
- Redistribución de presupuesto
- Predicción de ROI antes de invertir`,
        category: 'workflow',
        tags: ['campaign', 'optimization', 'roi', 'presupuesto', 'marketing', 'core', 'audiencia'],
        priority: 9
      },
      {
        id: 'workflow-customer-acquisition',
        title: 'Customer Acquisition Intelligence Workflow',
        content: `**Customer Acquisition Intelligence** es un workflow CORE con 7 agentes.

**Propósito:** Adquirir clientes de alto valor eficientemente.

**Agentes en secuencia:**
1. **LeadScorerAI** - Scoring predictivo de leads (0-100)
   - Tecnología: Gradient Boosting, feature engineering automático
   
2. **BehaviorAnalyzerAI** - Análisis de patrones de comportamiento
   - Detecta señales de intención de compra
   
3. **ChannelOptimizerAI** - Selección óptima de canal por lead
   - Tecnología: Multi-armed bandit, optimización de timing
   
4. **MessagePersonalizerAI** - Mensajes hiperpersonalizados
   - Tecnología: NLG avanzado
   
5. **FunnelAnalyzerAI** - Análisis de funnel de conversión
   - Detecta cuellos de botella
   
6. **OfferOptimizerAI** - Optimización de ofertas y pricing
   
7. **ConversionPredictorAI** - Predicción de conversión
   - Tecnología: Survival analysis

**Outputs principales:**
- Lista de leads rankeados por valor potencial
- Estrategia de contacto multicanal
- Mensajes personalizados listos para usar
- Análisis del funnel con recomendaciones
- Predicción de conversiones`,
        category: 'workflow',
        tags: ['customer', 'acquisition', 'leads', 'scoring', 'conversion', 'funnel', 'core'],
        priority: 9
      },
      {
        id: 'workflow-customer-lifecycle',
        title: 'Customer Lifecycle Revenue Workflow',
        content: `**Customer Lifecycle Revenue** es un workflow CORE con 6 agentes.

**Propósito:** Maximizar CLV (Customer Lifetime Value) en cada etapa.

**Agentes:**
1. **LifecycleMapperAI** - Identifica etapa del cliente (onboarding, activo, en riesgo)
2. **ChurnPredictorAI** - Predice riesgo de abandono con early warning
3. **ExpansionIdentifierAI** - Identifica oportunidades de upsell/cross-sell
4. **EngagementOptimizerAI** - Optimiza frecuencia y contenido de interacciones
5. **ValueCalculatorAI** - Calcula CLV actual y proyectado
6. **ActionRecommenderAI** - Genera acciones priorizadas por impacto

**Casos de uso:**
- Optimización de onboarding
- Prevención proactiva de churn
- Identificación de oportunidades de expansión
- Maximización de valor del cliente`,
        category: 'workflow',
        tags: ['lifecycle', 'revenue', 'clv', 'churn', 'retention', 'upsell', 'core'],
        priority: 9
      },
      {
        id: 'workflow-content-performance',
        title: 'Content Performance Engine Workflow',
        content: `**Content Performance Engine** es un workflow EXECUTION con 5 agentes.

**Propósito:** Analizar y optimizar estrategia de contenido.

**Agentes:**
1. **ContentAnalyzerAI** - Analiza métricas de rendimiento
2. **SEOOptimizerAI** - Optimización para buscadores con NLP
3. **EngagementPredictorAI** - Predice engagement y viralidad
4. **GapIdentifierAI** - Identifica gaps de contenido vs competencia
5. **CalendarOptimizerAI** - Optimiza calendario editorial

**Outputs:**
- Auditoría de contenido existente
- Recomendaciones SEO
- Gaps de contenido identificados
- Calendario editorial optimizado`,
        category: 'workflow',
        tags: ['content', 'seo', 'engagement', 'calendario', 'execution'],
        priority: 8
      },
      {
        id: 'workflow-social-intelligence',
        title: 'Social Media Intelligence Workflow',
        content: `**Social Media Intelligence** es un workflow EXECUTION con 4 agentes.

**Propósito:** Inteligencia de redes sociales.

**Agentes:**
1. **SocialListenerAI** - Escucha social en tiempo real multi-plataforma
2. **SentimentAnalyzerAI** - Análisis de sentimiento con deep learning
3. **TrendDetectorAI** - Detecta tendencias emergentes
4. **EngagementStrategistAI** - Desarrolla estrategias de engagement

**Outputs:**
- Reporte de menciones de marca
- Análisis de sentimiento
- Tendencias detectadas
- Estrategia de engagement`,
        category: 'workflow',
        tags: ['social', 'media', 'redes', 'sentimiento', 'tendencias', 'execution'],
        priority: 8
      },
      {
        id: 'workflow-email-automation',
        title: 'Email Automation Master Workflow',
        content: `**Email Automation Master** es un workflow EXECUTION con 4 agentes.

**Propósito:** Automatización completa de email marketing.

**Agentes:**
1. **ListSegmenterAI** - Segmentación avanzada con RFM analysis
2. **SubjectOptimizerAI** - Genera subject lines optimizados para open rate
3. **ContentPersonalizerAI** - Personaliza emails dinámicamente
4. **SendOptimizerAI** - Optimiza timing de envío por usuario

**Outputs:**
- Listas segmentadas
- Subject lines con predicción de apertura
- Emails personalizados por segmento
- Calendario de envío optimizado`,
        category: 'workflow',
        tags: ['email', 'automation', 'marketing', 'segmentation', 'execution'],
        priority: 8
      },
      {
        id: 'workflow-attribution',
        title: 'Multi-Channel Attribution Workflow',
        content: `**Multi-Channel Attribution** es un workflow INTELLIGENCE con 4 agentes.

**Propósito:** Atribución precisa para entender contribución de cada canal.

**Agentes:**
1. **JourneyMapperAI** - Reconstruye customer journeys completos
2. **AttributionModelerAI** - Aplica modelos (Shapley, Markov, data-driven)
3. **IncrementalityAnalyzerAI** - Mide impacto incremental real
4. **BudgetAllocatorAI** - Optimiza asignación de presupuesto

**Outputs:**
- Customer journeys mapeados
- Atribución por modelo
- Reporte de incrementalidad
- Recomendación de budget`,
        category: 'workflow',
        tags: ['attribution', 'multichannel', 'journey', 'budget', 'intelligence'],
        priority: 8
      },
      {
        id: 'workflow-competitive',
        title: 'Competitive Intelligence Hub Workflow',
        content: `**Competitive Intelligence Hub** es un workflow INTELLIGENCE con 3 agentes.

**Propósito:** Inteligencia competitiva automatizada.

**Agentes:**
1. **CompetitorTrackerAI** - Monitorea actividad de competidores
2. **StrategyAnalyzerAI** - Analiza y deduce estrategias
3. **OpportunityFinderAI** - Identifica gaps y oportunidades

**Outputs:**
- Overview de competidores
- Análisis de estrategias
- Oportunidades de mercado`,
        category: 'workflow',
        tags: ['competitive', 'intelligence', 'competencia', 'mercado', 'intelligence'],
        priority: 8
      },
      {
        id: 'workflow-ab-testing',
        title: 'A/B Testing & Experimentation Workflow',
        content: `**A/B Testing & Experimentation** es un workflow INTELLIGENCE con 3 agentes.

**Propósito:** Experimentación científica para optimización.

**Agentes:**
1. **ExperimentDesignerAI** - Diseña experimentos estadísticamente válidos
2. **ResultsAnalyzerAI** - Análisis con significancia estadística
3. **InsightGeneratorAI** - Genera insights accionables

**Outputs:**
- Diseño de experimento
- Análisis estadístico
- Insights y próximos pasos`,
        category: 'workflow',
        tags: ['ab', 'testing', 'experiment', 'estadistica', 'intelligence'],
        priority: 8
      },
      {
        id: 'workflow-influencer',
        title: 'Influencer & Partnership Engine Workflow',
        content: `**Influencer & Partnership Engine** es un workflow INTELLIGENCE con 2 agentes.

**Propósito:** Gestión inteligente de influencers.

**Agentes:**
1. **InfluencerFinderAI** - Identifica y evalúa influencers
2. **PartnershipOptimizerAI** - Optimiza términos y mide ROI

**Outputs:**
- Lista de influencers rankeados
- Evaluación de autenticidad
- Términos sugeridos
- Proyección de ROI`,
        category: 'workflow',
        tags: ['influencer', 'partnership', 'roi', 'intelligence'],
        priority: 8
      },

      // ============================================
      // TIERS
      // ============================================
      {
        id: 'tier-explanation',
        title: 'Tiers de Workflows (CORE, EXECUTION, INTELLIGENCE)',
        content: `Los workflows se organizan en 3 tiers:

**🧠 CORE (Alta prioridad)**
- Workflows fundamentales para casos de uso principales
- Mayor número de agentes (5-7)
- Procesamiento más completo
- Workflows: Campaign Optimization, Customer Acquisition, Customer Lifecycle

**⚡ EXECUTION (Operaciones diarias)**
- Workflows para automatizaciones tácticas
- Número medio de agentes (4-5)
- Resultados rápidos
- Workflows: Content Performance, Social Intelligence, Email Automation

**💡 INTELLIGENCE (Análisis estratégico)**
- Workflows de análisis profundo
- Número variable de agentes (2-4)
- Insights estratégicos
- Workflows: Attribution, Competitive Intelligence, A/B Testing, Influencer Engine

**¿Cuál usar?**
- Lanzar campaña → CORE (Campaign Optimization)
- Automatizar emails → EXECUTION (Email Automation)
- Entender qué canal funciona → INTELLIGENCE (Attribution)`,
        category: 'faq',
        tags: ['tier', 'core', 'execution', 'intelligence', 'categoria'],
        priority: 9
      },

      // ============================================
      // CORES FUNCIONALES
      // ============================================
      {
        id: 'core-marketing',
        title: 'Marketing Core',
        content: `**Marketing Core** tiene 35 agentes especializados.

**Capacidades:**
- Gestión de campañas multicanal
- Segmentación de audiencias con ML
- Generación de contenido con IA
- Análisis de rendimiento en tiempo real
- Optimización de presupuesto automática
- A/B testing automatizado
- Email marketing inteligente
- Social media management

**Submódulos:** campaigns, content, audiences, analytics, social, email

**Acceso:** /marketing`,
        category: 'core',
        tags: ['marketing', 'core', 'agentes', 'campañas'],
        priority: 8
      },
      {
        id: 'core-legal',
        title: 'Legal Core',
        content: `**Legal Core** tiene 32 agentes.

**Capacidades:**
- Análisis de contratos con NLP
- Detección de cláusulas de riesgo
- Generación de documentos legales
- Compliance automatizado
- Due diligence asistido por IA

**Acceso:** /legal`,
        category: 'core',
        tags: ['legal', 'contratos', 'compliance', 'core'],
        priority: 7
      },
      {
        id: 'core-overview',
        title: 'Cores Funcionales - Resumen',
        content: `NADAKKI tiene 20 cores funcionales con 225 agentes:

| Core | Agentes | Descripción |
|------|---------|-------------|
| Marketing | 35 | Automatización de marketing |
| Legal | 32 | Gestión legal y contratos |
| Logística | 23 | Cadena de suministro |
| Contabilidad | 22 | Automatización contable |
| Presupuesto | 13 | Control presupuestario |
| Originación | 10 | Evaluación de crédito |
| RRHH | 10 | Recursos humanos |
| Ventas CRM | 9 | CRM inteligente |
| Investigación | 9 | Research automation |
| Educación | 9 | Learning management |
| RegTech | 8 | Cumplimiento regulatorio |
| Compliance | 5 | Cumplimiento normativo |
| Experiencia | 5 | Customer experience |
| Vigilancia | 5 | Detección de fraude |
| Fortaleza | 5 | Continuidad del negocio |
| Recuperación | 5 | Cobranzas inteligentes |
| Inteligencia | 5 | Business intelligence |
| Operacional | 5 | Workflow optimization |
| Decisión | 5 | Motor de decisiones ML |
| Orchestration | 5 | Workflow engine |`,
        category: 'core',
        tags: ['cores', 'agentes', 'resumen', 'overview'],
        priority: 9
      },

      // ============================================
      // TUTORIALES / HOW-TO
      // ============================================
      {
        id: 'tutorial-execute-workflow',
        title: 'Cómo ejecutar un workflow',
        content: `**Guía paso a paso para ejecutar un workflow:**

1. **Navegar al workflow**
   - Ve al menú lateral → WORKFLOWS
   - Selecciona el workflow deseado

2. **Configurar parámetros**
   - **Nombre:** Identificador de la ejecución
   - **Objetivo:** Qué quieres lograr (leads, conversiones, etc.)
   - **Canal:** Dónde se aplicará (email, social, ads)
   - **Presupuesto:** Inversión disponible en USD
   - **Audiencia:** (Opcional) Descripción del target

3. **Ejecutar**
   - Clic en el botón morado "Ejecutar Workflow"
   - Verás una barra de progreso
   - Tiempo típico: 2-6 segundos

4. **Revisar resultados**
   - Resumen de éxito/error
   - Pasos ejecutados con duración
   - Output detallado (expandible)
   - Recomendaciones de acción

5. **Tomar acción**
   - Crear campaña basada en resultados
   - Exportar a PDF
   - Ejecutar workflow relacionado`,
        category: 'tutorial',
        tags: ['tutorial', 'ejecutar', 'workflow', 'guia', 'paso a paso'],
        priority: 9
      },
      {
        id: 'tutorial-navigate',
        title: 'Cómo navegar el dashboard',
        content: `**Navegación del Dashboard NADAKKI:**

**Menú lateral (Sidebar):**
- SISTEMA: Dashboard Principal, Multi-Tenant, Configuración
- WORKFLOWS: Los 10 workflows de marketing
- MARKETING: Campañas, contenido, audiencias
- ANALYTICS: Métricas, reportes, ROI
- FINANZAS: Originación, Decisión, Recuperación
- ADMIN: Panel, Agentes, Logs

**Navegación superior:**
- ⬅️ Botón atrás: Volver a página anterior
- ➡️ Botón adelante: Ir hacia adelante
- 🏠 Botón home: Ir al dashboard principal
- Breadcrumbs: Muestra la ruta actual

**Tips:**
- Haz clic en cualquier card para ver detalles
- Los módulos con candado requieren plan superior
- El indicador verde muestra estado activo`,
        category: 'tutorial',
        tags: ['navegacion', 'dashboard', 'menu', 'sidebar'],
        priority: 7
      },

      // ============================================
      // FAQs
      // ============================================
      {
        id: 'faq-what-is-workflow',
        title: '¿Qué es un workflow?',
        content: `Un **workflow** es una secuencia automatizada de agentes de IA que trabajan juntos.

**Características:**
- Múltiples agentes ejecutan en secuencia
- Cada agente recibe inputs del anterior
- El resultado es consolidado automáticamente
- Tiempo de ejecución: 2-6 segundos

**Ejemplo:** Campaign Optimization usa 5 agentes:
1. AudienceAnalyzerAI analiza la audiencia
2. BudgetOptimizerAI optimiza presupuesto
3. ContentGeneratorAI genera contenido
4. ROIPredictorAI predice ROI
5. RecommendationEngineAI da recomendaciones

Todo automático, tú solo configuras y ejecutas.`,
        category: 'faq',
        tags: ['workflow', 'que es', 'definicion', 'agentes'],
        priority: 9
      },
      {
        id: 'faq-what-is-agent',
        title: '¿Qué es un agente de IA?',
        content: `Un **agente de IA** es un componente especializado que realiza una tarea específica.

**Características:**
- Usa machine learning o inteligencia artificial
- Recibe inputs específicos
- Procesa datos con modelos ML/NLP
- Genera outputs estructurados
- Puede encadenarse con otros agentes

**Tipos de agentes:**
- Analizadores (procesan datos)
- Predictores (hacen predicciones)
- Generadores (crean contenido)
- Optimizadores (mejoran métricas)
- Recomendadores (sugieren acciones)

NADAKKI tiene 225 agentes distribuidos en 20 cores.`,
        category: 'faq',
        tags: ['agente', 'ia', 'que es', 'definicion', 'machine learning'],
        priority: 9
      },
      {
        id: 'faq-workflow-time',
        title: '¿Cuánto tiempo tarda un workflow?',
        content: `**Tiempos de ejecución por workflow:**

| Workflow | Agentes | Tiempo |
|----------|---------|--------|
| Campaign Optimization | 5 | 2-4 seg |
| Customer Acquisition | 7 | 4-6 seg |
| Customer Lifecycle | 6 | 3-5 seg |
| Content Performance | 5 | 2-4 seg |
| Social Intelligence | 4 | 2-3 seg |
| Email Automation | 4 | 2-3 seg |
| Attribution | 4 | 3-4 seg |
| Competitive Intel | 3 | 2-3 seg |
| A/B Testing | 3 | 2-3 seg |
| Influencer Engine | 2 | 2-3 seg |

Los tiempos pueden variar según la carga del servidor.`,
        category: 'faq',
        tags: ['tiempo', 'duracion', 'workflow', 'segundos'],
        priority: 7
      },
      {
        id: 'faq-after-workflow',
        title: '¿Qué puedo hacer después de ejecutar un workflow?',
        content: `**Acciones disponibles después de ejecutar:**

1. **Revisar resultados detallados**
   - Expande "Ver Output" para JSON completo
   - Revisa cada paso y su duración

2. **Crear campaña**
   - Usa las recomendaciones para configurar
   - Ve a Marketing → Campaigns → Nueva

3. **Exportar reporte**
   - Descarga el análisis en PDF
   - Comparte con tu equipo

4. **Ejecutar workflow relacionado**
   - A/B Testing para probar variantes
   - Email Automation para nurturing

5. **Programar ejecución recurrente**
   - Configura en Scheduler
   - Ejecuta diaria o semanalmente

6. **Ver en Analytics**
   - Monitorea resultados de las acciones
   - Compara con predicciones`,
        category: 'faq',
        tags: ['despues', 'workflow', 'acciones', 'siguiente'],
        priority: 8
      }
    ];
  }

  async search(query: string, limit: number = 5): Promise<SystemDocument[]> {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    const scored = this.documents.map(doc => {
      let score = 0;

      // Coincidencia en título (peso alto)
      if (doc.title.toLowerCase().includes(queryLower)) {
        score += 50;
      }
      queryWords.forEach(word => {
        if (doc.title.toLowerCase().includes(word)) score += 10;
      });

      // Coincidencia en contenido
      queryWords.forEach(word => {
        const matches = (doc.content.toLowerCase().match(new RegExp(word, 'g')) || []).length;
        score += matches * 2;
      });

      // Coincidencia en tags (peso medio)
      doc.tags.forEach(tag => {
        if (queryLower.includes(tag) || tag.includes(queryLower)) {
          score += 15;
        }
        queryWords.forEach(word => {
          if (tag.includes(word)) score += 5;
        });
      });

      // Bonus por prioridad del documento
      score += doc.priority;

      return { doc, score };
    });

    return scored
      .filter(item => item.score > 5)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.doc);
  }

  getDocument(id: string): SystemDocument | null {
    return this.documents.find(doc => doc.id === id) || null;
  }

  getAllWorkflows(): SystemDocument[] {
    return this.documents.filter(doc => doc.category === 'workflow');
  }

  getAllFaqs(): SystemDocument[] {
    return this.documents.filter(doc => doc.category === 'faq');
  }
}

export const knowledgeBase = new SystemKnowledgeBase();