"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void>; children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);

  const indicatorStyle: CSSProperties = {
    opacity: Math.min(1, pull / 80),
    transform: `rotate(${Math.min(180, (pull / 80) * 180)}deg)`,
  };

  const contentStyle: CSSProperties = {
    transform: `translateY(${isRefreshing ? 60 : pull}px)`,
    transition: isRefreshing || pull === 0 ? "transform 180ms ease-out" : "none",
  };

  return (
    <div
      onTouchStart={(event) => {
        if (window.scrollY === 0) startY.current = event.touches[0].clientY;
      }}
      onTouchMove={(event) => {
        if (window.scrollY > 0 || isRefreshing) return;
        const diff = event.touches[0].clientY - startY.current;
        if (diff > 0 && diff < 120) setPull(diff);
      }}
      onTouchEnd={async () => {
        if (pull > 80 && !isRefreshing) {
          setIsRefreshing(true);
          setPull(60);
          try {
            await onRefresh();
          } finally {
            setIsRefreshing(false);
            setPull(0);
          }
        } else {
          setPull(0);
        }
      }}
      className="relative"
    >
      <div style={indicatorStyle} className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forge-primary shadow-lg" aria-hidden="true">
          <RefreshCw className={`h-5 w-5 text-white ${isRefreshing ? "animate-spin" : ""}`} />
        </div>
      </div>
      <div style={contentStyle}>{children}</div>
    </div>
  );
}
