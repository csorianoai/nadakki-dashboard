"use client";

import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/contexts/ThemeContext";

export default function SegmentsPage() {
  const { theme } = useTheme();

  const bgPrimary = theme.colors?.bgPrimary || "#f9fafb";
  const borderColor = theme.colors?.border || "#e5e7eb";

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: bgPrimary }}
    >
      <Sidebar />
      <main
        className="flex-1 ml-80 p-6"
        style={{ borderLeft: "1px solid " + borderColor }}
      >
        <h2>Segments</h2>
      </main>
    </div>
  );
}
