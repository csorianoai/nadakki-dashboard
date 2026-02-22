import Link from 'next/link';

export default function AdvertisingPage() {
  const platforms = [
    { name: 'Google Ads', href: '/advertising/google-ads', icon: '💰' },
    { name: 'Meta Ads', href: '/advertising/meta-ads', icon: '📘' },
    { name: 'LinkedIn Ads', href: '/advertising/linkedin-ads', icon: '💼' },
    { name: 'TikTok Ads', href: '/advertising/tiktok-ads', icon: '🎵' },
    { name: 'Vista Unificada', href: '/advertising/unified', icon: '📊' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-12">📢 Hub de Publicidad</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((p) => (
          <Link
            key={p.name}
            href={p.href}
            className="block border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <div className="text-3xl mb-3">{p.icon}</div>
            <h3 className="text-xl font-bold">{p.name}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}

