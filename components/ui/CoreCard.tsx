'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CoreCardProps {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  agentCount: number;
  status: 'active' | 'inactive' | 'maintenance';
}

export default function CoreCard({
  id,
  displayName,
  description,
  icon,
  color,
  gradient,
  agentCount,
  status,
}: CoreCardProps) {
  return (
    <Link href={`/${id}`}>
      <div className="glass rounded-2xl p-6 card-glow cursor-pointer group relative overflow-hidden">
        {/* Top Glow Line */}
        <div 
          className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: gradient }}
        />

        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl relative"
            style={{ background: gradient }}
          >
            <div className="absolute inset-1 bg-quantum-dark rounded-lg" />
            <span className="relative z-10">{icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white group-hover:text-core-financial transition-colors">
              {displayName}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-1">{description}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 rounded-xl bg-white/5">
            <div className="text-xl font-bold font-mono" style={{ color }}>{agentCount}</div>
            <div className="text-xs text-gray-500">Agentes</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5">
            <div className="text-xl font-bold font-mono text-core-ops">99.2%</div>
            <div className="text-xs text-gray-500">Precisión</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5">
            <div className={cn(
              'text-xl font-bold',
              status === 'active' ? 'text-core-ops' : 'text-gray-500'
            )}>
              {status === 'active' ? '●' : '○'}
            </div>
            <div className="text-xs text-gray-500">Estado</div>
          </div>
        </div>

        {/* Hover Arrow */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <span style={{ color }}>→</span>
        </div>
      </div>
    </Link>
  );
}
