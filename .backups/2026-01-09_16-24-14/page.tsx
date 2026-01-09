"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Nadakki AI Suite</h1>
      <div className="grid grid-cols-3 gap-4">
        <Link href="/marketing" className="p-4 bg-purple-600 rounded-lg hover:bg-purple-700">Marketing</Link>
        <Link href="/analytics" className="p-4 bg-blue-600 rounded-lg hover:bg-blue-700">Analytics</Link>
        <Link href="/segments" className="p-4 bg-green-600 rounded-lg hover:bg-green-700">Segments</Link>
      </div>
    </div>
  );
}
