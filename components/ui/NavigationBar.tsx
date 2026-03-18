'use client';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

interface NavigationBarProps {
  title?: string;
  backHref?: string;
  showBreadcrumb?: boolean;
  children?: React.ReactNode;
}

export default function NavigationBar({ title, backHref, children }: NavigationBarProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        {backHref && (
          <Link
            href={backHref}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all"
            title="Volver"
          >
            <LayoutDashboard className="w-4 h-4" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
