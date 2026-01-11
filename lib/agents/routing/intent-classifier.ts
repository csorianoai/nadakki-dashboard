// lib/agents/routing/intent-classifier.ts

export type IntentType =
  | 'system-knowledge'
  | 'workflow-specific'
  | 'tutorial'
  | 'troubleshooting'
  | 'general-knowledge'
  | 'creative'
  | 'analytical'
  | 'greeting'
  | 'unknown';

export interface ClassificationResult {
  intent: IntentType;
  confidence: number;
  entities: {
    workflowId?: string;
    coreId?: string;
    action?: string;
  };
  shouldUseLLM: boolean;
}

export class IntentClassifier {
  // Keywords que SIEMPRE deben usar la base de conocimiento local
  private systemKeywords = [
    'nadakki', 'workflow', 'workflows', 'agente', 'agentes', 
    'dashboard', 'core', 'cores', 'módulo', 'modulo', 
    'tier', 'execution', 'intelligence', 'ejecutar',
    'cómo funciona', 'como funciona', 'qué es', 'que es',
    'explícame', 'explicame', 'cuántos', 'cuantos'
  ];

  // Workflows específicos - SIEMPRE usar base local
  private workflowKeywords: Record<string, string[]> = {
    'campaign-optimization': [
      'campaign optimization', 'campaign-optimization', 
      'optimización de campaña', 'optimizacion de campaña',
      'optimizar campaña', 'optimizar campañas'
    ],
    'customer-acquisition-intelligence': [
      'customer acquisition', 'adquisición de clientes',
      'acquisition intelligence', 'lead scoring'
    ],
    'customer-lifecycle-revenue': [
      'lifecycle', 'ciclo de vida', 'clv', 'churn', 
      'retención', 'retencion'
    ],
    'content-performance-engine': [
      'content performance', 'rendimiento de contenido'
    ],
    'social-media-intelligence': [
      'social media intelligence', 'redes sociales', 'social intelligence'
    ],
    'email-automation-master': [
      'email automation', 'automatización de email', 'email marketing nadakki'
    ],
    'multi-channel-attribution': [
      'attribution', 'atribución', 'multicanal'
    ],
    'competitive-intelligence-hub': [
      'competitive intelligence', 'competencia', 'competidores'
    ],
    'ab-testing-experimentation': [
      'ab test', 'a/b test', 'experimentación', 'experimento'
    ],
    'influencer-partnership-engine': [
      'influencer', 'partnership engine'
    ]
  };

  private greetingKeywords = [
    'hola', 'hello', 'hi', 'buenos días', 'buenas tardes',
    'buenas noches', 'hey', 'qué tal', 'saludos'
  ];

  // Keywords que indican necesidad de LLM (creatividad, conocimiento externo)
  private llmRequiredKeywords = [
    'dame ideas', 'genera', 'crea contenido', 'escribe un', 
    'redacta', 'mejores prácticas', 'tendencias',
    'recomendaciones de marketing', 'estrategias de',
    'cómo puedo mejorar', 'tips para', 'consejos para',
    'ejemplo de copy', 'subject line', 'black friday',
    'navidad', 'campaña de'
  ];

  classify(query: string): ClassificationResult {
    const queryLower = query.toLowerCase().trim();

    // 1. Detectar saludo
    if (this.isGreeting(queryLower)) {
      return {
        intent: 'greeting',
        confidence: 0.95,
        entities: {},
        shouldUseLLM: false
      };
    }

    // 2. Detectar workflow específico - SIEMPRE usar base local
    const detectedWorkflow = this.detectWorkflow(queryLower);
    if (detectedWorkflow) {
      return {
        intent: 'workflow-specific',
        confidence: 0.95,
        entities: { workflowId: detectedWorkflow },
        shouldUseLLM: false  // NUNCA usar LLM para workflows
      };
    }

    // 3. Detectar preguntas sobre el sistema NADAKKI
    if (this.isSystemQuestion(queryLower)) {
      return {
        intent: 'system-knowledge',
        confidence: 0.9,
        entities: {},
        shouldUseLLM: false  // NUNCA usar LLM para preguntas del sistema
      };
    }

    // 4. Detectar necesidad de LLM (creatividad, conocimiento externo)
    if (this.requiresLLM(queryLower)) {
      return {
        intent: 'creative',
        confidence: 0.85,
        entities: {},
        shouldUseLLM: true
      };
    }

    // 5. Por defecto: conocimiento general (usar LLM)
    return {
      intent: 'general-knowledge',
      confidence: 0.6,
      entities: {},
      shouldUseLLM: true
    };
  }

  private isGreeting(query: string): boolean {
    return this.greetingKeywords.some(kw => query.includes(kw)) && query.length < 30;
  }

  private detectWorkflow(query: string): string | null {
    for (const [workflowId, keywords] of Object.entries(this.workflowKeywords)) {
      if (keywords.some(kw => query.includes(kw))) {
        return workflowId;
      }
    }
    return null;
  }

  private isSystemQuestion(query: string): boolean {
    // Si contiene keywords del sistema
    if (this.systemKeywords.some(kw => query.includes(kw))) {
      return true;
    }
    
    // Patrones específicos de preguntas sobre el sistema
    const systemPatterns = [
      /cómo funciona/i,
      /como funciona/i,
      /qué es un/i,
      /que es un/i,
      /cuántos agentes/i,
      /cuantos agentes/i,
      /explícame el/i,
      /explicame el/i,
      /qué workflows/i,
      /que workflows/i,
      /cómo ejecuto/i,
      /como ejecuto/i,
      /qué puedo hacer/i
    ];
    
    return systemPatterns.some(pattern => pattern.test(query));
  }

  private requiresLLM(query: string): boolean {
    return this.llmRequiredKeywords.some(kw => query.includes(kw));
  }
}

export const intentClassifier = new IntentClassifier();