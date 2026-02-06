"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Minimize2, Lightbulb, RefreshCw } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

interface Message {
  id: string;
  logId?: string;
  role: "user" | "assistant";
  content: string;
  source?: string;
  suggestions?: string[];
  feedback?: "positive" | "negative" | null;
}

export default function OnboardingAgent() {
  const { tenantId, settings } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "Â¡Hola! ðŸ‘‹ Soy NADA, tu copiloto de IA.\n\nPuedo ayudarte con:\nâ€¢ Workflows de marketing\nâ€¢ Los 239 agentes de IA\nâ€¢ Tutoriales y guÃ­as\n\nÂ¿En quÃ© te ayudo?",
        source: "greeting",
        suggestions: ["Â¿QuÃ© es un workflow?", "Â¿QuÃ© workflows hay?", "Â¿CÃ³mo ejecuto un workflow?"]
      }]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    setMessages(prev => [...prev, { id: `u${Date.now()}`, role: "user", content: content.trim() }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, sessionId, context: { tenant_id: tenantId } })
      });
      const data = await res.json();
      
      // Debug log
      console.log("ðŸ“¥ API Response:", JSON.stringify(data, null, 2));
      
      if (data.sessionId) setSessionId(data.sessionId);
      
      const newMessage: Message = {
        id: `a${Date.now()}`,
        logId: data.logId || undefined,
        role: "assistant",
        content: data.response || "Error",
        source: data.source || "system",
        suggestions: data.suggestions || [],
        feedback: null
      };
      
      console.log("ðŸ“ New message logId:", newMessage.logId);
      
      setMessages(prev => [...prev, newMessage]);
    } catch (err) {
      console.error("âŒ API Error:", err);
      setMessages(prev => [...prev, { id: `e${Date.now()}`, role: "assistant", content: "Error de conexiÃ³n." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFeedback = async (msgId: string, logId: string | undefined, fb: "positive" | "negative") => {
    console.log("ðŸ”” Sending feedback:", { msgId, logId, fb });
    
    if (!logId) {
      console.warn("âš ï¸ No logId available, feedback not sent to server");
      // AÃºn asÃ­ actualizar UI
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: fb } : m));
      return;
    }
    
    try {
      const res = await fetch("/api/ai/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "feedback", logId, feedback: fb })
      });
      const result = await res.json();
      console.log("âœ… Feedback response:", result);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: fb } : m));
    } catch (err) {
      console.error("âŒ Feedback error:", err);
    }
  };

  const FeedbackButtons = ({ msg }: { msg: Message }) => {
    // No mostrar en welcome/greeting
    if (msg.id === "welcome" || msg.source === "greeting") return null;
    if (msg.role !== "assistant") return null;

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
        <span style={{ fontSize: "12px", color: "#888" }}>Â¿Ãštil?</span>
        <button
          onClick={() => sendFeedback(msg.id, msg.logId, "positive")}
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: "2px solid #22c55e",
            background: msg.feedback === "positive" ? "#22c55e" : "rgba(34,197,94,0.2)",
            color: msg.feedback === "positive" ? "#fff" : "#22c55e",
            fontWeight: "600",
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          ðŸ‘ SÃ­
        </button>
        <button
          onClick={() => sendFeedback(msg.id, msg.logId, "negative")}
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: "2px solid #ef4444",
            background: msg.feedback === "negative" ? "#ef4444" : "rgba(239,68,68,0.2)",
            color: msg.feedback === "negative" ? "#fff" : "#ef4444",
            fontWeight: "600",
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          ðŸ‘Ž No
        </button>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 99999, width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(to right, #9333ea, #06b6d4)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
        <Bot style={{ width: "28px", height: "28px", color: "#fff" }} />
        <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "14px", height: "14px", background: "#22c55e", borderRadius: "50%", border: "2px solid #111" }} />
      </button>
    );
  }

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 99999, width: isMinimized ? "320px" : "380px", height: isMinimized ? "56px" : "520px", background: "#111827", borderRadius: "16px", border: "1px solid #374151", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      
      {/* Header */}
      <div style={{ padding: "12px 16px", background: "linear-gradient(to right, rgba(88,28,135,0.5), rgba(8,145,178,0.5))", borderBottom: "1px solid #374151", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "linear-gradient(to right, #9333ea, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot style={{ width: "20px", height: "20px", color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff" }}>NADA <span style={{ fontSize: "11px", fontWeight: "400", color: "#9ca3af" }}>AI Copilot</span></div>
            {!isMinimized && <div style={{ fontSize: "11px", color: "#9ca3af" }}>{settings.name}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button onClick={() => { setMessages([]); setSessionId(null); }} style={{ padding: "8px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "8px" }}><RefreshCw style={{ width: "16px", height: "16px", color: "#9ca3af" }} /></button>
          <button onClick={() => setIsMinimized(!isMinimized)} style={{ padding: "8px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "8px" }}><Minimize2 style={{ width: "16px", height: "16px", color: "#9ca3af" }} /></button>
          <button onClick={() => setIsOpen(false)} style={{ padding: "8px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "8px" }}><X style={{ width: "16px", height: "16px", color: "#9ca3af" }} /></button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                
                {msg.role === "assistant" && msg.source && msg.source !== "greeting" && (
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", marginBottom: "4px", background: msg.source === "system" ? "#7c3aed" : "#0891b2", color: "#fff" }}>
                    {msg.source === "system" ? "ðŸ“š NADAKKI" : "ðŸ¤– IA General"}
                  </span>
                )}

                <div style={{ maxWidth: "85%", padding: "12px 16px", borderRadius: "16px", background: msg.role === "user" ? "#7c3aed" : "#1f2937", color: "#fff", fontSize: "14px", lineHeight: "1.5", whiteSpace: "pre-line" }}>
                  {msg.content}
                </div>

                <FeedbackButtons msg={msg} />

                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px", width: "100%" }}>
                    {msg.suggestions.map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", borderRadius: "12px", background: "rgba(147,51,234,0.2)", border: "1px solid rgba(147,51,234,0.3)", color: "#c4b5fd", fontSize: "12px", cursor: "pointer", textAlign: "left" }}>
                        <Lightbulb style={{ width: "14px", height: "14px", color: "#facc15", flexShrink: 0 }} />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && <div style={{ display: "flex" }}><div style={{ padding: "12px 16px", borderRadius: "16px", background: "#1f2937" }}><Loader2 style={{ width: "20px", height: "20px", color: "#a78bfa", animation: "spin 1s linear infinite" }} /></div></div>}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "16px", borderTop: "1px solid #374151" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Escribe tu pregunta..."
                style={{ flex: 1, padding: "12px 16px", borderRadius: "12px", border: "1px solid #374151", background: "#1f2937", color: "#fff", fontSize: "14px", outline: "none" }}
              />
              <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} style={{ padding: "12px 16px", borderRadius: "12px", background: input.trim() && !isLoading ? "#7c3aed" : "#374151", border: "none", cursor: input.trim() && !isLoading ? "pointer" : "not-allowed" }}>
                <Send style={{ width: "18px", height: "18px", color: "#fff" }} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
