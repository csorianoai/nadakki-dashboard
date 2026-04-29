"use client";

import { useState } from "react";
import { useLegalQuickCheck } from "@/hooks/useLegal";
import { DemoAcceptanceModal } from "@/components/legal/DemoAcceptanceModal";
import { DecisionBadge } from "@/components/legal/DecisionBadge";
import { CitationBadge } from "@/components/legal/CitationBadge";
import { AuditTrailCard } from "@/components/legal/AuditTrailCard";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";
import { LlmModeNotice } from "@/components/legal/LlmModeNotice";
import type { LegalQuickCheckResponse } from "@/lib/legal-api";

interface Message {
  role: "user" | "assistant";
  content: string;
  resultado?: LegalQuickCheckResponse;
}

const WATERMARK =
  "Generado por Nadakki Legal AI (DEMO). No constituye consejo legal. Validar con abogado autorizado.";

export default function ResearchPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { loading, submit, tenantMissing } = useLegalQuickCheck();

  const handleSend = async () => {
    if (!input.trim()) return;
    const consulta = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: consulta }]);

    try {
      const r = await submit({
        tipo_solicitud: "consulta_legal",
        consulta,
        jurisdiccion: "DO",
      });
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: r.analisis || "Sin análisis disponible",
          resultado: r,
        },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${msg}` }]);
    }
  };

  const handleCopy = (msg: Message) => {
    const watermarked = `${msg.content}\n\n---\n${WATERMARK}`;
    void navigator.clipboard.writeText(watermarked);
  };

  return (
    <>
      <DemoAcceptanceModal />

      <div className="space-y-4">
        <h2 className="text-2xl font-medium">Consulta legal</h2>
        <LlmModeNotice resultado={null} />
        <p className="text-sm text-slate-600">
          Conversación con asistente legal automatizado. Las respuestas requieren revisión profesional.
        </p>
        {tenantMissing && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Selecciona un tenant en el selector global para enviar consultas al Legal Core.
          </p>
        )}

        <div className="bg-white rounded-lg shadow border min-h-[500px] flex flex-col">
          <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[600px]">
            {messages.length === 0 && (
              <p className="text-slate-500 text-center py-12">
                Inicia tu consulta. Ejemplos:
                <br />
                <span className="text-sm italic">
                  &quot;¿Cómo se calcula prescripción de deuda hipotecaria?&quot;
                  <br />
                  &quot;Requisitos contrato préstamo en RD&quot;
                  <br />
                  &quot;Diferencia entre garantía real y personal&quot;
                </span>
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[70%]"
                      : "bg-slate-100 text-slate-900 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] space-y-3"
                  }
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.resultado && (
                    <div className="space-y-2 pt-2 border-t border-slate-300">
                      <LlmModeNotice resultado={m.resultado} />
                      <DecisionBadge decision={m.resultado.decision} />

                      {(m.resultado.citas?.length ?? 0) > 0 && (
                        <div>
                          <strong className="text-xs">Citas legales:</strong>{" "}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {m.resultado.citas!.map((c, idx) => (
                              <CitationBadge
                                key={idx}
                                citation={c}
                                verified={m.resultado!.citas_verificadas?.includes(c) ?? false}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {(m.resultado.codigos_razon?.length ?? 0) > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-slate-600">
                            {m.resultado.codigos_razon!.length} códigos de razón
                          </summary>
                          <ul className="mt-2 space-y-1 ml-2">
                            {m.resultado.codigos_razon!.map((c, idx) => (
                              <li key={idx}>
                                <code className="font-mono">{c.codigo}</code> — {c.descripcion}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}

                      <AuditTrailCard trazabilidad={m.resultado.trazabilidad_auditoria} />

                      <button
                        type="button"
                        onClick={() => handleCopy(m)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Copiar respuesta (con watermark DEMO)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-2">
                  <span className="text-slate-500">Analizando consulta...</span>
                </div>
              </div>
            )}
          </div>
          <div className="border-t p-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Escribe tu consulta legal..."
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:border-blue-500"
              disabled={loading || tenantMissing}
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={loading || !input.trim() || tenantMissing}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>

        <LegalDisclaimer variant="compact" />
      </div>
    </>
  );
}
