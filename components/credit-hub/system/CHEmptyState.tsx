"use client";

import Link from "next/link";
import { motion } from "@/lib/motion-stub";
import type { ReactNode } from "react";
import { ForgeButton } from "../primitives/ForgeButton";

interface CHEmptyStateProps {
  illustration?: "no_applications" | "no_results" | "no_data";
  title?: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: ReactNode;
  };
}

function NoApplicationsIllustration() {
  return (
    <motion.svg
      width="200"
      height="160"
      viewBox="0 0 200 160"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      role="img"
      aria-label="Pipeline vacío"
    >
      <defs>
        <linearGradient id="paper-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--forge-primary)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--forge-accent)" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <rect x="60" y="40" width="80" height="100" rx="6" fill="url(#paper-grad)" stroke="var(--forge-primary)" strokeWidth="2" />
      <line x1="70" y1="60" x2="130" y2="60" stroke="var(--forge-text-muted)" strokeWidth="2" />
      <line x1="70" y1="75" x2="120" y2="75" stroke="var(--forge-text-muted)" strokeWidth="2" />
      <line x1="70" y1="90" x2="125" y2="90" stroke="var(--forge-text-muted)" strokeWidth="2" />
      <motion.g animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
        <circle cx="40" cy="40" r="3" fill="var(--forge-accent)" />
        <circle cx="160" cy="60" r="2" fill="var(--forge-primary)" />
        <circle cx="170" cy="100" r="3" fill="var(--forge-accent)" />
      </motion.g>
    </motion.svg>
  );
}

export function CHEmptyState({
  title = "Sin resultados",
  description = "—",
  primaryAction,
}: CHEmptyStateProps) {
  const action = primaryAction ? (
    primaryAction.href ? (
      <Link href={primaryAction.href}>
        <ForgeButton variant="primary" leftIcon={primaryAction.icon}>
          {primaryAction.label}
        </ForgeButton>
      </Link>
    ) : (
      <ForgeButton variant="primary" onClick={primaryAction.onClick} leftIcon={primaryAction.icon}>
        {primaryAction.label}
      </ForgeButton>
    )
  ) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-6">
        <NoApplicationsIllustration />
      </div>
      <h3 className="mb-2 font-display text-xl font-bold text-forge-text">{title}</h3>
      <p className="mb-6 max-w-sm text-forge-text-muted">{description}</p>
      {action}
    </motion.div>
  );
}
