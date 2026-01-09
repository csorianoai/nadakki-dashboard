"use client";

import { useState } from "react";
import Link from "next/link";

export default function CreateTemplatePage() {
  const [name, setName] = useState("");

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Create Template</h1>
        <Link href="/marketing" className="text-purple-400 hover:underline">Back</Link>
      </div>
      <div className="max-w-md">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name"
          className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700"
        />
        <button className="mt-4 w-full p-3 bg-purple-600 rounded-lg hover:bg-purple-700">
          Create Template
        </button>
      </div>
    </div>
  );
}
