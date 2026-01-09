"use client";

import { ReactNode } from "react";

interface SafeMapProps {
  data?: any[];
  children: (item: any, index: number) => ReactNode;
  fallback?: ReactNode;
}

export function SafeMap({ data, children, fallback }: SafeMapProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return fallback || null;
  }
  
  return <>{data.map(children)}</>;
}

export function SafeRender({ condition, children, fallback }: { 
  condition: any; 
  children: ReactNode; 
  fallback?: ReactNode 
}) {
  if (!condition) {
    return fallback || null;
  }
  
  return <>{children}</>;
}
