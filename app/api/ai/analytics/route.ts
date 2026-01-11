// app/api/ai/analytics/route.ts

import { NextRequest, NextResponse } from "next/server";
import { conversationLogger } from "@/lib/agents/analytics/conversation-logger";

// GET - Obtener analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || undefined;
    const action = searchParams.get('action') || 'summary';

    switch (action) {
      case 'summary':
        const analytics = conversationLogger.getAnalytics(tenantId);
        return NextResponse.json(analytics);

      case 'export':
        const exportData = conversationLogger.exportForTraining(tenantId);
        return NextResponse.json(exportData);

      case 'history':
        const limit = parseInt(searchParams.get('limit') || '100');
        const history = conversationLogger.getByTenant(tenantId || 'default', limit);
        return NextResponse.json({ history });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST - Registrar feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, logId, feedback, comment } = body;

    if (action === 'feedback') {
      const success = conversationLogger.addFeedback(logId, feedback, comment);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Analytics POST Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}