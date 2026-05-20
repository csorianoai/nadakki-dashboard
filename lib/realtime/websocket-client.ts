import type { RealtimeClientConfig, RealtimeConnectionState } from "@/types/realtime";
import { tokenStorage } from "@/lib/auth/token-storage";

export const DEFAULT_REALTIME_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "wss://nadakki-ai-suite.onrender.com/ws";

export const HEARTBEAT_DEFAULT_MS = 30_000;

/** Pure helper for unit tests — exponential backoff capped. */
export function nextReconnectDelayMs(attempt: number, minMs: number, maxMs: number): number {
  const exp = Math.min(maxMs, minMs * 2 ** Math.min(attempt, 8));
  const jitter = Math.floor(Math.random() * Math.min(500, minMs));
  return Math.min(maxMs, exp + jitter);
}

export function getJwtForWebSocket(): string | null {
  const v2 = tokenStorage.getAccessToken();
  if (v2) return v2;
  if (typeof window !== "undefined") {
    const legacy = window.localStorage.getItem("nadakki_sic_token");
    if (legacy) return legacy;
  }
  return null;
}

export function getRealtimeTenantId(): string | null {
  if (typeof window === "undefined") return null;
  const t = window.localStorage.getItem("nadakki_tenant_id");
  return t && t.trim() ? t.trim() : null;
}

/** Build ws URL; browsers cannot set Authorization headers on WebSocket — use query string. */
export function buildWebSocketUrl(baseUrl: string, token: string | null, tenantId: string | null): string {
  try {
    const u = new URL(
      baseUrl,
      typeof window !== "undefined" ? window.location.origin : "https://localhost",
    );
    if (token) u.searchParams.set("access_token", token);
    if (tenantId) u.searchParams.set("tenant_id", tenantId);
    return u.toString();
  } catch {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const q = [`access_token=${encodeURIComponent(token ?? "")}`, tenantId ? `tenant_id=${encodeURIComponent(tenantId)}` : ""]
      .filter(Boolean)
      .join("&");
    return `${baseUrl}${sep}${q}`;
  }
}

export type MessageHandler = (data: string) => void;

type ChannelHandler = (channel: string, payload: string) => void;

export class RealtimeWebSocketClient {
  private config: Required<RealtimeClientConfig>;
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private attempt = 0;
  private shouldRun = false;
  private listeners = new Set<MessageHandler>();
  private channels = new Map<string, Set<(payload: string) => void>>();
  private readonly channelFanOut: ChannelHandler;

  public state: RealtimeConnectionState = "idle";
  public lastError: string | null = null;

