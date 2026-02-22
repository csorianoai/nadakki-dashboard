"use client";

import { useState, useRef, useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, X, Send, Bot, User, Sparkles, 
  ChevronRight, Search, Loader2, MessageCircle
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

const QUICK_LINKS = [
  { name: "Campaign Builder", href: "/marketing/campaign-builder" },
  { name: "Conexiones Social", href: "/social/connections" },
  { name: "AI Agents", href: "/marketing/agents" },
  { name: "Workflows", href: "/workflows" },
];

const SUGGESTED_QUESTIONS = [
  "Como creo una campana de marketing?",
  "Como conecto mis redes sociales?",
  "Que agentes de IA hay disponibles?",
  "Como funciona el sistema de workflows?",
  "Cuantos agentes tiene la plataforma?",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function HelpCenter() {
  const { tenantId } = useTenant();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hola! Soy el asistente de NADAKKI. Puedo ayudarte con cualquier pregunta sobre la plataforma: campanas, agentes de IA, conexiones sociales, workflows y mas. Como puedo ayudarte?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(API_URL + "/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: "help_center",
          tenant_id: tenantId ?? ""
        })
      });

      let assistantContent = "";
      
      if (response.ok) {
        const data = await response.json();
        assistantContent = data.response || data.message || "Lo siento, no pude procesar tu pregunta.";
      } else {
        assistantContent = getLocalResponse(text);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getLocalResponse(text),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full text-white font-medium shadow-lg shadow-purple-500/25"
      >
        <MessageCircle className="w-5 h-5" />
        <span>Ayuda</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-24 right-6 w-96 h-[600px] bg-[#0a0f1c] border border-white/10 rounded-2xl z-50 flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Asistente NADAKKI</h3>
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> En linea
                    </p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={"flex gap-3 " + (msg.role === "user" ? "flex-row-reverse" : "")}
                  >
                    <div className={"w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 " +
                      (msg.role === "user" ? "bg-purple-500" : "bg-cyan-500/20")}>
                      {msg.role === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <div className={"max-w-[80%] p-3 rounded-2xl text-sm " +
                      (msg.role === "user" 
                        ? "bg-purple-500 text-white rounded-br-md" 
                        : "bg-white/5 text-gray-300 rounded-bl-md")}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl rounded-bl-md">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span className="text-sm text-gray-400">Escribiendo...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Questions */}
              {messages.length === 1 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-gray-500 mb-2">Preguntas sugeridas:</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="px-4 py-2 border-t border-white/5">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {QUICK_LINKS.map((link) => (
                    <Link key={link.name} href={link.href} onClick={() => setOpen(false)}>
                      <span className="text-xs px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded whitespace-nowrap transition-colors">
                        {link.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu pregunta..."
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function getLocalResponse(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes("campana") || q.includes("campaign")) {
    return "Para crear una campana de marketing:\n\n1. Ve a Marketing > Campaign Builder\n2. Sigue el wizard de 4 pasos:\n   - Compose: Define nombre, canal y contenido\n   - Schedule: Programa cuando enviar\n   - Target: Selecciona tu audiencia\n   - Review: Revisa y lanza\n\nPuedes usar IA para generar el contenido automaticamente con el boton 'Generar con IA'.";
  }
  
  if (q.includes("social") || q.includes("red") || q.includes("conectar") || q.includes("facebook") || q.includes("instagram")) {
    return "Para conectar tus redes sociales:\n\n1. Ve a Social > Conexiones\n2. Selecciona la red que quieres conectar\n3. Haz clic en 'Conectar'\n\nNota: Para que funcione completamente, necesitas configurar las credenciales OAuth de cada plataforma en el backend (Facebook Developer, Twitter Developer, etc.).";
  }
  
  if (q.includes("agente") || q.includes("agent")) {
    return "NADAKKI tiene 245 agentes de IA distribuidos en 20 cores especializados:\n\n- Marketing: 36 agentes\n- Legal: 33 agentes\n- Logistica: 24 agentes\n- Contabilidad: 23 agentes\n- Y muchos mas...\n\nCada agente esta entrenado para tareas especificas. Puedes ver todos los agentes en el sidebar izquierdo.";
  }
  
  if (q.includes("workflow")) {
    return "Los workflows son secuencias automatizadas de agentes:\n\n1. Campaign Optimization\n2. Customer Acquisition\n3. Content Performance\n4. Social Media Intelligence\n5. Email Automation\n6. Y 5 mas...\n\nCada workflow combina multiples agentes para completar tareas complejas de forma automatica. Ve a Workflows en el menu principal.";
  }
  
  if (q.includes("cuanto") || q.includes("total")) {
    return "NADAKKI AI Suite cuenta con:\n\n- 245 agentes de IA\n- 20 cores especializados\n- 10 workflows automatizados\n- Soporte multi-tenant\n- Integracion con redes sociales\n\nTodo conectado a APIs reales y listo para produccion.";
  }
  
  if (q.includes("help") || q.includes("ayuda")) {
    return "Puedo ayudarte con:\n\n- Crear campanas de marketing\n- Conectar redes sociales\n- Usar agentes de IA\n- Ejecutar workflows\n- Navegar la plataforma\n\nSimplemente preguntame lo que necesites!";
  }
  
  return "Gracias por tu pregunta. Puedo ayudarte con:\n\n- Campanas de marketing (Campaign Builder)\n- Conexiones de redes sociales\n- Agentes de IA (245 disponibles)\n- Workflows automatizados\n- Navegacion de la plataforma\n\nPor favor, se mas especifico o selecciona una de las opciones de acceso rapido abajo.";
}

