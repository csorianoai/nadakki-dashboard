"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { TypingIndicator } from "@/components/concierge/TypingIndicator";
import { VehicleChatMessage } from "@/components/vdp/VehicleChatMessage";
import { sendVehicleChatMessage } from "@/lib/api/vehicle-chat";
import { buildWhatsAppEscalation } from "@/lib/vehicle-chat/mock-responses";
import type { Vehicle } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "¿Está disponible?",
  "¿Aceptas trade-in?",
  "Historial completo",
  "Agendar test drive",
] as const;

type ChatEntry = {
  id: string;
  role: "user" | "bot" | "system";
  text: string;
};

function storageKey(vehicleId: number) {
  return `nadakki_vchat_${vehicleId}`;
}

export function VehicleChatWindow({
  vehicle,
  open,
  onClose,
}: {
  vehicle: Vehicle;
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [escalated, setEscalated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey(vehicle.id));
      if (raw) {
        const parsed = JSON.parse(raw) as {
          messages: ChatEntry[];
          sessionId: string | null;
          userMsgCount: number;
          escalated: boolean;
        };
        setMessages(parsed.messages);
        setSessionId(parsed.sessionId);
        setUserMsgCount(parsed.userMsgCount);
        setEscalated(parsed.escalated);
        return;
      }
    } catch {
      /* fresh chat */
    }
    setMessages([
      {
        id: "welcome",
        role: "bot",
        text: `¡Hola! Soy el AI de este ${vehicle.year} ${vehicle.make} ${vehicle.model}. Sé todo sobre este vehículo específico. ¿En qué puedo ayudarte?`,
      },
    ]);
  }, [vehicle]);

  useEffect(() => {
    if (typeof window === "undefined" || messages.length === 0) return;
    window.localStorage.setItem(
      storageKey(vehicle.id),
      JSON.stringify({ messages, sessionId, userMsgCount, escalated }),
    );
  }, [messages, sessionId, userMsgCount, escalated, vehicle.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;

      setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text: trimmed }]);
      setInput("");
      setTyping(true);
      const nextCount = userMsgCount + 1;
      setUserMsgCount(nextCount);

      const res = await sendVehicleChatMessage(vehicle, trimmed, sessionId);
      setSessionId(res.sessionId ?? sessionId);
      setMessages((m) => [...m, { id: `b-${Date.now()}`, role: "bot", text: res.message }]);
      setTyping(false);

      if (nextCount >= 3 && !escalated) {
        setEscalated(true);
        setMessages((m) => [
          ...m,
          {
            id: `sys-${Date.now()}`,
            role: "bot",
            text: "Voy a contactar al dealer para que te responda personalmente.",
          },
          {
            id: `sys2-${Date.now()}`,
            role: "system",
            text: `🔔 Contactando a ${vehicle.dealerName} vía WhatsApp…`,
          },
        ]);
      }
    },
    [typing, userMsgCount, sessionId, vehicle, escalated],
  );

  const summary = messages
    .filter((m) => m.role !== "system")
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Yo" : "AI"}: ${m.text}`)
    .join("\n");

  const waLink = `https://wa.me/18095551234?text=${buildWhatsAppEscalation(vehicle, summary)}`;

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 right-6 z-[57] flex w-[min(400px,calc(100vw-32px))] flex-col overflow-hidden rounded-r-sm border border-brand-2/30 bg-nk-surface shadow-nk-lg",
        "h-[min(550px,calc(100vh-120px))]",
      )}
      role="dialog"
      aria-label={`Chat AI del ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
    >
      <header className="flex items-center gap-3 border-b border-nk-border bg-brand-2/10 px-4 py-3">
        <div
          className="h-10 w-10 shrink-0 rounded-full"
          style={{ background: vehicle.grad }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-nk-fg">
            AI del {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="text-xs text-nk-fg-muted">
            {vehicle.dealerName} · En línea
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-nk-fg-muted hover:bg-nk-surface-2"
          aria-label="Cerrar chat"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <VehicleChatMessage key={m.id} role={m.role} text={m.text} />
        ))}
        {typing ? <TypingIndicator /> : null}
        {messages.length <= 2 ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-brand-2/30 bg-brand-2/10 px-3 py-1 text-xs font-semibold text-brand-2 hover:bg-brand-2/20"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
        {escalated ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm font-bold text-white"
          >
            Continuar por WhatsApp
          </a>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t border-nk-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          className="min-h-10 flex-1 rounded-full border border-nk-border bg-nk-surface-2 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2"
        />
        <button
          type="submit"
          disabled={!input.trim() || typing}
          className="rounded-full bg-brand-2 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
