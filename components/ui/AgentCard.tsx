"use client";
import React from "react";

interface Metric {
  label: string;
  value: string | number;
}

export interface AgentCardProps {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  status: "active" | "inactive" | "pending";
  metrics?: Metric[];
  isSelected?: boolean;
  onSelect?: () => void;
  onExecute?: () => void;
  displayName?: string;
  category?: string;
  coreColor?: string;
}

export function AgentCard({
  id,
  name,
  description,
  icon = "🤖",
  status,
  metrics,
  isSelected = false,
  onSelect,
  onExecute,
  displayName,
  category,
  coreColor,
}: AgentCardProps) {
  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 border-green-200",
    inactive: "bg-gray-100 text-gray-800 border-gray-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  return (
    <div
      onClick={onSelect}
      className={`border-2 rounded-lg p-5 cursor-pointer transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-lg"
          : "border-gray-200 hover:border-blue-300 hover:shadow-md"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="font-bold text-lg">{displayName || name}</h3>
            <p className="text-sm text-gray-600 mt-1">{description || "Sin descripción"}</p>
            {category && (
              <span className="text-xs font-semibold px-2 py-1 mt-2 inline-block bg-gray-100 text-gray-800 rounded-full">
                {category}
              </span>
            )}
          </div>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full border ${
            statusColors[status] || statusColors.inactive
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {metrics && metrics.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 py-3 border-t border-gray-200">
          {metrics.map((metric, idx) => (
            <div key={idx} className="text-center">
              <div className="font-bold text-lg text-blue-600">{metric.value}</div>
              <div className="text-xs text-gray-500">{metric.label}</div>
            </div>
          ))}
        </div>
      )}

      {onExecute && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExecute();
          }}
          className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-semibold"
          type="button"
        >
          Ejecutar
        </button>
      )}
    </div>
  );
}

export default AgentCard;
