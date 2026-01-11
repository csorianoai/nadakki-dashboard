// lib/agents/analytics/conversation-logger.ts

export interface ConversationLog {
  id: string;
  tenantId: string;
  sessionId: string;
  timestamp: string;
  query: string;
  response: string;
  intent: string;
  source: 'system' | 'llm' | 'hybrid' | 'greeting';
  confidence: number;
  responseTime: number;
  feedback?: 'positive' | 'negative' | null;
  feedbackComment?: string;
  metadata: {
    userAgent?: string;
    page?: string;
    workflowId?: string;
  };
}

export interface AnalyticsSummary {
  totalConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  intentDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
  feedbackSummary: {
    positive: number;
    negative: number;
    noFeedback: number;
  };
  topQueries: Array<{ query: string; count: number }>;
  lowConfidenceQueries: ConversationLog[];
}

// In-memory storage (resets on serverless cold start)
// For production, use a database like Vercel KV, Supabase, or MongoDB
let logs: ConversationLog[] = [];

class ConversationLogger {
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  log(params: {
    tenantId: string;
    sessionId: string;
    query: string;
    response: string;
    intent: string;
    source: 'system' | 'llm' | 'hybrid' | 'greeting';
    confidence: number;
    responseTime: number;
    metadata?: {
      userAgent?: string;
      page?: string;
      workflowId?: string;
    };
  }): ConversationLog {
    const log: ConversationLog = {
      id: this.generateId(),
      tenantId: params.tenantId,
      sessionId: params.sessionId,
      timestamp: new Date().toISOString(),
      query: params.query,
      response: params.response,
      intent: params.intent,
      source: params.source,
      confidence: params.confidence,
      responseTime: params.responseTime,
      feedback: null,
      metadata: params.metadata || {}
    };

    logs.push(log);

    // Keep only last 1000 logs in memory
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }

    console.log('📝 Logged conversation:', {
      id: log.id,
      intent: log.intent,
      source: log.source,
      responseTime: `${log.responseTime}ms`
    });

    return log;
  }

  addFeedback(logId: string, feedback: 'positive' | 'negative', comment?: string): boolean {
    const log = logs.find(l => l.id === logId);
    
    if (log) {
      log.feedback = feedback;
      log.feedbackComment = comment;
      console.log('👍 Feedback recorded:', { logId, feedback });
      return true;
    }
    return false;
  }

  getByTenant(tenantId: string, limit: number = 100): ConversationLog[] {
    return logs
      .filter(log => log.tenantId === tenantId)
      .slice(-limit);
  }

  getAnalytics(tenantId?: string): AnalyticsSummary {
    const filteredLogs = tenantId ? logs.filter(l => l.tenantId === tenantId) : logs;

    const intentDistribution: Record<string, number> = {};
    const sourceDistribution: Record<string, number> = {};
    const queryCount: Record<string, number> = {};
    const sessionIds = new Set<string>();

    let totalResponseTime = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let noFeedbackCount = 0;
    const lowConfidenceQueries: ConversationLog[] = [];

    filteredLogs.forEach(log => {
      sessionIds.add(log.sessionId);
      intentDistribution[log.intent] = (intentDistribution[log.intent] || 0) + 1;
      sourceDistribution[log.source] = (sourceDistribution[log.source] || 0) + 1;
      totalResponseTime += log.responseTime;

      if (log.feedback === 'positive') positiveCount++;
      else if (log.feedback === 'negative') negativeCount++;
      else noFeedbackCount++;

      const normalizedQuery = log.query.toLowerCase().trim();
      queryCount[normalizedQuery] = (queryCount[normalizedQuery] || 0) + 1;

      if (log.confidence < 0.5) {
        lowConfidenceQueries.push(log);
      }
    });

    const topQueries = Object.entries(queryCount)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalConversations: sessionIds.size,
      totalMessages: filteredLogs.length,
      avgResponseTime: filteredLogs.length > 0 ? Math.round(totalResponseTime / filteredLogs.length) : 0,
      intentDistribution,
      sourceDistribution,
      feedbackSummary: {
        positive: positiveCount,
        negative: negativeCount,
        noFeedback: noFeedbackCount
      },
      topQueries,
      lowConfidenceQueries: lowConfidenceQueries.slice(-20)
    };
  }

  exportForTraining(tenantId?: string): {
    systemQueries: Array<{ query: string; expectedResponse: string; feedback?: string }>;
    llmQueries: Array<{ query: string; response: string; feedback?: string }>;
    improvementOpportunities: Array<{ query: string; issue: string }>;
  } {
    const filteredLogs = tenantId ? logs.filter(l => l.tenantId === tenantId) : logs;

    const systemQueries = filteredLogs
      .filter(l => l.source === 'system' && l.feedback === 'positive')
      .map(l => ({
        query: l.query,
        expectedResponse: l.response,
        feedback: l.feedbackComment
      }));

    const llmQueries = filteredLogs
      .filter(l => l.source === 'llm')
      .map(l => ({
        query: l.query,
        response: l.response,
        feedback: l.feedback || undefined
      }));

    const improvementOpportunities = filteredLogs
      .filter(l => l.feedback === 'negative' || l.confidence < 0.5)
      .map(l => ({
        query: l.query,
        issue: l.feedback === 'negative'
          ? `Negative feedback: ${l.feedbackComment || 'No comment'}`
          : `Low confidence: ${l.confidence}`
      }));

    return {
      systemQueries,
      llmQueries,
      improvementOpportunities
    };
  }
}

export const conversationLogger = new ConversationLogger();