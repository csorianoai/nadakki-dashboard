// lib/agents/routing/router.ts

import { intentClassifier, ClassificationResult } from './intent-classifier';
import { knowledgeBase, SystemDocument } from '../knowledge-base/system-knowledge';
import type { ModuleTag } from '../knowledge-base/system-knowledge';
import { llmClient } from '../llm/llm-client';

export interface AgentResponse {
  content: string;
  source: 'system' | 'llm' | 'hybrid' | 'greeting';
  confidence: number;
  intent: string;
  references?: SystemDocument[];
  suggestions: string[];
}

/** Per-module contextual suggestions */
const MODULE_SUGGESTIONS: Record<string, string[]> = {
  legal: [
    '¿Cómo creo un expediente?',
    '¿Cuáles son los plazos procesales?',
    '¿Qué leyes RD tiene el sistema?',
  ],
  credit: [
    '¿Cómo funciona la mesa de decisiones?',
    '¿Qué KPIs tiene Credit Hub?',
    '¿Cómo se procesa una solicitud?',
  ],
  marketing: [
    '¿Cómo funciona Campaign Optimization?',
    'Explícame los workflows',
    '¿Cómo ejecuto un workflow?',
  ],
  sic: [
    '¿Cómo analizo un statement?',
    '¿Qué tiers de competidores hay?',
    '¿Cómo genero un reporte de inteligencia?',
  ],
  general: [
    '¿Qué módulos tiene NADAKKI?',
    'Explícame la plataforma',
    '¿Qué puedo hacer aquí?',
  ],
};

/** Per-module greeting capabilities */
const MODULE_GREETING_CAPS: Record<string, string[]> = {
  legal: [
    '**Expedientes** — gestión de casos y audiencias',
    '**Plazos procesales** — cálculo y alertas',
    '**Compliance** — contratos y leyes RD',
    '**Anti-alucinación** — toda respuesta legal requiere validación',
  ],
  credit: [
    '**Solicitudes** — flujo dealer-bank',
    '**Mesa de decisiones** — scoring y preaprobación',
    '**KPIs** — métricas de rendimiento',
  ],
  marketing: [
    '**Workflows** — 10 workflows de automatización',
    '**Agentes** — 46 agentes de IA especializados',
    '**Tutoriales** — guías paso a paso',
  ],
  sic: [
    '**Statements** — análisis financiero',
    '**Tiers** — investigación competitiva T1/T2/T3',
    '**Reportes** — inteligencia de mercado',
  ],
  general: [
    '**Legal** — expedientes, plazos, compliance (31 agentes)',
    '**Credit Hub** — solicitudes, mesa de decisiones',
    '**Marketing** — workflows, campañas (46 agentes)',
    '**SIC** — inteligencia de mercado crediticio',
  ],
};

export class IntelligentRouter {
  async route(query: string, context?: any): Promise<AgentResponse> {
    const currentModule: ModuleTag | undefined = context?.current_module;
    console.log('📍 Module:', currentModule || 'none');

    // 1. Clasificar intención
    const classification = intentClassifier.classify(query);
    console.log('🎯 Intent:', classification.intent, '| shouldUseLLM:', classification.shouldUseLLM);

    // 2. Saludo
    if (classification.intent === 'greeting') {
      return this.handleGreeting(context, currentModule);
    }

    // 3. Si el clasificador dice NO usar LLM → usar base local SIN verificar relevancia
    if (!classification.shouldUseLLM) {
      console.log('📚 Usando base de conocimiento local...');
      const knowledgeResults = knowledgeBase.search(query, 5, currentModule);

      if (knowledgeResults.length > 0) {
        console.log('✅ Encontrado:', knowledgeResults[0].title);
        return this.buildSystemResponse(knowledgeResults, classification, currentModule);
      } else {
        console.log('⚠️ No encontrado en base local, usando LLM...');
      }
    }

    // 4. Usar LLM
    console.log('🤖 Usando LLM...');
    return this.buildLLMResponse(query, classification, currentModule);
  }

  private handleGreeting(context?: any, currentModule?: ModuleTag): AgentResponse {
    const tenantName = context?.tenant_name || '—';
    const mod = currentModule || 'general';
    const caps = (MODULE_GREETING_CAPS[mod] || MODULE_GREETING_CAPS.general)
      .map(c => `- ${c}`)
      .join('\n');
    const suggestions = MODULE_SUGGESTIONS[mod] || MODULE_SUGGESTIONS.general;

    return {
      content: `¡Hola! 👋 Soy **NADA**, tu copiloto de IA.\n\nEstás en **${tenantName}**. Puedo ayudarte con:\n\n${caps}\n\n¿En qué puedo ayudarte?`,
      source: 'greeting',
      confidence: 1,
      intent: 'greeting',
      suggestions,
    };
  }

  private buildSystemResponse(
    results: SystemDocument[],
    classification: ClassificationResult,
    currentModule?: ModuleTag,
  ): AgentResponse {
    const primary = results[0];

    let content = `**${primary.title}**\n\n${primary.content}`;

    if (results.length > 1) {
      content += `\n\n---\n**Relacionado:**`;
      results.slice(1, 3).forEach(doc => {
        content += `\n• ${doc.title}`;
      });
    }

    const mod = currentModule || 'general';
    return {
      content,
      source: 'system',
      confidence: 0.95,
      intent: classification.intent,
      references: results,
      suggestions: MODULE_SUGGESTIONS[mod] || MODULE_SUGGESTIONS.general,
    };
  }

  private async buildLLMResponse(
    query: string,
    classification: ClassificationResult,
    currentModule?: ModuleTag,
  ): Promise<AgentResponse> {
    try {
      // Build module-aware context from KB
      const kbResults = knowledgeBase.search(query, 3, currentModule);
      const kbContext = kbResults.length > 0
        ? kbResults.map(d => `[${d.title}]\n${d.content}`).join('\n\n---\n\n')
        : undefined;

      const llmResponse = await llmClient.generate({
        prompt: query,
        systemPrompt: llmClient.getSystemPrompt(currentModule),
        context: kbContext,
        maxTokens: 1024,
        temperature: 0.7,
      });

      const mod = currentModule || 'general';
      return {
        content: llmResponse.content,
        source: kbResults.length > 0 ? 'hybrid' : 'llm',
        confidence: kbResults.length > 0 ? 0.9 : 0.85,
        intent: classification.intent,
        references: kbResults.length > 0 ? kbResults : undefined,
        suggestions: MODULE_SUGGESTIONS[mod] || MODULE_SUGGESTIONS.general,
      };
    } catch (error) {
      console.error('❌ LLM Error:', error);
      return {
        content: 'No pude procesar tu pregunta. ¿Podrías reformularla?',
        source: 'system',
        confidence: 0.3,
        intent: 'unknown',
        suggestions: MODULE_SUGGESTIONS[currentModule || 'general'] || MODULE_SUGGESTIONS.general,
      };
    }
  }
}

export const router = new IntelligentRouter();