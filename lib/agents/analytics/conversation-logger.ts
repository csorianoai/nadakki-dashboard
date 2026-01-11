// lib/agents/analytics/conversation-logger.ts

import fs from 'fs';
import path from 'path';

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

class ConversationLogger {
  private dataDir: string;
  private logsFile: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'copilot-logs');
    this.logsFile = path.join(this.dataDir, 'conversations.json');
    this.ensureDataDir();
  }

  private ensureDataDir(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (!fs.existsSync(this.logsFile)) {
        fs.writeFileSync(this.logsFile, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error('Error creating data directory:', error);
    }
  }

  private readLogs(): ConversationLog[] {
    try {
      const data = fs.readFileSync(this.logsFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private writeLogs(logs: ConversationLog[]): void {
    try {
      fs.writeFileSync(this.logsFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error('Error writing logs:', error);
    }
  }

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

    const logs = this.readLogs();
    logs.push(log);
    this.writeLogs(logs);

    console.log('📝 Logged conversation:', {
      id: log.id,
      intent: log.intent,
      source: log.source,
      responseTime: `${log.responseTime}ms`
    });

    return log;
  }

  addFeedback(logId: string, feedback: 'positive' | 'negative', comment?: string): boolean {
    const logs = this.readLogs();
    const log = logs.find(l => l.id === logId);
    
    if (log) {
      log.feedback = feedback;
      log.feedbackComment = comment;
      this.writeLogs(logs);
      console.log('👍 Feedback recorded:', { logId, feedback });
      return true;
    }
    return false;
  }

  getByTenant(tenantId: string, limit: number = 100): ConversationLog[] {
    const logs = this.readLogs();
    return logs
      .filter(log => log.tenantId === tenantId)
      .slice(-limit);
  }

  getAnalytics(tenantId?: string): AnalyticsSummary {
    const allLogs = this.readLogs();
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
      totalMessages: logs.length,
      avgResponseTime: logs.length > 0 ? Math.round(totalResponseTime / logs.length) : 0,
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
    const allLogs = this.readLogs();
    const logs = tenantId ? allLogs.filter(l => l.tenantId === tenantId) : allLogs;

    const systemQueries = logs
      .filter(l => l.source === 'system' && l.feedback === 'positive')
      .map(l => ({
        query: l.query,
        expectedResponse: l.response,
        feedback: l.feedbackComment
      }));

    const llmQueries = logs
      .filter(l => l.source === 'llm')
      .map(l => ({
        query: l.query,
        response: l.response,
        feedback: l.feedback || undefined
      }));

    const improvementOpportunities = logs
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