"use client";

import { useEffect, useState } from "react";

const TARGET = 1247;
const STEP = 37;
const INTERVAL_MS = 26;

export function ResultCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let current = 0;
    const id = window.setInterval(() => {
      current += STEP;
      if (current >= TARGET) {
        setCount(TARGET);
        window.clearInterval(id);
        return;
      }
      setCount(current);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="px-[22px] pb-8">
      <div className="mx-auto max-w-[1440px] text-center md:text-left">
        <p className="font-manrope text-[clamp(30px,4vw,42px)] font-extrabold tabular-nums text-nk-fg">
          {count.toLocaleString("en-US")}
          <span className="ml-2 text-[clamp(18px,2.5vw,24px)] font-semibold text-nk-fg-muted">
            vehículos disponibles
          </span>
        </p>
        <p className="mt-1 text-sm text-nk-fg-subtle">en 32 dealers verificados de RD</p>
      </div>
    </section>
  );
}
