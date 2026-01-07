"use client";
import { memo } from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
  theme?: any;
}

export const Skeleton = memo(function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
  theme,
}: SkeletonProps) {
  const isLight = theme?.isLight;
  const bgColor = isLight ? "bg-slate-200" : "bg-slate-700/50";
  const animationClasses = animation === "pulse" ? "animate-pulse" : animation === "wave" ? "animate-shimmer" : "";
  const variantClasses = variant === "circular" ? "rounded-full" : variant === "text" ? "rounded" : "rounded-lg";

  return (
    <div
      className={bgColor + " " + animationClasses + " " + variantClasses + " " + className}
      style={{ width, height }}
    />
  );
});

export const CardSkeleton = memo(function CardSkeleton({ theme }: { theme?: any }) {
  const isLight = theme?.isLight;
  const bgCard = isLight ? "bg-white" : "bg-slate-800/50";
  const borderColor = isLight ? "border-slate-200" : "border-slate-700/50";

  return (
    <div className={"p-5 rounded-xl border animate-pulse " + bgCard + " " + borderColor}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton width={80} height={16} theme={theme} />
        <Skeleton variant="circular" width={32} height={32} theme={theme} />
      </div>
      <Skeleton width={120} height={32} className="mb-2" theme={theme} />
      <Skeleton width={100} height={12} theme={theme} />
    </div>
  );
});

export const ChartSkeleton = memo(function ChartSkeleton({ theme }: { theme?: any }) {
  const isLight = theme?.isLight;
  const bgCard = isLight ? "bg-white" : "bg-slate-800/50";
  const borderColor = isLight ? "border-slate-200" : "border-slate-700/50";

  return (
    <div className={"p-6 rounded-xl border animate-pulse " + bgCard + " " + borderColor}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={150} height={20} theme={theme} />
        <Skeleton width={100} height={32} theme={theme} />
      </div>
      <div className="h-64 flex items-end gap-2">
        {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50].map((h, i) => (
          <Skeleton key={i} className="flex-1" height={h + "%"} theme={theme} />
        ))}
      </div>
    </div>
  );
});

export const TableSkeleton = memo(function TableSkeleton({ rows = 5, theme }: { rows?: number; theme?: any }) {
  const isLight = theme?.isLight;
  const bgCard = isLight ? "bg-white" : "bg-slate-800/50";
  const borderColor = isLight ? "border-slate-200" : "border-slate-700/50";

  return (
    <div className={"rounded-xl border overflow-hidden animate-pulse " + bgCard + " " + borderColor}>
      <div className={"p-4 border-b flex gap-4 " + borderColor}>
        <Skeleton width={150} height={16} theme={theme} />
        <Skeleton width={100} height={16} theme={theme} />
        <Skeleton width={120} height={16} theme={theme} />
        <Skeleton width={80} height={16} theme={theme} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={"p-4 border-b last:border-0 flex gap-4 " + borderColor}>
          <Skeleton width={150} height={14} theme={theme} />
          <Skeleton width={100} height={14} theme={theme} />
          <Skeleton width={120} height={14} theme={theme} />
          <Skeleton width={80} height={14} theme={theme} />
        </div>
      ))}
    </div>
  );
});

export const DashboardSkeleton = memo(function DashboardSkeleton({ theme }: { theme?: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} theme={theme} />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <ChartSkeleton theme={theme} />
        <ChartSkeleton theme={theme} />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <TableSkeleton rows={3} theme={theme} />
        <TableSkeleton rows={3} theme={theme} />
        <TableSkeleton rows={3} theme={theme} />
      </div>
    </div>
  );
});

export default Skeleton;