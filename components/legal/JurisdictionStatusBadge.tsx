"use client";

import React from "react";

interface JurisdictionStatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  production: { label: "Producción", color: "bg-green-100 text-green-800" },
  beta: { label: "Beta", color: "bg-blue-100 text-blue-800" },
  skeleton: { label: "Esqueleto", color: "bg-yellow-100 text-yellow-800" },
  unknown: { label: "Desconocido", color: "bg-gray-100 text-gray-600" },
};

export function JurisdictionStatusBadge({ status, className = "" }: JurisdictionStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;

  return (
    <span
      data-testid="jurisdiction-status-badge"
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
}
