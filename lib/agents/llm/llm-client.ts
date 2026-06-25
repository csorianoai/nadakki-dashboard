// lib/agents/llm/llm-client.ts

export interface LLMResponse {
  content: string;
  provider: string;
  tokensUsed?: number;
}

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

export class LLMClient {
  async generate(request: LLMRequest): Promise<LLMResponse> {
    // Intentar Groq primero (es gratis)
    const groqResponse = await this.callGroq(request);
    if (groqResponse) {
      return groqResponse;
    }

    // Fallback local
    console.log('⚠️ All providers failed, using fallback');
    return this.generateLocalFallback(request);
  }

  private async callGroq(request: LLMRequest): Promise<LLMResponse | null> {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.log('❌ No GROQ_API_KEY found in environment');
      return null;
    }

    console.log('🔑 GROQ_API_KEY found:', apiKey.substring(0, 10) + '...');

    const systemPrompt = request.systemPrompt || this.getDefaultSystemPrompt();
    const fullPrompt = request.context 
      ? `Contexto:\n${request.context}\n\nPregunta: ${request.prompt}`
      : request.prompt;

    try {
      console.log('📡 Calling Groq API...');
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: fullPrompt }
          ],
          max_tokens: request.maxTokens || 1024,
          temperature: request.temperature || 0.7
        })
      });

      console.log('📥 Groq Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Groq API Error:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      console.log('📦 Groq Response Data:', JSON.stringify(data).substring(0, 200));

      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content;
        console.log('✅ Groq Response Content:', content.substring(0, 100) + '...');
        
        return {
          content: content,
          provider: 'Groq (Mixtral)',
          tokensUsed: data.usage?.completion_tokens
        };
      } else {
        console.log('❌ Unexpected response structure:', JSON.stringify(data));
        return null;
      }

    } catch (error) {
      console.error('❌ Groq Error:', error);
      return null;
    }
  }

  private generateLocalFallback(request: LLMRequest): LLMResponse {
    return {
      content: `Entiendo tu pregunta sobre: "${request.prompt.substring(0, 100)}..."

En este momento no puedo conectarme con un modelo de IA externo.

**Puedo ayudarte con información del sistema NADAKKI:**
- Legal: expedientes, plazos, contratos (31 agentes)
- Credit Hub: solicitudes, mesa de decisiones
- Marketing: workflows, campañas (46 agentes)
- SIC: inteligencia de mercado crediticio

¿Te gustaría que te ayude con algo del sistema?`,
      provider: 'local-fallback'
    };
  }

  getSystemPrompt(currentModule?: string): string {
    const moduleContext = currentModule && currentModule !== "general"
      ? `\n\nEl usuario está actualmente en el módulo "${currentModule}". Prioriza ayuda relacionada con ese módulo.`
      : "";

    const moduleDetails: Record<string, string> = {
      legal: `\n\nSobre Legal: 31 agentes legales especializados en jurisdicción dominicana (RD). Incluye gestión de expedientes, cálculo de plazos procesales, prescripción, análisis de contratos, compliance, y anti-alucinación (todas las respuestas legales requieren validación de abogado). 8 leyes dominicanas verificadas en el knowledge pack.`,
      credit: `\n\nSobre Credit Hub: plataforma dealer-bank para solicitudes de crédito automotriz. Incluye mesa de decisiones con scoring, preaprobación, gestión de concesionarios, y análisis de riesgo.`,
      marketing: `\n\nSobre Marketing: 46 agentes de marketing, 10 workflows automatizados (Campaign Optimization, Customer Acquisition, Content Performance, etc.). Automatización de campañas, analytics, y optimización multicanal.`,
      sic: `\n\nSobre SIC Hub: inteligencia de mercado crediticio. Análisis de statements financieros, investigación competitiva por tier (T1/T2/T3), concentración de mercado, y reportes de inteligencia.`,
    };

    return `Eres NADA, el copiloto de IA de NADAKKI — una plataforma enterprise multi-módulo.

Módulos principales:
- Legal (31 agentes): expedientes, plazos procesales, contratos, compliance — jurisdicción RD
- Credit Hub: solicitudes dealer-bank, mesa de decisiones, scoring, preaprobación
- Marketing (46 agentes): 10 workflows de automatización, campañas, analytics
- SIC: inteligencia de mercado crediticio, análisis de statements, tiers
- Contable: gestión contable, reportes financieros
- Projects: gestión de proyectos y finanzas

Tu rol es:
1. Ayudar al usuario con el módulo donde está trabajando
2. Responder preguntas sobre cualquier módulo de la plataforma
3. Dar recomendaciones y guías prácticas
4. Explicar funcionalidades y flujos de trabajo

Reglas:
- Responde en español
- Sé conciso (máximo 300 palabras)
- Usa bullet points para listas
- Sé profesional pero amigable
- No inventes datos ni números — si no sabes, dilo
- Para temas legales: siempre aclarar que requiere validación de abogado${moduleContext}${moduleDetails[currentModule ?? ""] ?? ""}`;
  }

  /** @deprecated Use getSystemPrompt() instead */
  private getDefaultSystemPrompt(): string {
    return this.getSystemPrompt();
  }
}

export const llmClient = new LLMClient();