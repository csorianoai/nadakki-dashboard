'use client';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  color?: string;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
}

export default function StatCard({ value, label, icon, color = '#8b5cf6', trend, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 p-6"
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10" style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
      
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl font-bold text-white font-mono" style={{ color }}>{value}</div>
          <div className="text-sm text-gray-400 mt-1">{label}</div>
          {trend && (
            <div className={`text-xs mt-2 flex items-center gap-1 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}20` }}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
