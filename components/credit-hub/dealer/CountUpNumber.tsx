"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useSpring } from "framer-motion";

interface CountUpNumberProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function CountUpNumber({ value, duration = 1.5, className, prefix = "", suffix = "" }: CountUpNumberProps) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  useMotionValueEvent(spring, "change", (latest) => {
    setDisplay(`${prefix}${Math.round(latest).toLocaleString("es-DO")}${suffix}`);
  });

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
