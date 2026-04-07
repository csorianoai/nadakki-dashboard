"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

const MODES = {
  AI_ONLY: {
    label: "AI Underwriting",
    color:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-800",
    badge: "bg-purple-600",
    description:
      "Nadakki analyzes bank statements and scores the application autonomously.",
    icon: "\u{1F916}",
  },
  BANK_ONLY: {
    label: "Bank Submission",
    color:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800",
    badge: "bg-blue-600",
    description:
      "Application is submitted to the configured bank adapter for evaluation.",
    icon: "\u{1F3E6}",
  },
  HYBRID: {
    label: "Hybrid (AI + Bank)",
    color:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-600",
    description:
      "AI pre-screens and optimizes before the bank adapter completes the decision.",
    icon: "\u26A1",
  },
} as const;

export default function CreditOverviewPage() {
  const [health, setHealth] = useState<"checking" | "ok" | "error">("checking");

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/v2/credit/health`)
      .then((r) => setHealth(r.ok ? "ok" : "error"))
      .catch(() => setHealth("error"));
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Credit Core
          </h1>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              health === "ok"
                ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                : health === "error"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {health === "ok"
              ? "\u25CF Online"
              : health === "error"
                ? "\u25CF Offline"
                : "\u25CF Checking\u2026"}
          </span>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Multi-tenant credit evaluation: AI underwriting, bank adapter, and hybrid
          flows (live data from your API).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {(
          Object.entries(MODES) as [
            keyof typeof MODES,
            (typeof MODES)[keyof typeof MODES],
          ][]
        ).map(([mode, config]) => (
          <Link
            key={mode}
            href={`/credit/new?mode=${mode}`}
            className={`rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer ${config.color}`}
          >
            <div className="text-2xl mb-3">{config.icon}</div>
            <div className="font-semibold text-sm mb-1">{config.label}</div>
            <p className="text-xs opacity-75 leading-relaxed">
              {config.description}
            </p>
            <div className="mt-4">
              <span
                className={`text-white text-xs px-3 py-1 rounded-full ${config.badge}`}
              >
                Start →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          No list API yet — start a new application to see real decisions and
          events.
        </p>
        <Link
          href="/credit/new"
          className="inline-block bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
        >
          New Application
        </Link>
      </div>
    </div>
  );
}