  constructor(config: RealtimeClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      authMode: config.authMode ?? "query",
      heartbeatIntervalMs: config.heartbeatIntervalMs ?? HEARTBEAT_DEFAULT_MS,
      maxReconnectDelayMs: config.maxReconnectDelayMs ?? 30_000,
      minReconnectDelayMs: config.minReconnectDelayMs ?? 1_000,
      onAudit: config.onAudit ?? (() => {}),
    };
    this.channelFanOut = (channel, payload) => {
      const subs = this.channels.get(channel);
      if (!subs) return;
      subs.forEach((fn) => {
        try {
          fn(payload);
        } catch {
          /* ignore subscriber errors */
        }
      });
    };
  }

  connect(): void {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") return;
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.shouldRun = true;
    this.openSocket();
  }

  disconnect(): void {
    this.shouldRun = false;
    this.clearReconnect();
    this.clearHeartbeat();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
    this.applyConnectionState("idle");
    this.config.onAudit("ws_disconnected", { reason: "manual" });
  }

  subscribeRaw(handler: MessageHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  subscribeChannel(channel: string, handler: (payload: string) => void): () => void {
    if (!this.channels.has(channel)) this.channels.set(channel, new Set());
    this.channels.get(channel)!.add(handler);
    this.sendJson({
      type: "subscribe",
      channel,
      tenant_id: getRealtimeTenantId() ?? undefined,
    });
    return () => {
      const set = this.channels.get(channel);
      if (!set) return;
      set.delete(handler);
      if (set.size === 0) {
        this.channels.delete(channel);
        this.sendJson({
          type: "unsubscribe",
          channel,
          tenant_id: getRealtimeTenantId() ?? undefined,
        });
      }
    };
  }

  reconnect(): void {
    this.clearReconnect();
    this.clearHeartbeat();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
    this.attempt = 0;
    this.shouldRun = true;
    this.applyConnectionState("connecting");
    this.openSocket();
  }

  private applyConnectionState(s: RealtimeConnectionState): void {
    this.state = s;
    this.stateListeners.forEach((fn) => {
      try {
        fn(s);
      } catch {
        /* ignore */
      }
    });
  }

  private stateListeners = new Set<(s: RealtimeConnectionState) => void>();

  subscribeState(listener: (s: RealtimeConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  private openSocket(): void {
    if (!this.shouldRun || typeof window === "undefined") return;
    this.clearReconnect();
    this.applyConnectionState(this.attempt > 0 ? "reconnecting" : "connecting");

    const token = this.config.authMode === "query" ? getJwtForWebSocket() : null;
    const tenant = getRealtimeTenantId();
    const url = buildWebSocketUrl(this.config.baseUrl, token, tenant);

    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.lastError = msg;
      this.applyConnectionState("error");
      this.config.onAudit("ws_connect_error", { message: msg });
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.attempt = 0;
      this.lastError = null;
      this.applyConnectionState("connected");
      this.config.onAudit("ws_connected", { url: this.config.baseUrl, tenant_id: tenant });
      if (this.config.authMode === "message") {
        const jwt = getJwtForWebSocket();
        if (jwt) {
          this.sendJson({ type: "auth", token: jwt, tenant_id: tenant });
        }
      }
      this.resubscribeAll();
      this.startHeartbeat();
    };

    this.ws.onmessage = (ev) => {
      const data = typeof ev.data === "string" ? ev.data : "";
      if (data === "pong" || data.includes('"type":"pong"')) {
        this.config.onAudit("ws_pong", {});
      }
      this.listeners.forEach((fn) => {
        try {
          fn(data);
        } catch {
          /* ignore */
        }
      });
      this.dispatchChannelMessage(data);
    };

    this.ws.onerror = () => {
      this.lastError = "WebSocket error";
      this.applyConnectionState("error");
      this.config.onAudit("ws_error", {});
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.clearHeartbeat();
      this.applyConnectionState(this.shouldRun ? "reconnecting" : "idle");
      this.config.onAudit("ws_closed", { willReconnect: this.shouldRun });
      if (this.shouldRun) this.scheduleReconnect();
    };
  }

  private dispatchChannelMessage(raw: string): void {
    try {
      const j = JSON.parse(raw) as { channel?: string; type?: string; payload?: unknown };
      const ch = j.channel;
      if (ch && this.channels.has(ch)) {
        this.channelFanOut(ch, raw);
      }
    } catch {
      /* not JSON */
    }
  }

  private resubscribeAll(): void {
    for (const channel of this.channels.keys()) {
      this.sendJson({
        type: "subscribe",
        channel,
        tenant_id: getRealtimeTenantId() ?? undefined,
      });
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldRun) return;
    const delay = nextReconnectDelayMs(
      this.attempt,
      this.config.minReconnectDelayMs,
      this.config.maxReconnectDelayMs,
    );
    this.attempt += 1;
    this.clearReconnect();
    this.reconnectTimer = window.setTimeout(() => this.openSocket(), delay);
    this.config.onAudit("ws_reconnect_scheduled", { delay_ms: delay, attempt: this.attempt });
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      this.sendJson({ type: "ping", ts: Date.now() });
    }, this.config.heartbeatIntervalMs);
  }

  sendJson(obj: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify(obj));
    } catch {
      /* ignore */
    }
  }
}

let shared: RealtimeWebSocketClient | null = null;

export function getSharedRealtimeClient(config?: RealtimeClientConfig): RealtimeWebSocketClient {
  if (!shared) {
    shared = new RealtimeWebSocketClient(
      config ?? { baseUrl: process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_REALTIME_WS_URL },
    );
  }
  return shared;
}

/** Test helper — reset singleton between tests. */
export function resetSharedRealtimeClientForTests(): void {
  if (shared) {
    shared.disconnect();
    shared = null;
  }
}

export function isRealtimeFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_REALTIME_UPDATES === "true";
}
