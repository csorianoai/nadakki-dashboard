"use client";

import { motion } from "@/lib/motion-stub";

export function SuccessCheckmark({ size = 48 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.4, ease: "backOut" }}
      aria-label="Éxito"
      role="img"
    >
      <motion.circle
        cx="24"
        cy="24"
        r="22"
        fill="none"
        stroke="var(--forge-success)"
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M14 24 L22 32 L34 18"
        fill="none"
        stroke="var(--forge-success)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      />
    </motion.svg>
  );
}
