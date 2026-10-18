import { ReactNode } from "react";

/** AGENT_CONTRACT §3: un panel sin backend vivo lleva badge DEMO. */
export default function DemoBadge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div data-demo="true" className={`relative ${className}`}>
      <span className="absolute top-2 right-2 z-10 text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
        DEMO
      </span>
      {children}
    </div>
  );
}
