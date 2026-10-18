import React from "react";
import { ROTULO_DEMO } from "@/lib/leads/demo-data";

/** Envuelve datos fijos con el badge DEMO visible. */
export default function DemoPanel({ children }: { children: React.ReactNode }) {
  return (
    <div data-demo="true">
      <p data-testid="badge-demo" className="mb-3 text-xs font-semibold text-amber-400">{ROTULO_DEMO}</p>
      {children}
    </div>
  );
}
