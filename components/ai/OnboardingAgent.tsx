"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Bot, X, Send, Loader2, Minimize2, Maximize2, 
  Lightbulb, Sparkles, BookOpen, Zap, MessageCircle,
  ThumbsUp, ThumbsDown, RefreshCw
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

interface Message {
  id: string;
  logId?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  source?: "system" | "llm" | "hybrid" | "greeting";
  suggestions?: string[];
  feedback?: "positive" | "negative" | null;
}

const INITIAL_SUGGESTIONS = [
  "¿Cómo funciona Campaign Optimization?",
  "Explícame los workflows disponibles",
  "¿Cómo ejecuto mi primer workflow?"
];

export default function OnboardingAgent() {
  const { tenantId, settings } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !hasInitialized) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: `¡Hola! 👋 Soy el **NADAKKI AI Copilot**.

Estás en **${settings.name}**. Puedo ayudarte con:

- **Workflows** - Los 10 workflows de marketing
- **Agentes** - Los 225 agentes de IA
- **Tutoriales** - Guías paso a paso
- **Preguntas generales** - Marketing y estrategia

¿En qué puedo ayudarte?`,
        timestamp: new Date(),
        source: "greeting",
        suggestions: INITIAL_SUGGESTIONS
      };
      setMessages([welcomeMessage]);
      setHasInitialized(true);
    }
  }, [isOpen, hasInitialized, settings.name]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          sessionId,
          context: {
            tenant_id: tenantId,
            tenant_name: settings.name,
            current_page: typeof window !== "undefined" ? window.location.pathname : "/"
          }
        })
      });

      const data = await response.json();

      // Guardar sessionId
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        logId: data.logId,
        role: "assistant",
        content: data.response || "Lo siento, no pude procesar tu pregunta.",
        timestamp: new Date(),
        source: data.source,
        suggestions: data.suggestions || [],
        feedback: null
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: "Hubo un error de conexión. Por favor intenta de nuevo.",
        timestamp: new Date(),
        suggestions: INITIAL_SUGGESTIONS
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFeedback = async (messageId: string, logId: string, feedback: "positive" | "negative") => {
    console.log('🔔 Sending feedback:', { messageId, logId, feedback });
    
    try {
      const response = await fetch("/api/ai/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "feedback",
          logId,
          feedback
        })
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      // Actualizar UI
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, feedback } : msg
      ));
      
      console.log('✅ UI updated');
    } catch (error) {
      console.error("❌ Error sending feedback:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setHasInitialized(false);
    setSessionId(null);
  };

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-300">$1</strong>')
      .replace(/^• /gm, '<span class="text-purple-400">•</span> ')
      .replace(/^(\d+)\. /gm, '<span class="text-cyan-400">$1.</span> ')
      .replace(/\n/g, '<br/>');
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'system': return <BookOpen className="w-3 h-3 text-purple-400" />;
      case 'llm': return <Sparkles className="w-3 h-3 text-cyan-400" />;
      case 'hybrid': return <Zap className="w-3 h-3 text-green-400" />;
      default: return null;
    }
  };

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'system': return 'NADAKKI';
      case 'llm': return 'Conocimiento General';
      case 'hybrid': return 'NADAKKI + IA';
      default: return '';
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 99999,
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(139, 92, 246, 0.5)",
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 6px 30px rgba(139, 92, 246, 0.7)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(139, 92, 246, 0.5)";
          }}
        >
          <Bot style={{ width: "28px", height: "28px", color: "white" }} />
          <span style={{
            position: "absolute",
            top: "-2px",
            right: "-2px",
            width: "14px",
            height: "14px",
            background: "#22c55e",
            borderRadius: "50%",
            border: "2px solid #111827"
          }} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 99999,
            width: isMinimized ? "320px" : "420px",
            height: isMinimized ? "56px" : "600px",
            maxHeight: "80vh",
            background: "#0f172a",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "all 0.3s ease"
          }}
        >
          {/* Header */}
          <div style={{
            padding: "12px 16px",
            borderBottom: isMinimized ? "none" : "1px solid rgba(255,255,255,0.1)",
            background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                padding: "8px", 
                borderRadius: "10px", 
                background: "rgba(139,92,246,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Bot style={{ width: "20px", height: "20px", color: "#a78bfa" }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "white" }}>
                  NADAKKI AI Copilot
                </h3>
                {!isMinimized && (
                  <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
                    {settings.name}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {!isMinimized && (
                <button
                  onClick={resetChat}
                  title="Reiniciar chat"
                  style={{
                    padding: "6px",
                    borderRadius: "8px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  <RefreshCw style={{ width: "14px", height: "14px", color: "#9ca3af" }} />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                style={{
                  padding: "6px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                {isMinimized ? 
                  <Maximize2 style={{ width: "14px", height: "14px", color: "#9ca3af" }} /> : 
                  <Minimize2 style={{ width: "14px", height: "14px", color: "#9ca3af" }} />
                }
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: "6px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <X style={{ width: "14px", height: "14px", color: "#9ca3af" }} />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div style={{ 
                flex: 1, 
                overflowY: "auto", 
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    style={{ 
                      display: "flex", 
                      flexDirection: "column",
                      alignItems: message.role === "user" ? "flex-end" : "flex-start"
                    }}
                  >
                    {/* Source indicator */}
                    {message.role === "assistant" && message.source && message.source !== "greeting" && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginBottom: "4px",
                        paddingLeft: "4px"
                      }}>
                        {getSourceIcon(message.source)}
                        <span style={{ fontSize: "10px", color: "#6b7280" }}>
                          {getSourceLabel(message.source)}
                        </span>
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div style={{
                      maxWidth: "90%",
                      padding: "12px 16px",
                      borderRadius: message.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: message.role === "user" 
                        ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" 
                        : "rgba(255,255,255,0.05)",
                      border: message.role === "user" ? "none" : "1px solid rgba(255,255,255,0.1)"
                    }}>
                      <div 
                        style={{ 
                          fontSize: "14px", 
                          color: message.role === "user" ? "white" : "#e5e7eb",
                          lineHeight: 1.6
                        }}
                        dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                      />
                    </div>

                    {/* Feedback buttons */}
                    {message.role === "assistant" && message.logId && message.source !== "greeting" && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "8px",
                        paddingLeft: "4px"
                      }}>
                        <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>
                          ¿Te fue útil?
                        </span>
                        <button
                          onClick={() => sendFeedback(message.id, message.logId!, "positive")}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            background: message.feedback === "positive" 
                              ? "rgba(34,197,94,0.3)" 
                              : "rgba(34,197,94,0.1)",
                            border: message.feedback === "positive"
                              ? "1px solid #22c55e"
                              : "1px solid rgba(34,197,94,0.3)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            if (message.feedback !== "positive") {
                              e.currentTarget.style.background = "rgba(34,197,94,0.2)";
                              e.currentTarget.style.borderColor = "rgba(34,197,94,0.5)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (message.feedback !== "positive") {
                              e.currentTarget.style.background = "rgba(34,197,94,0.1)";
                              e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)";
                            }
                          }}
                        >
                          <ThumbsUp style={{ 
                            width: "14px", 
                            height: "14px", 
                            color: message.feedback === "positive" ? "#22c55e" : "#4ade80" 
                          }} />
                          <span style={{ 
                            fontSize: "11px", 
                            color: message.feedback === "positive" ? "#22c55e" : "#4ade80",
                            fontWeight: 500
                          }}>
                            Sí
                          </span>
                        </button>
                        <button
                          onClick={() => sendFeedback(message.id, message.logId!, "negative")}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            background: message.feedback === "negative" 
                              ? "rgba(239,68,68,0.3)" 
                              : "rgba(239,68,68,0.1)",
                            border: message.feedback === "negative"
                              ? "1px solid #ef4444"
                              : "1px solid rgba(239,68,68,0.3)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            if (message.feedback !== "negative") {
                              e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                              e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (message.feedback !== "negative") {
                              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                              e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                            }
                          }}
                        >
                          <ThumbsDown style={{ 
                            width: "14px", 
                            height: "14px", 
                            color: message.feedback === "negative" ? "#ef4444" : "#f87171" 
                          }} />
                          <span style={{ 
                            fontSize: "11px", 
                            color: message.feedback === "negative" ? "#ef4444" : "#f87171",
                            fontWeight: 500
                          }}>
                            No
                          </span>
                        </button>
                      </div>
                    )}
                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "6px",
                        marginTop: "8px",
                        width: "100%",
                        maxWidth: "90%"
                      }}>
                        {message.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(suggestion)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "10px",
                              background: "rgba(139,92,246,0.1)",
                              border: "1px solid rgba(139,92,246,0.3)",
                              color: "#c4b5fd",
                              fontSize: "12px",
                              textAlign: "left",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(139,92,246,0.2)";
                              e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(139,92,246,0.1)";
                              e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)";
                            }}
                          >
                            <Lightbulb style={{ width: "12px", height: "12px", color: "#fbbf24", flexShrink: 0 }} />
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9ca3af" }}>
                    <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: "13px" }}>Pensando...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: "12px 16px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.2)",
                flexShrink: 0
              }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Pregúntame lo que quieras..."
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      fontSize: "14px",
                      outline: "none"
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    }}
                  />
                  <button 
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      background: input.trim() && !isLoading 
                        ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" 
                        : "rgba(255,255,255,0.1)",
                      border: "none",
                      cursor: input.trim() && !isLoading ? "pointer" : "not-allowed"
                    }}
                  >
                    <Send style={{ width: "18px", height: "18px", color: "white" }} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}