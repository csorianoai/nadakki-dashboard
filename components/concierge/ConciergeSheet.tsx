"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChatHeader } from "@/components/concierge/ChatHeader";
import { ChatMessage } from "@/components/concierge/ChatMessage";
import { InlineVehicleRec } from "@/components/concierge/InlineVehicleRec";
import { TypingIndicator } from "@/components/concierge/TypingIndicator";
import { QuickActions } from "@/components/concierge/QuickActions";
import { ChatInput } from "@/components/concierge/ChatInput";
import { ConciergeFab } from "@/components/concierge/ConciergeFab";
import { SEED_MESSAGES, INVENTORY_UNAVAILABLE, conciergeRegion, regionalReply } from "@/lib/concierge/messages";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import { sendConciergeMessage, type ConciergeVehicle } from "@/lib/api/concierge";

type Message = {
  role: "user" | "bot";
  text: string;
  vehicles?: ConciergeVehicle[];
  retryText?: string;
};

/** El concierge es para compradores: en las pantallas del concesionario tapaba el boton del asistente contable. */
export function esPantallaDelConcesionario(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  return p === "/autos/dealer" || p.startsWith("/autos/dealer/");
}

export function ConciergeHost() {
  const pathname = usePathname();
  if (esPantallaDelConcesionario(pathname)) return null;
  return <ConciergeHostVisible />;
}

function ConciergeHostVisible() {
  const branding = useDealerManagementBranding();
  const { locale, country, currency } = conciergeRegion(branding.data);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("nadakki:concierge:open", handler);
    return () => window.removeEventListener("nadakki:concierge:open", handler);
  }, []);

  const pushBotReply = useCallback(async (userText: string) => {
    setTyping(true);

    try {
      const res = await sendConciergeMessage(sessionId, userText, { locale, ...(country ? { country_code: country, currency } : {}) });
      if (res.sessionId) setSessionId(res.sessionId);
      // La respuesta sale del inventario REAL del concesionario: su moneda es la de sus autos. El control de moneda
      // por region era para textos de ejemplo; si no aplica, se muestra el texto del backend tal cual.
      let reply = res.message;
      try { reply = regionalReply(res.message, { locale, country, currency }); } catch { /* moneda real del inventario */ }
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: reply,
          vehicles: res.vehicles,
        },
      ]);
    } catch {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: INVENTORY_UNAVAILABLE, retryText: userText },
      ]);
    }
  }, [locale, country, currency, sessionId]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    void pushBotReply(text);
  }, [input, typing, pushBotReply]);

  const handleQuickAction = (label: string) => {
    setInput(label);
  };

  return (
    <>
      <ConciergeFab visible={!open} onClick={() => setOpen(true)} />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" showClose={false} className="flex h-full flex-col p-0">
          <ChatHeader onClose={() => setOpen(false)} />

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.map((msg, i) => (
                <ChatMessage key={`${msg.role}-${i}`} role={msg.role} text={msg.text}>
                  {msg.retryText ? <button type="button" disabled={typing} className="mt-2 underline" onClick={() => {
                    setMessages((prev) => prev.filter((message) => message !== msg));
                    void pushBotReply(msg.retryText!);
                  }}>Reintentar</button> : null}
                  {msg.vehicles?.length ? (
                    <InlineVehicleRec
                      vehicles={msg.vehicles}
                      onNavigate={() => setOpen(false)}
                    />
                  ) : null}
                </ChatMessage>
              ))}
              {typing ? <TypingIndicator /> : null}
            </div>

            <QuickActions onAction={handleQuickAction} />
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              autoFocus={open}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
