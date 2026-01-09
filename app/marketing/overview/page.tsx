"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

export default function MarketingOverviewPage() {
  const { theme } = useTheme();

  const bgCard = theme.colors?.bgCard || "#ffffff";
  const borderColor = theme.colors?.border || "#e5e7eb";
  const textMuted = theme.colors?.textMuted || "#6b7280";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl"
      style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}` }}
    >
      <h2 style={{ color: textMuted }}>Marketing Overview</h2>
    </motion.div>
  );
}
