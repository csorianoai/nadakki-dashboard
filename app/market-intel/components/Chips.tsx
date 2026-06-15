"use client";

export const TIER_COLOR: Record<string, string> = {
  Tier1: "var(--mee-tier1)",
  Tier2: "var(--mee-tier2)",
  Tier3: "var(--mee-tier3)",
};

interface ConfChipProps {
  value: string;
}

export function ConfChip({ value }: ConfChipProps) {
  const map: Record<string, [string, string]> = {
    alto: ["pos", "Confianza alta"],
    medio: ["warn", "Confianza media"],
    bajo: ["", "Confianza baja"],
  };
  const [cls, label] = map[value] || ["", value];
  return (
    <span className={`chip ${cls}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

interface LevelChipProps {
  level: string;
}

export function LevelChip({ level }: LevelChipProps) {
  const m: Record<string, [string, string]> = {
    "1": ["info", "Fuente nivel 1"],
    "2": ["", "Fuente nivel 2"],
    "3": ["warn", "Fuente nivel 3 · estimado"],
  };
  const [cls, label] = m[level] || ["", `Nivel ${level}`];
  return <span className={`chip ${cls}`}>{label}</span>;
}

interface CatChipProps {
  category: string;
}

export function CatChip({ category }: CatChipProps) {
  const m: Record<string, [string, string]> = {
    regulatory: ["info", "Regulatorio"],
    market: ["amber", "Mercado"],
    legal: ["legal", "Legal"],
  };
  const [cls, label] = m[category] || ["", category];
  return <span className={`chip ${cls}`}>{label}</span>;
}
