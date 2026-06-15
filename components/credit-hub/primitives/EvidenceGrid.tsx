"use client";

import type { LucideIcon } from "lucide-react";
import { DollarSign, FileText, Gauge, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvidenceGridProps, EvidenceItem } from "@/lib/credit-hub/ch-types";

const DEFAULT_ITEMS: EvidenceItem[] = [
  {
    icon: DollarSign,
    title: "Ingresos verificados",
    body: "Depósitos de nómina recurrentes durante 6 meses.",
    source: "SAT · Banco emisor",
    conf: "alto",
  },
  {
    icon: Gauge,
    title: "Buró de crédito",
    body: "Score 720. Sin morosidad activa.",
    source: "Círculo de Crédito",
    conf: "alto",
  },
  {
    icon: Zap,
    title: "Capacidad de pago",
    body: "DTI proyectado 32%. Dentro de política.",
    source: "Cálculo interno",
    conf: "alto",
  },
  {
    icon: FileText,
    title: "Identidad y KYC",
    body: "INE validada. Biometría concordante.",
    source: "INE · listas OFAC/ONU",
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

function resolveConf(item: EvidenceItem): keyof typeof confMap {
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

export function EvidenceGrid({ items, className }: EvidenceGridProps) {
  const data = items ?? DEFAULT_ITEMS;

  return (
    <div
      className={cn(className)}
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(228px, 1fr))", gap: 12 }}
    >
      {data.map((item, i) => {
        const confKey = resolveConf(item);
        const [cc, cl] = confMap[confKey];
        const source = item.source ?? item.sourceLabel ?? "—";
        return (
          <div key={item.id ?? i} className="ch-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <ItemIcon icon={item.icon} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 600, color: cc }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: cc }} />
                {cl}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: "var(--ch-text-2)", lineHeight: 1.5, flex: 1 }}>{item.body}</div>
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
