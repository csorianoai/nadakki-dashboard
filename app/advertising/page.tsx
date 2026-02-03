'use client';

import AgentsPanel from './components/AgentsPanel';

export default function AdvertisingPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold">Advertising Manager</h1>
        <p className="text-gray-600 mt-2">Multi-platform with AI agents</p>
        
        <div className="mt-8 p-6 bg-green-50 rounded border border-green-200">
          <p className="text-green-900">System: Connected and Ready</p>
        </div>

        <div className="mt-8">
          <AgentsPanel />
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Platforms</h2>
          <div className="grid grid-cols-4 gap-4">
            <a href="/advertising/google-ads" className="p-4 bg-blue-50 rounded border">
              <p>🔍 Google Ads</p>
            </a>
            <a href="/advertising/meta-ads" className="p-4 bg-blue-50 rounded border">
              <p>📘 Meta Ads</p>
            </a>
            <a href="/advertising/linkedin-ads" className="p-4 bg-blue-50 rounded border">
              <p>💼 LinkedIn</p>
            </a>
            <a href="/advertising/tiktok-ads" className="p-4 bg-blue-50 rounded border">
              <p>🎵 TikTok</p>
            </a>
          </div>
        </div>

        <div className="mt-12 p-6 bg-gray-900 text-white rounded">
          <h2 className="text-2xl font-bold mb-4">API Docs</h2>
          <a href="https://nadakki-ai-suite.onrender.com/docs" target="_blank" className="px-6 py-3 bg-blue-500 rounded hover:bg-blue-600 inline-block">
            View Docs
          </a>
        </div>
      </div>
    </div>
  );
}
