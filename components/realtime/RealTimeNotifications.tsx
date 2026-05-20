"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { parseRealtimeMessage } from "@/lib/realtime/event-handlers";
import { useWebSocket } from "@/hooks/useWebSocket";
import { isRealtimeFeatureEnabled } from "@/lib/realtime/websocket-client";

interface RealTimeNotificationsProps {
  /** When false, notifications are disabled (feature flag off). */
  enabled?: boolean;
}

/**
 * Subscribes to the shared WebSocket client and surfaces domain events as toasts.
 */
export function RealTimeNotifications({ enabled = isRealtimeFeatureEnabled() }: RealTimeNotificationsProps) {
  const seen = useRef<Set<string>>(new Set());

  const dedupe = (key: string, fn: () => void) => {
    if (seen.current.has(key)) return;
    seen.current.add(key);
    fn();
    window.setTimeout(() => {
      seen.current.delete(key);
    }, 5_000);
  };

  useWebSocket({
    enabled,
    onMessage: (raw) => {
      const ev = parseRealtimeMessage(raw);
      if (!ev || ev.kind === "ping" || ev.kind === "pong" || ev.kind === "unknown") return;

      switch (ev.kind) {
        case "application.created":
          dedupe(`app:${ev.application.application_id}`, () =>
            toast.message("Nueva solicitud", {
              description: ev.application.applicant_name ?? ev.application.application_id,
            }),
          );
          break;
        case "offer.received":
          dedupe(`offer:${ev.application_id}`, () =>
            toast.success("Oferta recibida", { description: ev.application_id }),
          );
          break;
        case "decision.made":
          dedupe(`dec:${ev.application_id}`, () =>
            toast.message("Decisión registrada", { description: ev.application_id }),
          );
          break;
        case "stipulations.updated":
          toast.info("Estipulaciones", { description: ev.message ?? ev.application_id });
          break;
        default:
          break;
      }
    },
  });

  useEffect(() => {
    if (!enabled && process.env.NODE_ENV === "development") {
      console.info("[realtime] RealTimeNotifications disabled");
    }
  }, [enabled]);

  return null;
}
