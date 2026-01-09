"use client";

import { useState } from "react";
import Link from "next/link";

export default function SegmentBuilderPage() {
  const [segmentName, setSegmentName] = useState("New Segment");

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Segment Builder</h1>
        <Link href="/segments" className="text-purple-400 hover:underline">Back</Link>
      </div>
      <div className="max-w-md">
        <input
          type="text"
          value={segmentName}
          onChange={(e) => setSegmentName(e.target.value)}
          className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 mb-4"
        />
        <button className="w-full p-3 bg-green-600 rounded-lg hover:bg-green-700">
          Save Segment
        </button>
      </div>
    </div>
  );
}
