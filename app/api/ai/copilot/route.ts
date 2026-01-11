// app/api/ai/copilot/route.ts

import { NextRequest, NextResponse } from "next/server";
import { router } from "@/lib/agents/routing/router";
import { conversationLogger } from "@/lib/agents/analytics/conversation-logger";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { message, sessionId, context = {} } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Generar sessionId si no existe
    const currentSessionId = sessionId || conversationLogger.generateSessionId();

    // Usar el router inteligente
    const response = await router.route(message, context);

    const responseTime = Date.now() - startTime;

    // Registrar la conversación
    const log = conversationLogger.log({
      tenantId: context.tenant_id || 'default',
      sessionId: currentSessionId,
      query: message,
      response: response.content,
      intent: response.intent,
      source: response.source,
      confidence: response.confidence,
      responseTime,
      metadata: {
        page: context.current_page,
        userAgent: context.user_agent
      }
    });

    return NextResponse.json({
      response: response.content,
      source: response.source,
      confidence: response.confidence,
      intent: response.intent,
      suggestions: response.suggestions,
      sessionId: currentSessionId,
      logId: log.id,  // Para feedback
      responseTime
    });

  } catch (error) {
    console.error("Copilot API Error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        response: "Lo siento, ocurrió un error. Por favor intenta de nuevo.",
        suggestions: ["Explícame los workflows", "¿Qué puedo hacer?"]
      },
      { status: 500 }
    );
  }
}