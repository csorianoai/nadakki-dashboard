'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Home, LayoutDashboard } from 'lucide-react';

interface NavigationBarProps {
  title?: string;
  backHref?: string;
  showBreadcrumb?: boolean;
  children?: React.ReactNode;
}

export default function NavigationBar({ title, backHref, children }: NavigationBarProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
          title="Atras"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.forward()}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
          title="Adelante"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <Link
          href="/"
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all"
          title="Dashboard"
        >
          <Home className="w-4 h-4" />
        </Link>
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
