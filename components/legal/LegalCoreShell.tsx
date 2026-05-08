"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Transición de página para el área principal (sub-nav queda estable). */
export function LegalCoreShell({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="mt-6 min-h-0 w-full flex-1"
    >
      {children}
    </motion.div>
  );
}
