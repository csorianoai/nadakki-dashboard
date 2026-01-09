"use client";

import { useState } from "react";

export default function FeatureFlagsPage() {
  const [flags] = useState([
    { id: "1", name: "Dark Mode", enabled: true },
    { id: "2", name: "Beta Features", enabled: false },
  ]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Feature Flags</h1>
      <div className="space-y-4">
        {(flags || []).map((flag) => (
          <div key={flag.id} className="p-4 bg-gray-800 rounded-lg flex justify-between">
            <span>{flag.name}</span>
            <span className={flag.enabled ? "text-green-400" : "text-red-400"}>
              {flag.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
