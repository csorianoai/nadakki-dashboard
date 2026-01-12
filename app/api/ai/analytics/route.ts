// app/api/ai/analytics/route.ts

import { NextRequest, NextResponse } from "next/server";
import { conversationLogger } from "@/lib/agents/analytics/conversation-logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || undefined;
    const action = searchParams.get('action') || 'summary';

    switch (action) {
      case 'summary':
        const analytics = await conversationLogger.getAnalytics(tenantId);
        return NextResponse.json(analytics);

      case 'export':
        const exportData = await conversationLogger.exportForTraining(tenantId);
        return NextResponse.json(exportData);

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, logId, feedback, comment } = await request.json();

    if (action === 'feedback') {
      const success = await conversationLogger.addFeedback(logId, feedback, comment);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Analytics POST Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}