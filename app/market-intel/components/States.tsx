"use client";

import type { ReactNode } from "react";
import { Ic, type IconPath } from "./Icons";

interface EmptyStateProps {
  icon: IconPath;
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div
      style={{
        padding: "48px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "var(--mee-surface-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--mee-ink-4)",
        }}
      >
        <Ic d={icon} s={20} w={1.5} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--mee-ink-3)",
          maxWidth: 360,
          lineHeight: 1.5,
        }}
      >
        {body}
      </div>
      {action}
    </div>
  );
}

interface SkeletonRowsProps {
  n?: number;
  h?: number;
}

export function SkeletonRows({ n = 5, h = 16 }: SkeletonRowsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 18 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="sk"
          style={{ height: h, width: `${100 - (i % 3) * 12}%` }}
        />
      ))}
    </div>
  );
}
