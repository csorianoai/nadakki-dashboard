'use client';

import AgentsPanel from './components/AgentsPanel';

export default function AdvertisingPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Advertising Manager
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Multi-platform advertising with AI agents
        </p>

        <div className="mb-8 p-6 bg-green-50 rounded-lg border border-green-200">
          <h2 className="text-xl font-bold text-green-900">System Status</h2>
          <p className="text-green-700 mt-2">Backend: Connected • 5 Agents Active</p>
        </div>

        <AgentsPanel />

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Advertising Platforms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/advertising/google-ads" className="p-6 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-lg transition">
              <div className="text-4xl mb-2">🔍</div>
              <p className="font-bold text-blue-900">Google Ads</p>
            </a>
            <a href="/advertising/meta-ads" className="p-6 bg-purple-50 rounded-lg border border-purple-200 hover:shadow-lg transition">
              <div className="text-4xl mb-2">📘</div>
              <p className="font-bold text-purple-900">Meta Ads</p>
            </a>
            <a href="/advertising/linkedin-ads" className="p-6 bg-cyan-50 rounded-lg border border-cyan-200 hover:shadow-lg transition">
              <div className="text-4xl mb-2">💼</div>
              <p className="font-bold text-cyan-900">LinkedIn Ads</p>
            </a>
            <a href="/advertising/tiktok-ads" className="p-6 bg-pink-50 rounded-lg border border-pink-200 hover:shadow-lg transition">
              <div className="text-4xl mb-2">🎵</div>
              <p className="font-bold text-pink-900">TikTok Ads</p>
            </a>
          </div>
        </div>

        <div className="mt-12 p-6 bg-gray-900 text-white rounded-lg">
          <h2 className="text-2xl font-bold mb-4">API Documentation</h2>
          <a href="https://nadakki-ai-suite.onrender.com/docs" target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            View API Docs
          </a>
        </div>
      </div>
    </div>
  );
}
