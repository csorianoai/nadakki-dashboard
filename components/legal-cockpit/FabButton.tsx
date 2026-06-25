"use client";

import { useState } from "react";

const ACTIONS = [
  { label: "Nueva audiencia", icon: "📅" },
  { label: "Subir documento", icon: "📄" },
  { label: "Consulta rápida", icon: "⚡" },
];

export function FabButton() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Mini-buttons */}
      {open &&
        ACTIONS.map((a, i) => (
          <button
            key={a.label}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium text-white transition-all"
            style={{
              background: "rgba(24,24,27,0.95)",
              border: "1px solid rgba(139,92,246,0.30)",
              backdropFilter: "blur(12px)",
              animation: `ndk-fadeIn 0.15s ease-out ${i * 0.05}s both`,
            }}
          >
            <span>{a.icon}</span>
            {a.label}
          </button>
        ))}

      {/* Main FAB */}
      <button
        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl transition-transform hover:scale-105"
        style={{
          background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
          boxShadow: "0 0 20px rgba(139,92,246,0.4), 0 0 40px rgba(139,92,246,0.15)",
          animation: "fabGlow 3s ease-in-out infinite",
        }}
      >
        <svg
          width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className={`transition-transform ${open ? "rotate-45" : ""}`}
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
