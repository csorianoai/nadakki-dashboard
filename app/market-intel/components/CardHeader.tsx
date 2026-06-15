"use client";

import type { ReactNode } from "react";

interface CardHeaderProps {
  title: string;
  sub?: string;
  actions?: ReactNode;
  eyebrow?: string;
}

export function CardHeader({ title, sub, actions, eyebrow }: CardHeaderProps) {
  return (
    <div className="card-h">
      <div>
        {eyebrow && (
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            {eyebrow}
          </div>
        )}
        <div className="card-title">{title}</div>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      {actions && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>{actions}</div>
      )}
    </div>
  );
}
