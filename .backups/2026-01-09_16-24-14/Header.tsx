'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchModal from '@/components/ui/SearchModal';

interface HeaderProps {
  title: string;
  subtitle?: string;
  coreColor?: string;
}

export default function Header({ title, subtitle, coreColor = '#00E5FF' }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-20 glass border-b border-glass-border flex items-center justify-between px-8 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-lg glass border border-glass-border hover:border-cyan-500 hover:bg-cyan-500/10 transition-all flex items-center justify-center text-gray-400 hover:text-cyan-400"
              title="Atras"
            >
              ←
            </button>
            <button
              onClick={() => router.forward()}
              className="w-9 h-9 rounded-lg glass border border-glass-border hover:border-cyan-500 hover:bg-cyan-500/10 transition-all flex items-center justify-center text-gray-400 hover:text-cyan-400"
              title="Adelante"
            >
              →
            </button>
            <Link href="/">
              <button
                className="w-9 h-9 rounded-lg glass border border-glass-border hover:border-purple-500 hover:bg-purple-500/10 transition-all flex items-center justify-center text-gray-400 hover:text-purple-400"
                title="Dashboard Principal"
              >
                🏠
              </button>
            </Link>
          </div>
          
          {/* Title */}
          <div className="ml-2">
            <h1 className="text-2xl font-quantum font-bold" style={{ color: coreColor }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-400 font-mono mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="px-4 py-2 rounded-xl glass border border-glass-border hover:border-core-financial transition-colors flex items-center gap-2"
          >
            <span>🔍</span>
            <span className="text-sm text-gray-400">Buscar...</span>
            <kbd className="px-2 py-0.5 text-xs bg-white/10 rounded">⌘K</kbd>
          </button>
          <button
            onClick={() => router.push('/execute')}
            className="px-6 py-2 rounded-xl font-bold text-black transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${coreColor}, #C77DFF)` }}
          >
            🚀 Ejecutar
          </button>
        </div>
      </header>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
