"use client";

import { motion } from "@/lib/motion-stub";
import type { ReactNode } from "react";
import { BP_ACCENTS } from "@/components/proyectos/blueprint-projects-helpers";

/**
 * Superficie "Blueprint vivo" — mismo nivel de fondo oscuro Marketing (`ndk-page`) + grid obra + glow ámbar.
 */
export default function BlueprintProjectsChrome({ children }: { children: ReactNode }) {
  return (
    <div className="ndk-page ndk-fade-in relative min-h-[min(100vh,100%)] overflow-x-hidden text-white">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.085]"
        aria-hidden
        style={{
          backgroundImage: `linear-gradient(${BP_ACCENTS.grid} 1px, transparent 1px), linear-gradient(90deg, ${BP_ACCENTS.grid} 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />
      <div
        className="pointer-events-none absolute -top-32 right-[-20%] z-0 h-[420px] w-[520px] rounded-full opacity-35 blur-[100px]"
        style={{ background: `radial-gradient(circle at 30% 30%, ${BP_ACCENTS.glow}, transparent 55%)` }}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 mx-auto max-w-[88rem]"
      >
        {children}
      </motion.div>
    </div>
  );
}
