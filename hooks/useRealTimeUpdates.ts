"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/fetch-client";
import {
  eventToMergeMode,
  mergeQueueApplications,
  parseRealtimeMessage,
  type QueueApplicationRow,
} from "@/lib/realtime/event-handlers";
import {
  DEFAULT_REALTIME_WS_URL,
  getSharedRealtimeClient,
  isRealtimeFeatureEnabled,
} from "@/lib/realtime/websocket-client";
import type { RealtimeApplicationEvent } from "@/types/realtime";

const POLL_MS = 20_000;

export interface UseRealTimeUpdatesOptions {
  enabled?: boolean;
  /** WebSocket channel for credit applications (tenant-scoped server-side). */
  channel?: string;
  pollIntervalMs?: number;
  onEvent?: (event: RealtimeApplicationEvent) => void;
}

async function fetchQueue(): Promise<QueueApplicationRow[]> {
  const res = await apiFetch("/api/v2/credit/applications/queue?page=1&limit=50");
  if (!res.ok) return [];
  const j = (await res.json()) as {
    applications?: QueueApplicationRow[];
  };
  return Array.isArray(j.applications) ? j.applications : [];
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}) {
  const enabled = options.enabled ?? isRealtimeFeatureEnabled();
  const channel = options.channel ?? "credit.applications";
  const pollMs = options.pollIntervalMs ?? POLL_MS;
  const onEventRef = useRef(options.onEvent);
  onEventRef.current = options.onEvent;

  const [rows, setRows] = useState<QueueApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** websocket = live socket; polling = fallback; idle = feature off or initial */
  const [transport, setTransport] = useState<"websocket" | "polling" | "idle">(
    enabled ? "polling" : "idle",
  );

  const client = useMemo(
    () => getSharedRealtimeClient({ baseUrl: process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_REALTIME_WS_URL }),
    [],
  );

  const pull = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchQueue();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "queue_fetch_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void pull();
  }, [pull]);

  useEffect(() => {
    if (!enabled) {
      setTransport("idle");
      return;
    }

    const unsubState = client.subscribeState((s) => {
      if (s === "connected") setTransport("websocket");
      else if (s === "reconnecting" || s === "error" || s === "idle") setTransport("polling");
    });

    client.connect();

    const unsubChan = client.subscribeChannel(channel, (payload) => {
      const ev = parseRealtimeMessage(payload);
      if (!ev) return;
      onEventRef.current?.(ev);
      const mode = eventToMergeMode(ev);
      if (ev.kind === "application.created" || ev.kind === "application.updated") {
        const patch = ev.application;
        setRows((prev) => mergeQueueApplications(prev, patch, mode ?? "update"));
      }
      if (ev.kind === "decision.made" || ev.kind === "stipulations.updated") {
        void pull();
      }
    });

    const unsubRaw = client.subscribeRaw((raw) => {
      const ev = parseRealtimeMessage(raw);
      if (ev?.kind === "offer.received" || ev?.kind === "aggregation.updated") {
        onEventRef.current?.(ev);
        void pull();
      }
    });

    const poll = window.setInterval(() => {
      if (client.state !== "connected") {
        void pull();
      }
    }, pollMs);

    return () => {
      unsubState();
      unsubChan();
      unsubRaw();
      window.clearInterval(poll);
    };
  }, [enabled, channel, client, pollMs, pull]);

  return {
    applications: rows,
    loading,
    error,
    transport,
    refetch: pull,
    connectionState: client.state,
  };
}
