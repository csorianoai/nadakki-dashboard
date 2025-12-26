'use client';

import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  coreColor?: string;
}

export default function Header({ title, subtitle, coreColor = '#00E5FF' }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-20 glass border-b border-glass-border flex items-center justify-between px-8 sticky top-0 z-40">
      <div>
        <h1 
          className="text-2xl font-quantum font-bold"
          style={{ color: coreColor }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-400 font-mono mt-1">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="px-4 py-2 rounded-xl glass border border-glass-border hover:border-core-financial transition-colors flex items-center gap-2"
        >
          <span>🔍</span>
          <span className="text-sm text-gray-400">Buscar...</span>
          <kbd className="px-2 py-0.5 text-xs bg-white/10 rounded">⌘K</kbd>
        </button>

        {/* Execute Button */}
        <button
          className="px-6 py-2 rounded-xl font-bold text-black transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${coreColor}, #C77DFF)` }}
        >
          🚀 Ejecutar
        </button>
      </div>
    </header>
  );
}
