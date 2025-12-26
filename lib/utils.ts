// lib/utils.ts - Utility functions

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'text-green-400';
    case 'inactive': return 'text-gray-400';
    case 'error': return 'text-red-400';
    case 'maintenance': return 'text-yellow-400';
    default: return 'text-gray-400';
  }
}

export function getStatusBgColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-500/20 border-green-500/30';
    case 'inactive': return 'bg-gray-500/20 border-gray-500/30';
    case 'error': return 'bg-red-500/20 border-red-500/30';
    case 'maintenance': return 'bg-yellow-500/20 border-yellow-500/30';
    default: return 'bg-gray-500/20 border-gray-500/30';
  }
}
