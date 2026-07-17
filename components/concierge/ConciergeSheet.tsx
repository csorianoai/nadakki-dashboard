"use client";

import { useCallback, useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChatHeader } from "@/components/concierge/ChatHeader";
import { ChatMessage } from "@/components/concierge/ChatMessage";
import { InlineVehicleRec } from "@/components/concierge/InlineVehicleRec";
import { TypingIndicator } from "@/components/concierge/TypingIndicator";
import { QuickActions } from "@/components/concierge/QuickActions";
import { ChatInput } from "@/components/concierge/ChatInput";
import { ConciergeFab } from "@/components/concierge/ConciergeFab";
import { SEED_MESSAGES, matchConciergeReply } from "@/lib/concierge/mock-responses";
import { sendConciergeMessage } from "@/lib/api/concierge";

type Message = {
  role: "user" | "bot";
  text: string;
  recId?: number;
};

export function ConciergeHost() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("nadakki:concierge:open", handler);
    return () => window.removeEventListener("nadakki:concierge:open", handler);
  }, []);

  const pushBotReply = useCallback(async (userText: string) => {
    setTyping(true);
    await new Promise((r) => window.setTimeout(r, 1100));

    try {
      const res = await sendConciergeMessage(null, userText, {});
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: res.message,
          recId: res.recId,
        },
      ]);
    } catch {
      const mock = matchConciergeReply(userText);
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: mock.text, recId: mock.recId },
      ]);
    }
  }, []);

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
                  {msg.recId ? (
                    <InlineVehicleRec
                      vehicleId={msg.recId}
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
