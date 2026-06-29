"use client";

import { memo, type ReactNode } from "react";
import Link from "next/link";

export const AlertCard = memo(function AlertCard({
  severity,
  title,
  body,
  href,
  action,
}: {
  severity: "high" | "medium" | "low";
  title: string;
  body: string;
  href?: string;
  action?: ReactNode;
}) {
  const colors = {
    high: { c: "var(--ch-danger-text)", bg: "var(--ch-danger-soft)" },
    medium: { c: "var(--ch-warning-text)", bg: "var(--ch-warning-soft)" },
    low: { c: "var(--ch-info-text)", bg: "var(--ch-info-soft)" },
  }[severity];

  const inner = (
    <div
      className="ch-card"
      style={{
        padding: 12,
        borderLeft: `3px solid ${colors.c}`,
        background: colors.bg,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--ch-text-2)", marginTop: 4 }}>{body}</div>
      {action}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline text-inherit">
        {inner}
      </Link>
    );
  }
  return inner;
});
