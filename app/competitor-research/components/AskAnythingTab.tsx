"use client";

import { useState } from "react";
import { useChatConversation } from "@/hooks/useChatConversation";
import { useTenant } from "@/contexts/TenantContext";
import type { UILang } from "@/lib/i18n/competitor-research";
import { ChatInterface } from "./ChatInterface";
import { CountrySelector } from "./CountrySelector";

export function AskAnythingTab({ lang }: { lang: UILang }) {
  const { tenantId } = useTenant();
  const { messages, sending, send, clear } = useChatConversation();
  const [country, setCountry] = useState("US");

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <CountrySelector value={country} onChange={setCountry} lang={lang} id="chat-country" />
      </div>
      <ChatInterface
        messages={messages}
        sending={sending}
        countryCode={country}
        lang={lang}
        onClear={clear}
        onSend={(text) => send(text, country, tenantId)}
      />
    </div>
  );
}
