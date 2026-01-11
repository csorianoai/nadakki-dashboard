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
- Workflows de marketing
- Agentes de IA y sus funciones
- Cómo usar el dashboard

¿Te gustaría que te ayude con algo del sistema?`,
      provider: 'local-fallback'
    };
  }

  private getDefaultSystemPrompt(): string {
    return `Eres NADAKKI AI Copilot, el asistente inteligente de una plataforma de marketing automation.

Tu rol es:
1. Responder preguntas de marketing digital
2. Dar ideas creativas para campañas
3. Explicar conceptos de marketing y analytics
4. Dar recomendaciones basadas en mejores prácticas

Reglas:
- Responde en español
- Sé conciso (máximo 300 palabras)
- Usa bullet points para listas
- Sé profesional pero amigable
- Da ejemplos prácticos`;
  }
}

export const llmClient = new LLMClient();