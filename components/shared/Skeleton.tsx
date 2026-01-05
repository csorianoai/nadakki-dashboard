interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({ 
  className = "", 
  variant = "rectangular",
  width,
  height 
}: SkeletonProps) {
  const baseStyles = "bg-white/5 animate-pulse";
  
  const variantStyles = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  const style = {
    width: width || "100%",
    height: height || (variant === "text" ? "1em" : "100%"),
  };

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
}

// Skeleton para cards
export function CardSkeleton() {
  return (
    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div>
            <Skeleton variant="text" width={120} height={16} className="mb-2" />
            <Skeleton variant="text" width={80} height={12} />
          </div>
        </div>
        <Skeleton variant="rectangular" width={60} height={24} />
      </div>
      <Skeleton variant="rectangular" height={60} className="mb-4" />
      <div className="flex justify-between">
        <Skeleton variant="text" width={100} height={12} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
}

// Skeleton para tablas
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width="30%" height={14} />
          <Skeleton variant="text" width="20%" height={14} />
          <Skeleton variant="text" width="15%" height={14} />
          <Skeleton variant="rectangular" width={60} height={24} className="ml-auto" />
        </div>
      ))}
    </div>
  );
}
