// lib/agents/analytics/conversation-logger.ts

import { kv } from '@vercel/kv';

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

const LOGS_KEY = 'copilot:logs';
let memoryLogs: ConversationLog[] = [];

class ConversationLogger {
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getLogs(): Promise<ConversationLog[]> {
    try {
      const logs = await kv.get<ConversationLog[]>(LOGS_KEY);
      return logs || [];
    } catch (error) {
      console.log('📦 Using memory fallback');
      return memoryLogs;
    }
  }

  private async saveLogs(logs: ConversationLog[]): Promise<void> {
    try {
      await kv.set(LOGS_KEY, logs);
    } catch (error) {
      memoryLogs = logs;
    }
  }

  async log(params: {
    tenantId: string;
    sessionId: string;
    query: string;
    response: string;
    intent: string;
    source: 'system' | 'llm' | 'hybrid' | 'greeting';
    confidence: number;
    responseTime: number;
    metadata?: { userAgent?: string; page?: string };
  }): Promise<ConversationLog> {
    const log: ConversationLog = {
      id: this.generateId(),
      tenantId: params.tenantId,
      sessionId: params.sessionId,
      timestamp: new Date().toISOString(),
      query: params.query,
      response: params.response.substring(0, 500),
      intent: params.intent,
      source: params.source,
      confidence: params.confidence,
      responseTime: params.responseTime,
      feedback: null,
      metadata: params.metadata || {}
    };

    const logs = await this.getLogs();
    logs.push(log);
    const trimmed = logs.slice(-500);
    await this.saveLogs(trimmed);

    console.log('📝 Logged:', { id: log.id, intent: log.intent, source: log.source });
    return log;
  }

  async addFeedback(logId: string, feedback: 'positive' | 'negative', comment?: string): Promise<boolean> {
    const logs = await this.getLogs();
    const log = logs.find(l => l.id === logId);
    
    if (log) {
      log.feedback = feedback;
      log.feedbackComment = comment;
      await this.saveLogs(logs);
      console.log('👍 Feedback saved:', { logId, feedback });
      return true;
    }
    return false;
  }

  async getAnalytics(tenantId?: string): Promise<AnalyticsSummary> {
    const allLogs = await this.getLogs();
    const logs = tenantId ? allLogs.filter(l => l.tenantId === tenantId) : allLogs;

    const intentDistribution: Record<string, number> = {};
    const sourceDistribution: Record<string, number> = {};
    const queryCount: Record<string, number> = {};
    const sessionIds = new Set<string>();

    let totalResponseTime = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let noFeedbackCount = 0;
    const lowConfidenceQueries: ConversationLog[] = [];

    logs.forEach(log => {
      sessionIds.add(log.sessionId);
      intentDistribution[log.intent] = (intentDistribution[log.intent] || 0) + 1;
      sourceDistribution[log.source] = (sourceDistribution[log.source] || 0) + 1;
      totalResponseTime += log.responseTime;

      if (log.feedback === 'positive') positiveCount++;
      else if (log.feedback === 'negative') negativeCount++;
      else noFeedbackCount++;

      const q = log.query.toLowerCase().trim().substring(0, 100);
      queryCount[q] = (queryCount[q] || 0) + 1;

      if (log.confidence < 0.5) lowConfidenceQueries.push(log);
    });

    return {
      totalConversations: sessionIds.size,
      totalMessages: logs.length,
      avgResponseTime: logs.length > 0 ? Math.round(totalResponseTime / logs.length) : 0,
      intentDistribution,
      sourceDistribution,
      feedbackSummary: { positive: positiveCount, negative: negativeCount, noFeedback: noFeedbackCount },
      topQueries: Object.entries(queryCount)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      lowConfidenceQueries: lowConfidenceQueries.slice(-20)
    };
  }

  async exportForTraining(tenantId?: string) {
    const allLogs = await this.getLogs();
    const logs = tenantId ? allLogs.filter(l => l.tenantId === tenantId) : allLogs;

    return {
      systemQueries: logs
        .filter(l => l.source === 'system' && l.feedback === 'positive')
        .map(l => ({ query: l.query, expectedResponse: l.response })),
      llmQueries: logs
        .filter(l => l.source === 'llm')
        .map(l => ({ query: l.query, response: l.response, feedback: l.feedback })),
      improvementOpportunities: logs
        .filter(l => l.feedback === 'negative' || l.confidence < 0.5)
        .map(l => ({ query: l.query, issue: l.feedback === 'negative' ? 'Negative feedback' : `Low confidence: ${l.confidence}` }))
    };
  }
}

export const conversationLogger = new ConversationLogger();