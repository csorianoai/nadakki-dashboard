"use client";

import Link from "next/link";

export default function SegmentInsightsPage() {
  const data = [
    { name: "All Users", count: 10000 },
    { name: "Active", count: 7500 },
    { name: "Churned", count: 2500 },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Segment Insights</h1>
        <Link href="/segments" className="text-purple-400 hover:underline">Back</Link>
      </div>
      <div className="space-y-4">
        {(data || []).map((item, i) => (
          <div key={i} className="p-4 bg-gray-800 rounded-lg flex justify-between">
            <span>{item.name}</span>
            <span className="text-cyan-400">{item.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
