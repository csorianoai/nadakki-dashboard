// lib/agents/routing/router.ts

import { intentClassifier, ClassificationResult } from './intent-classifier';
import { knowledgeBase, SystemDocument } from '../knowledge-base/system-knowledge';
import { llmClient } from '../llm/llm-client';

export interface AgentResponse {
  content: string;
  source: 'system' | 'llm' | 'hybrid' | 'greeting';
  confidence: number;
  intent: string;
  references?: SystemDocument[];
  suggestions: string[];
}

export class IntelligentRouter {
  async route(query: string, context?: any): Promise<AgentResponse> {
    // 1. Clasificar intención
    const classification = intentClassifier.classify(query);
    console.log('🎯 Intent:', classification.intent, '| shouldUseLLM:', classification.shouldUseLLM);
    
    // 2. Saludo
    if (classification.intent === 'greeting') {
      return this.handleGreeting(context);
    }

    // 3. Si el clasificador dice NO usar LLM → usar base local SIN verificar relevancia
    if (!classification.shouldUseLLM) {
      console.log('📚 Usando base de conocimiento local...');
      const knowledgeResults = await knowledgeBase.search(query);
      
      if (knowledgeResults.length > 0) {
        console.log('✅ Encontrado:', knowledgeResults[0].title);
        return this.buildSystemResponse(knowledgeResults, classification);
      } else {
        console.log('⚠️ No encontrado en base local, usando LLM...');
      }
    }

    // 4. Usar LLM
    console.log('🤖 Usando LLM...');
    return this.buildLLMResponse(query, classification);
  }

  private handleGreeting(context?: any): AgentResponse {
    const tenantName = context?.tenant_name || 'NADAKKI Demo';
    return {
      content: `¡Hola! 👋 Soy el **NADAKKI AI Copilot**.

Estás en **${tenantName}**. Puedo ayudarte con:

- **Workflows** - Los 10 workflows de marketing
- **Agentes** - Agentes de IA especializados
- **Tutoriales** - Guías paso a paso
- **Preguntas generales** - Marketing y estrategia

¿En qué puedo ayudarte?`,
      source: 'greeting',
      confidence: 1,
      intent: 'greeting',
      suggestions: [
        '¿Cómo funciona Campaign Optimization?',
        'Explícame los workflows',
        '¿Cómo ejecuto un workflow?'
      ]
    };
  }

  private buildSystemResponse(
    results: SystemDocument[],
    classification: ClassificationResult
  ): AgentResponse {
    const primary = results[0];
    
    let content = `**${primary.title}**\n\n${primary.content}`;
    
    if (results.length > 1) {
      content += `\n\n---\n**Relacionado:**`;
      results.slice(1, 3).forEach(doc => {
        content += `\n• ${doc.title}`;
      });
    }

    return {
      content,
      source: 'system',
      confidence: 0.95,
      intent: classification.intent,
      references: results,
      suggestions: [
        '¿Cómo ejecuto este workflow?',
        '¿Qué otros workflows hay?',
        '¿Qué agentes tiene?'
      ]
    };
  }

  private async buildLLMResponse(
    query: string,
    classification: ClassificationResult
  ): Promise<AgentResponse> {
    try {
      const llmResponse = await llmClient.generate({
        prompt: query,
        maxTokens: 1024,
        temperature: 0.7
      });

      return {
        content: llmResponse.content,
        source: 'llm',
        confidence: 0.85,
        intent: classification.intent,
        suggestions: [
          '¿Cómo aplico esto en NADAKKI?',
          'Explícame los workflows',
          '¿Qué más puedo hacer?'
        ]
      };
    } catch (error) {
      console.error('❌ LLM Error:', error);
      return {
        content: 'No pude procesar tu pregunta. ¿Podrías reformularla?',
        source: 'system',
        confidence: 0.3,
        intent: 'unknown',
        suggestions: ['Explícame los workflows', '¿Qué puedo hacer?']
      };
    }
  }
}

export const router = new IntelligentRouter();