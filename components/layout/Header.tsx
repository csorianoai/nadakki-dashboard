'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CORES_CONFIG } from '@/config/cores';

interface HeaderProps {
  title: string;
  subtitle?: string;
  coreColor?: string;
}

interface SearchResult {
  type: 'core' | 'agent';
  id: string;
  name: string;
  coreId?: string;
  coreName?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nadakki-ai-suite.onrender.com';

export default function Header({ title, subtitle, coreColor = '#00E5FF' }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allAgents, setAllAgents] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cargar todos los agentes una vez
  useEffect(() => {
    async function loadAllAgents() {
      const agents: SearchResult[] = [];
      const coreIds = Object.keys(CORES_CONFIG);
      
      for (const coreId of coreIds) {
        try {
          const res = await fetch(`${API_URL}/api/catalog/${coreId}/agents`);
          if (res.ok) {
            const data = await res.json();
            const coreConfig = CORES_CONFIG[coreId];
            data.agents?.forEach((agent: any) => {
              agents.push({
                type: 'agent',
                id: agent.id,
                name: agent.name,
                coreId: coreId,
                coreName: coreConfig.displayName
              });
            });
          }
        } catch (e) {}
      }
      setAllAgents(agents);
    }
    loadAllAgents();
  }, []);

  // Atajo de teclado Cmd+K / Ctrl+K
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

  // Focus en input cuando abre
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  // Filtrar resultados
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered: SearchResult[] = [];
    
    // Buscar en cores
    Object.values(CORES_CONFIG).forEach((core) => {
      if (core.displayName.toLowerCase().includes(query) || core.id.includes(query)) {
        filtered.push({
          type: 'core',
          id: core.id,
          name: core.displayName
        });
      }
    });
    
    // Buscar en agentes
    allAgents.forEach((agent) => {
      if (agent.name.toLowerCase().includes(query) || agent.id.includes(query)) {
        filtered.push(agent);
      }
    });
    
    setResults(filtered.slice(0, 10));
  }, [searchQuery, allAgents]);

  function handleSelect(result: SearchResult) {
    setSearchOpen(false);
    setSearchQuery('');
    if (result.type === 'core') {
      router.push(`/${result.id}`);
    } else {
      router.push(`/${result.coreId}/${result.id}`);
    }
  }

  return (
    <>
      <header className="h-20 glass border-b border-glass-border flex items-center justify-between px-8 sticky top-0 z-40">
        <div>
          <h1 className="text-2xl font-quantum font-bold" style={{ color: coreColor }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-400 font-mono mt-1">{subtitle}</p>
          )}
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

      {/* Modal de busqueda */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          
          <div className="relative w-full max-w-2xl mx-4 glass rounded-2xl border border-glass-border shadow-2xl">
            <div className="flex items-center gap-3 p-4 border-b border-glass-border">
              <span className="text-xl">🔍</span>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cores, agentes..."
                className="flex-1 bg-transparent outline-none text-lg text-white placeholder-gray-500"
              />
              <kbd className="px-2 py-1 text-xs bg-white/10 rounded text-gray-400">ESC</kbd>
            </div>
            
            {results.length > 0 && (
              <div className="max-h-96 overflow-y-auto p-2">
                {results.map((result, i) => (
                  <button
                    key={`${result.type}-${result.id}-${i}`}
                    onClick={() => handleSelect(result)}
                    className="w-full p-3 rounded-xl hover:bg-white/10 flex items-center gap-3 text-left transition-colors"
                  >
                    <span className="text-xl">
                      {result.type === 'core' ? '📦' : '🤖'}
                    </span>
                    <div>
                      <div className="text-white font-medium">{result.name}</div>
                      {result.type === 'agent' && (
                        <div className="text-sm text-gray-400">{result.coreName}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {searchQuery && results.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                No se encontraron resultados para "{searchQuery}"
              </div>
            )}
            
            {!searchQuery && (
              <div className="p-8 text-center text-gray-500">
                Escribe para buscar cores o agentes...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}