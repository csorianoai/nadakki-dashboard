'use client';

import AgentsPanel from './components/AgentsPanel';

export default function AdvertisingPage() {
  const platforms = [
    { name: 'Google Ads', href: '/advertising/google-ads', icon: '🔍' },
    { name: 'Meta Ads', href: '/advertising/meta-ads', icon: '📘' },
    { name: 'LinkedIn Ads', href: '/advertising/linkedin-ads', icon: '💼' },
    { name: 'TikTok Ads', href: '/advertising/tiktok-ads', icon: '🎵' }
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8'>
      <div className='mb-12'>
        <h1 className='text-5xl font-bold text-slate-900 mb-2'>Advertising Manager</h1>
        <p className='text-lg text-slate-600'>Multi-platform advertising with AI agents</p>
      </div>

      <div className='mb-8 p-6 bg-green-50 rounded-lg border-2 border-green-200'>
        <h2 className='text-2xl font-bold text-green-900'>✅ System Status</h2>
        <p className='text-green-700'>Backend: Connected • 5 Agents Active • Multi-tenant Ready</p>
      </div>

      <div className='grid grid-cols-1 gap-8'>
        <AgentsPanel />

        <div className='mt-8'>
          <h2 className='text-2xl font-bold text-slate-900 mb-6'>Advertising Platforms</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {platforms.map((platform) => (
              
                key={platform.name}
                href={platform.href}
                className='p-6 bg-blue-50 rounded-lg border-2 border-blue-200 hover:shadow-lg transition'
              >
                <div className='text-4xl mb-3'>{platform.icon}</div>
                <p className='font-bold text-lg'>{platform.name}</p>
              </a>
            ))}
          </div>
        </div>

        <div className='mt-8 p-6 bg-slate-900 text-white rounded-lg'>
          <h2 className='text-2xl font-bold mb-4'>API Documentation</h2>
          
            href='https://nadakki-ai-suite.onrender.com/docs'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600'
          >
            📚 View API Docs
          </a>
        </div>
      </div>
    </div>
  );
}
