"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_REALTIME_WS_URL,
  getSharedRealtimeClient,
  isRealtimeFeatureEnabled,
  resetSharedRealtimeClientForTests,
} from "@/lib/realtime/websocket-client";
import type { RealtimeConnectionState } from "@/types/realtime";

export interface UseWebSocketOptions {
  enabled?: boolean;
  baseUrl?: string;
  onMessage?: (raw: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const enabled = options.enabled ?? isRealtimeFeatureEnabled();
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_REALTIME_WS_URL;
  const [state, setState] = useState<RealtimeConnectionState>(enabled ? "idle" : "disabled");
  const [lastError, setLastError] = useState<string | null>(null);
  const onMessageRef = useRef(options.onMessage);
  onMessageRef.current = options.onMessage;

  const clientRef = useRef<ReturnType<typeof getSharedRealtimeClient> | null>(null);
  if (!clientRef.current) {
    clientRef.current = getSharedRealtimeClient({ baseUrl });
  }
  const client = clientRef.current;

  useEffect(() => {
    if (!enabled) {
      setState("disabled");
      return;
    }
    const unsubState = client.subscribeState((s) => {
      setState(s);
      setLastError(client.lastError);
    });
    client.connect();
    const unsubMsg = client.subscribeRaw((raw) => {
      onMessageRef.current?.(raw);
    });
    return () => {
      unsubState();
      unsubMsg();
    };
  }, [client, enabled]);

  const reconnect = useCallback(() => {
    if (!enabled) return;
    client.reconnect();
  }, [client, enabled]);

  const disconnect = useCallback(() => {
    client.disconnect();
  }, [client]);

  return {
    state,
    lastError,
    reconnect,
    disconnect,
    client,
    enabled,
  };
}

export const testResetRealtimeSocket = resetSharedRealtimeClientForTests;
