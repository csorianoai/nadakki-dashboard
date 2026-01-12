"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Bot, X, Send, Loader2, Minimize2, Maximize2, 
  Lightbulb, Sparkles, BookOpen, Zap,
  ThumbsUp, ThumbsDown, RefreshCw, MessageSquare,
  Brain, Cpu
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
  "¿Cuáles son los tiers de workflows?"
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
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        content: `¡Hola! 👋 Soy **NADA**, tu copiloto de inteligencia artificial.

Estoy aquí para ayudarte a aprovechar al máximo **${settings.name}**.

Puedo asistirte con:
- **Workflows** — Los 10 workflows de marketing automatizado
- **Agentes** — Los 225 agentes de IA especializados  
- **Tutoriales** — Guías paso a paso
- **Estrategia** — Mejores prácticas de marketing

¿Cómo puedo ayudarte hoy?`,
        timestamp: new Date(),
        source: "greeting",
        suggestions: INITIAL_SUGGESTIONS
      };
      setMessages([welcomeMessage]);
      setHasInitialized(true);
    }
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
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
    setIsTyping(true);

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

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      // Simular typing effect
      await new Promise(resolve => setTimeout(resolve, 300));

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
      setIsTyping(false);
    }
  };

  const sendFeedback = async (messageId: string, logId: string, feedback: "positive" | "negative") => {
    try {
      await fetch("/api/ai/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "feedback",
          logId,
          feedback
        })
      });

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, feedback } : msg
      ));
    } catch (error) {
      console.error("Error sending feedback:", error);
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
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/^• /gm, '<span class="text-purple-400 mr-1">•</span>')
      .replace(/^(\d+)\. /gm, '<span class="text-cyan-400 font-medium mr-1">$1.</span>')
      .replace(/\n/g, '<br/>');
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'system': 
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
            <BookOpen className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] font-medium text-purple-300">NADAKKI</span>
          </div>
        );
      case 'llm': 
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30">
            <Brain className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-medium text-cyan-300">IA General</span>
          </div>
        );
      case 'hybrid': 
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
            <Zap className="w-3 h-3 text-green-400" />
            <span className="text-[10px] font-medium text-green-300">Híbrido</span>
          </div>
        );
      default: 
        return null;
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[99999] group"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            
            {/* Button */}
            <div className="relative w-14 h-14 bg-gradient-to-br from-purple-600 via-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300">
              <Bot className="w-7 h-7 text-white" />
            </div>
            
            {/* Status indicator */}
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
            
            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              AI Copilot
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 border-4 border-transparent border-l-gray-800" />
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-[99999] bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized ? 'w-80 h-14' : 'w-[420px] h-[600px] max-h-[80vh]'
          }`}
        >
          {/* Header */}
          <div className={`px-4 py-3 bg-gradient-to-r from-purple-900/50 via-gray-900/50 to-cyan-900/50 border-b border-gray-700/50 flex items-center justify-between ${isMinimized ? '' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  NADA
                  <span className="text-[10px] font-normal text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">AI Copilot</span>
                </h3>
                {!isMinimized && (
                  <p className="text-[11px] text-gray-400">{settings.name}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <button
                  onClick={resetChat}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Reiniciar chat"
                >
                  <RefreshCw className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isMinimized ? 
                  <Maximize2 className="w-4 h-4 text-gray-400 hover:text-white" /> : 
                  <Minimize2 className="w-4 h-4 text-gray-400 hover:text-white" />
                }
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
                  >
                    {/* Source badge */}
                    {message.role === "assistant" && message.source && message.source !== "greeting" && (
                      <div className="mb-1.5 ml-1">
                        {getSourceBadge(message.source)}
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div 
                      className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                        message.role === "user" 
                          ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-md" 
                          : "bg-gray-800/80 border border-gray-700/50 text-gray-100 rounded-bl-md"
                      }`}
                    >
                      <div 
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                      />
                    </div>

                    {/* Feedback buttons */}
                    {message.role === "assistant" && message.logId && message.source !== "greeting" && (
                      <div className="flex items-center gap-2 mt-2 ml-1">
                        <span className="text-[10px] text-gray-500">¿Útil?</span>
                        <button
                          onClick={() => sendFeedback(message.id, message.logId!, "positive")}
                          className={`p-1.5 rounded-lg transition-all ${
                            message.feedback === "positive" 
                              ? "bg-green-500/30 border border-green-500/50" 
                              : "hover:bg-green-500/20 border border-transparent hover:border-green-500/30"
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${
                            message.feedback === "positive" ? "text-green-400" : "text-gray-500 hover:text-green-400"
                          }`} />
                        </button>
                        <button
                          onClick={() => sendFeedback(message.id, message.logId!, "negative")}
                          className={`p-1.5 rounded-lg transition-all ${
                            message.feedback === "negative" 
                              ? "bg-red-500/30 border border-red-500/50" 
                              : "hover:bg-red-500/20 border border-transparent hover:border-red-500/30"
                          }`}
                        >
                          <ThumbsDown className={`w-3.5 h-3.5 ${
                            message.feedback === "negative" ? "text-red-400" : "text-gray-500 hover:text-red-400"
                          }`} />
                        </button>
                      </div>
                    )}

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-col gap-2 mt-3 w-full max-w-[85%]">
                        {message.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(suggestion)}
                            className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all text-left"
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                            <span className="text-xs text-purple-200 group-hover:text-white transition-colors">
                              {suggestion}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-start">
                    <div className="bg-gray-800/80 border border-gray-700/50 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-700/50 bg-gray-900/50">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe tu pregunta..."
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    className={`px-4 rounded-xl flex items-center justify-center transition-all ${
                      input.trim() && !isLoading 
                        ? "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-purple-500/25" 
                        : "bg-gray-800 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* Quick tip */}
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
                  <MessageSquare className="w-3 h-3" />
                  <span>Presiona Enter para enviar</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}