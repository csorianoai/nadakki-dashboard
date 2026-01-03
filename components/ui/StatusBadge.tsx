'use client';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'warning' | 'error' | 'loading';
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CONFIG = {
  active: { color: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10', label: 'Activo' },
  inactive: { color: 'bg-gray-500', text: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Inactivo' },
  warning: { color: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Advertencia' },
  error: { color: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10', label: 'Error' },
  loading: { color: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Cargando' },
};

const SIZES = {
  sm: { dot: 'w-1.5 h-1.5', text: 'text-[10px]', padding: 'px-1.5 py-0.5' },
  md: { dot: 'w-2 h-2', text: 'text-xs', padding: 'px-2 py-1' },
  lg: { dot: 'w-2.5 h-2.5', text: 'text-sm', padding: 'px-3 py-1.5' },
};

export default function StatusBadge({ status, label, pulse = true, size = 'md' }: StatusBadgeProps) {
  const config = CONFIG[status];
  const sizeConfig = SIZES[size];
  
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full ${config.bg} ${sizeConfig.padding}`}>
      <div className={`rounded-full ${config.color} ${sizeConfig.dot} ${pulse && status === 'active' ? 'animate-pulse' : ''} ${status === 'loading' ? 'animate-ping' : ''}`} />
      <span className={`font-medium ${config.text} ${sizeConfig.text}`}>
        {label || config.label}
      </span>
    </div>
  );
}
