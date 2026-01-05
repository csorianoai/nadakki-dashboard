'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category?: string;
  status: 'active' | 'inactive' | 'error';
  version?: string;
  coreColor?: string;
  onClick?: () => void;
}

export default function AgentCard({
  id,
  displayName,
  description,
  category,
  status,
  version = '3.2.0',
  coreColor = '#00E5FF',
}: AgentCardProps) {
  const pathname = usePathname();
  const coreId = pathname?.split('/')[1] || 'marketing';

  return (
    <Link href={'/' + coreId + '/' + id}>
      <div
        className={cn(
          'glass rounded-xl p-4 cursor-pointer transition-all duration-300',
          'hover:bg-white/10 hover:translate-y-[-2px] hover:scale-[1.02]',
          'border border-transparent hover:border-white/20',
          'group'
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                status === 'active' ? 'bg-green-400 animate-pulse' :
                status === 'error' ? 'bg-red-400' : 'bg-gray-500'
              )}
            />
            <h4 className="font-medium text-white group-hover:text-cyan-400 transition-colors">
              {displayName}
            </h4>
          </div>
          <span className="text-xs font-mono text-gray-500">v{version}</span>
        </div>

        {description && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">{description}</p>
        )}

        <div className="flex items-center justify-between">
          {category && (
            <span
              className="text-xs px-2 py-1 rounded-full bg-white/10"
              style={{ color: coreColor }}
            >
              {category}
            </span>
          )}
          <span
            className="text-xs opacity-0 group-hover:opacity-100 transition-opacity font-medium"
            style={{ color: coreColor }}
          >
            Ejecutar
          </span>
        </div>
      </div>
    </Link>
  );
}
