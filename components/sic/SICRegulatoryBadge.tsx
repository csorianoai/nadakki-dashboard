"use client";

const PROFILES = {
  INDOTEL_DR: {
    label: "INDOTEL · Republica Dominicana",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
  },
  SB_DR: {
    label: "SB · Republica Dominicana",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
  },
  CNBS_HN: {
    label: "CNBS · Honduras",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
  },
  SBS_PE: {
    label: "SBS · Peru",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
  },
  generic: {
    label: "Sin perfil regulatorio",
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/30",
  },
} as const;

type Profile = keyof typeof PROFILES;

interface Props {
  profile: string;
  size?: "sm" | "md";
}

export default function SICRegulatoryBadge({ profile, size = "md" }: Props) {
  const p = PROFILES[profile as Profile] ?? PROFILES.generic;
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${p.color} ${p.bg} ${sizeClass}`}
    >
      {p.label}
    </span>
  );
}
