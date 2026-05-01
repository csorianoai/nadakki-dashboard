"use client";

import { useEffect, useState } from "react";

interface CountUpNumberProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function CountUpNumber({ value, duration = 1.5, className, prefix = "", suffix = "" }: CountUpNumberProps) {
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const to = value;
    const ms = duration * 1000;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - (1 - p) * (1 - p);
      const cur = from + (to - from) * eased;
      setDisplay(`${prefix}${Math.round(cur).toLocaleString("es-DO")}${suffix}`);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, prefix, suffix]);

  return <span className={className}>{display}</span>;
}
