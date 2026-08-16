"use client";

import type { LucideIcon } from "lucide-react";
import { DollarSign, FileText, Fingerprint, Gauge, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvidenceGridProps, EvidenceItem, IdentityEvidence } from "@/lib/credit-hub/ch-types";

const DEFAULT_ITEMS: EvidenceItem[] = [
  {
    icon: DollarSign,
    title: "Ingresos verificados",
    body: "Depositos de nomina recurrentes durante 6 meses.",
    source: "Entidad emisora",
    conf: "alto",
  },
  {
    icon: Gauge,
    title: "Buro de credito",
    body: "Score consultado. Sin morosidad activa.",
    source: "Buro de credito",
    conf: "alto",
  },
  {
    icon: Zap,
    title: "Capacidad de pago",
    body: "DTI proyectado dentro de politica.",
    source: "Calculo interno",
    conf: "alto",
  },
];

const confMap = {
  alto: ["var(--ch-success)", "Confianza alta"],
  medio: ["var(--ch-warning)", "Confianza media"],
  bajo: ["var(--ch-text-3)", "Confianza baja"],
  high: ["var(--ch-success)", "Confianza alta"],
  medium: ["var(--ch-warning)", "Confianza media"],
  low: ["var(--ch-text-3)", "Confianza baja"],
} as const;

function resolveConf(item: EvidenceItem): keyof typeof confMap | null {
  if (item.conf === null) return null;
  if (item.conf) return item.conf;
  if (item.confidence === "high") return "alto";
  if (item.confidence === "medium") return "medio";
  return "bajo";
}

function ItemIcon({ icon: Icon }: { icon?: LucideIcon }) {
  const Cmp = Icon ?? FileText;
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 7,
        background: "var(--ch-accent-soft)",
        color: "var(--ch-accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Cmp className="h-4 w-4" aria-hidden />
    </div>
  );
}

// ── Identity evidence helpers ──────────────────────────────────────────

function mapLivenessConf(
  status: string | null | undefined,
): "alto" | "medio" | "bajo" {
  if (status === "live") return "alto";
  if (status === "needs_review") return "medio";
  if (status === "spoof") return "bajo";
  return "bajo";
}

function mapFaceMatchConf(
  status: string | null | undefined,
): "alto" | "medio" | "bajo" {
  if (status === "matched") return "alto";
  if (status === "needs_review") return "medio";
  return "bajo";
}

function livenessBodyText(
  liveness: NonNullable<IdentityEvidence["liveness"]>,
): string {
  const score = liveness.pad_score;
  const pct = score != null ? `${Math.round(score * 100)}%` : null;
  switch (liveness.status) {
    case "live":
      return pct ? `Persona viva confirmada (score: ${pct})` : "Persona viva confirmada";
    case "spoof":
      return "Ataque de presentacion detectado";
    case "needs_review":
      return pct ? `Requiere revision manual (score: ${pct})` : "Requiere revision manual";
    default:
      return "Verificacion no aplicable";
  }
}

function faceMatchBodyText(
  fm: NonNullable<IdentityEvidence["face_match"]>,
): string {
  const score = fm.score;
  const pct = score != null ? `${Math.round(score * 100)}%` : null;
  switch (fm.status) {
    case "matched":
      return pct ? `Coincide (score: ${pct})` : "Coincide";
    case "no_match":
      return pct ? `No coincide (score: ${pct})` : "No coincide";
    case "needs_review":
      return "Requiere revision";
    default:
      return "No disponible";
  }
}

function buildIdentityItems(identity: IdentityEvidence): EvidenceItem[] {
  const items: EvidenceItem[] = [];

  // Cedula verification
  if (identity.cedula?.verified) {
    items.push({
      icon: FileText,
      title: "Cedula validada",
      body: identity.cedula.extracted_name
        ? `Cedula coincide con ${identity.cedula.extracted_name}`
        : "Cedula verificada",
      source: "Documentos · OCR",
      conf: "alto",
    });
  }

  // Liveness / PAD
  if (identity.liveness?.status) {
    const liveness = identity.liveness;
    const sourceParts = [liveness.provider ?? "Proveedor"].filter(Boolean);
    if (liveness.evidence_id) {
      sourceParts.push(liveness.evidence_id);
    }
    items.push({
      icon: Shield,
      title: "Verificacion biometrica",
      body: livenessBodyText(liveness),
      source: sourceParts.join(" · "),
      conf: mapLivenessConf(liveness.status),
    });
  }

  // Face match
  if (identity.face_match?.status) {
    const fm = identity.face_match;
    items.push({
      icon: Fingerprint,
      title: "Coincidencia facial",
      body: faceMatchBodyText(fm),
      source: fm.provider ?? "Proveedor",
      conf: mapFaceMatchConf(fm.status),
    });
  }

  // Fallback: if identity provided but no data populated yet
  if (items.length === 0) {
    items.push({
      icon: Fingerprint,
      title: "Identidad y verificacion",
      body: "Verificacion de identidad pendiente",
      source: "Pendiente",
      conf: "bajo",
    });
  }

  return items;
}

// ── Component ──────────────────────────────────────────────────────────

export function EvidenceGrid({ items, identity, className }: EvidenceGridProps) {
  // Explicit items (or defaults) form the base; real identity evidence is
  // appended whenever a dossier `identity` is provided, so callers that pass
  // BOTH (e.g. AnalysisTab) render their items AND the identity evidence.
  const data: EvidenceItem[] = items ? [...items] : [...DEFAULT_ITEMS];
  if (identity) {
    data.push(...buildIdentityItems(identity));
  }

  return (
    <div
      className={cn(className)}
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(228px, 1fr))", gap: 12 }}
      data-testid="evidence-grid"
    >
      {data.map((item, i) => {
        const confKey = resolveConf(item);
        const [cc, cl] = confKey ? confMap[confKey] : [null, null];
        const source = item.source ?? item.sourceLabel ?? "—";
        return (
          <div key={item.id ?? i} className="ch-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <ItemIcon icon={item.icon} />
              {confKey ? (
                <span
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 600, color: cc }}
                  data-testid={`evidence-conf-${confKey}`}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: cc }} />
                  {cl}
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }} data-testid="evidence-title">{item.title}</div>
            <div style={{ fontSize: 12, color: "var(--ch-text-2)", lineHeight: 1.5, flex: 1 }} data-testid="evidence-body">{item.body}</div>
            <div
              className="ch-mono"
              style={{
                fontSize: 10.5,
                color: "var(--ch-text-3)",
                display: "flex",
                alignItems: "center",
                gap: 5,
                borderTop: "1px solid var(--ch-line)",
                paddingTop: 9,
              }}
            >
              <FileText className="h-3 w-3 shrink-0" aria-hidden />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{source}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
