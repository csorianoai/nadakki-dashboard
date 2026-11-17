"use client";

import { useState } from "react";
import { ErrorAlta, mensajeError, verificarLicencia, type Enviar } from "@/lib/realtor/alta";
import type { Idioma } from "@/lib/realtor/textos";
import { FONT_BODY, RT } from "@/lib/realtor/tokens";

const COPY = {
  es: {
    titulo: "Estado de la licencia",
    pendiente: "Pendiente de verificación",
    verified: "Verificada",
    rejected: "Rechazada",
    verificar: "Verificar licencia",
    rechazar: "Rechazar licencia",
    pregunta: "Solo el broker supervisor o el propietario pueden verificar. ¿Confirmas que revisaste la licencia contra la fuente oficial?",
    confirmar: "Confirmar",
    cancelar: "Cancelar",
    enviando: "Enviando…",
  },
  en: {
    titulo: "License status",
    pendiente: "Pending verification",
    verified: "Verified",
    rejected: "Rejected",
    verificar: "Verify license",
    rechazar: "Reject license",
    pregunta: "Only the supervising broker or the owner can verify. Do you confirm you checked the license against the official source?",
    confirmar: "Confirm",
    cancelar: "Cancel",
    enviando: "Sending…",
  },
};

const BOTON: React.CSSProperties = { minHeight: 44, padding: "0 16px", borderRadius: 8, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink };

type Decision = "verified" | "rejected";

/** Verificacion manual: nunca automatica, siempre con confirmacion; el servidor decide quien puede (403). */
export function LicenciaVerificar({ licenciaId, estado, idioma, enviar, alVerificar }: {
  licenciaId: string;
  estado: string;
  idioma: Idioma;
  enviar?: Enviar;
  alVerificar?: (estado: string) => void;
}) {
  const t = COPY[idioma];
  const [actual, setActual] = useState(estado);
  const [pidiendo, setPidiendo] = useState<Decision | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const etiqueta = actual === "verified" ? t.verified : actual === "rejected" ? t.rejected : t.pendiente;

  async function confirmar() {
    if (!pidiendo) return;
    setOcupado(true);
    setError(null);
    try {
      const r = await verificarLicencia(licenciaId, pidiendo, enviar);
      setActual(r.status);
      setPidiendo(null);
      alVerificar?.(r.status);
    } catch (e) {
      setPidiendo(null);
      setError(mensajeError(e instanceof ErrorAlta ? e.estado : 0, idioma));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div data-testid="licencia-verificar" style={{ marginTop: 12, fontSize: 14 }}>
      <p style={{ margin: 0 }}><strong>{t.titulo}:</strong> <span data-testid="licencia-estado">{etiqueta}</span></p>
      {error ? <p role="alert" style={{ margin: "8px 0 0", color: RT.chipDownText }}>{error}</p> : null}
      {actual === "pending_verification" && !pidiendo ? (
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button type="button" style={BOTON} onClick={() => setPidiendo("verified")}>{t.verificar}</button>
          <button type="button" style={BOTON} onClick={() => setPidiendo("rejected")}>{t.rechazar}</button>
        </div>
      ) : null}
      {pidiendo ? (
        <div role="alertdialog" aria-label={t.titulo} style={{ marginTop: 8, border: `1px solid ${RT.line}`, borderRadius: 8, padding: 12 }}>
          <p style={{ margin: "0 0 8px" }}>{t.pregunta}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" disabled={ocupado} style={BOTON} onClick={confirmar}>{ocupado ? t.enviando : t.confirmar}</button>
            <button type="button" disabled={ocupado} style={BOTON} onClick={() => setPidiendo(null)}>{t.cancelar}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
