"use client";

import { useState } from "react";
import Link from "next/link";

export default function CampaignsPage() {
  const [campaigns] = useState([
    { id: "1", name: "Summer Sale", status: "active" },
    { id: "2", name: "Black Friday", status: "draft" },
  ]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Link href="/marketing" className="text-purple-400 hover:underline">Back to Marketing</Link>
      </div>
      <div className="space-y-4">
        {(campaigns || []).map((c) => (
          <div key={c.id} className="p-4 bg-gray-800 rounded-lg flex justify-between">
            <span>{c.name}</span>
            <span className="text-sm text-gray-400">{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
