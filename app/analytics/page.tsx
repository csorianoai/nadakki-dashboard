"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function AnalyticsPage() {
  const { theme } = useTheme();

  const bgCard = theme.colors?.bgCard || "#ffffff";
  const borderColor = theme.colors?.border || "#e5e7eb";
  const textMuted = theme.colors?.textMuted || "#6b7280";

  return (
    <div
      className="p-5 rounded-xl"
      style={{ backgroundColor: bgCard, border: "1px solid " + borderColor }}
    >
      <h2 style={{ color: textMuted }}>Analytics</h2>
    </div>
  );
}
