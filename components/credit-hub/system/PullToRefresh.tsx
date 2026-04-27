"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";

export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void>; children: ReactNode }) {
  const y = useMotionValue(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const opacity = useTransform(y, [0, 80], [0, 1]);
  const rotate = useTransform(y, [0, 80], [0, 180]);

  return (
    <div
      onTouchStart={(event) => {
        if (window.scrollY === 0) startY.current = event.touches[0].clientY;
      }}
      onTouchMove={(event) => {
        if (window.scrollY > 0 || isRefreshing) return;
        const diff = event.touches[0].clientY - startY.current;
        if (diff > 0 && diff < 120) y.set(diff);
      }}
      onTouchEnd={async () => {
        if (y.get() > 80 && !isRefreshing) {
          setIsRefreshing(true);
          y.set(60);
          try {
            await onRefresh();
          } finally {
            setIsRefreshing(false);
            y.set(0);
          }
        } else {
          y.set(0);
        }
      }}
      className="relative"
    >
      <motion.div style={{ opacity }} className="absolute left-1/2 top-2 z-20 -translate-x-1/2">
        <motion.div style={{ rotate }} className="flex h-10 w-10 items-center justify-center rounded-full bg-forge-primary shadow-lg" aria-hidden="true">
          <RefreshCw className={`h-5 w-5 text-white ${isRefreshing ? "animate-spin" : ""}`} />
        </motion.div>
      </motion.div>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
