"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { CHApiError } from "@/lib/credit-hub/api/client";
import {
  getApplicationMessages,
  getMessageUnreadCount,
  isOperationalEndpointUnavailable,
  patchMarkMessageRead,
  postApplicationMessage,
} from "@/lib/credit-hub/api/operationalClient";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import type { CHActorRole } from "@/lib/credit-hub/api/client";

export function ApplicationMessageThread({
  applicationId,
  actorRole,
  applicationContext,
}: {
  applicationId: string;
  actorRole: CHActorRole;
  applicationContext?: {
    applicantName?: string;
    vehicleLabel?: string;
    requestedAmount?: number;
    currency?: string;
  };
}) {
  const { apiTenantId } = useTenant();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const q = useQuery({
    queryKey: ["app-messages", apiTenantId, applicationId],
    queryFn: () => getApplicationMessages({ tenantId: apiTenantId!, applicationId, actorRole }),
    enabled: !!apiTenantId,
    retry: false,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!apiTenantId || !q.data?.messages?.length) return;
    const isDealer = actorRole === "dealer";
    const unread = q.data.messages.filter(
      (m) => !m.read && (isDealer ? m.sender_role === "bank" : m.sender_role === "dealer"),
    );
    if (unread.length === 0) return;
    void Promise.all(
      unread.map((m) => patchMarkMessageRead({ tenantId: apiTenantId, messageId: m.id, actorRole })),
    ).then(() => {
      void qc.invalidateQueries({ queryKey: ["app-messages", apiTenantId, applicationId] });
      void qc.invalidateQueries({ queryKey: ["app-messages-unread", apiTenantId, applicationId, actorRole] });
    });
  }, [apiTenantId, applicationId, actorRole, q.data?.messages, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [q.data?.messages?.length]);

  if (q.error instanceof CHApiError && isOperationalEndpointUnavailable(q.error)) return null;

  const messages = q.data?.messages ?? [];
  const isDealer = actorRole === "dealer";

  const send = async () => {
    const body = text.trim();
    if (!apiTenantId || !body) return;
    setSending(true);
    try {
      await postApplicationMessage({ tenantId: apiTenantId, applicationId, message_text: body, actorRole });
      setText("");
      void qc.invalidateQueries({ queryKey: ["app-messages", apiTenantId, applicationId] });
      void qc.invalidateQueries({ queryKey: ["app-messages-unread", apiTenantId, applicationId, actorRole] });
    } catch (err) {
      forgeToast.error(err instanceof CHApiError ? err.detail : "No se pudo enviar");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ch-card p-4" data-testid="application-message-thread">
      {/* P3: Contexto de la solicitud para dealer */}
      {isDealer && applicationContext ? (
        <div style={{ marginBottom: 12, padding: 12, background: "var(--ch-surface-2)", borderRadius: 8 }}>
          <div className="ch-eyebrow" style={{ marginBottom: 6 }}>Sobre esta solicitud</div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 13 }}>
            <span style={{ color: "var(--ch-text-3)" }}>Solicitante:</span>
            <span style={{ fontWeight: 600 }}>{applicationContext.applicantName || "—"}</span>
            <span style={{ color: "var(--ch-text-3)" }}>Vehículo:</span>
            <span>{applicationContext.vehicleLabel || "—"}</span>
            {applicationContext.requestedAmount != null ? (
              <>
                <span style={{ color: "var(--ch-text-3)" }}>Monto:</span>
                <span className="ch-mono" style={{ fontWeight: 600 }}>
                  {applicationContext.currency || "RD$"}{applicationContext.requestedAmount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                </span>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="mb-3 max-h-80 space-y-2 overflow-y-auto">
        {q.isLoading ? <p className="text-sm text-forgeGray-500">Cargando mensajes…</p> : null}
        {messages.length === 0 && !q.isLoading ? <p className="text-sm text-forgeGray-500">Sin mensajes aún.</p> : null}
        {messages.map((m) => {
          const mine = (isDealer && m.sender_role === "dealer") || (!isDealer && m.sender_role === "bank");
          const senderLabel = m.sender_role === "bank" ? "Banco" : "Concesionario";
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              {!mine ? (
                <div className="text-[10px] font-medium mb-1" style={{ color: "var(--ch-text-3)" }}>
                  {senderLabel}
                </div>
              ) : null}
              <div
                className="max-w-[80%] rounded-lg px-3 py-2 text-sm"
                style={{
                  background: mine ? "var(--ch-persona-soft)" : "var(--ch-surface-2)",
                  color: "var(--ch-text)",
                }}
              >
                {m.message_text}
                <div className="mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleString("es-DO")}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--ch-border)" }}
          placeholder="Escribe un mensaje…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button type="button" className="ch-btn ch-btn-persona ch-btn-sm" disabled={sending || !text.trim()} onClick={() => void send()}>
          <Send className="h-3.5 w-3.5" aria-hidden />
          Enviar
        </button>
      </div>
    </div>
  );
}

export function useMessageUnreadCount(applicationId: string, actorRole: CHActorRole): number | null {
  const { apiTenantId } = useTenant();
  const q = useQuery({
    queryKey: ["app-messages-unread", apiTenantId, applicationId, actorRole],
    queryFn: () => getMessageUnreadCount({ tenantId: apiTenantId!, applicationId, actorRole }),
    enabled: !!apiTenantId,
    retry: false,
    refetchInterval: 30_000,
  });
  if (q.error instanceof CHApiError && isOperationalEndpointUnavailable(q.error)) return null;
  return q.data ?? 0;
}
