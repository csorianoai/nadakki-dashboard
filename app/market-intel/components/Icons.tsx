"use client";

import type { CSSProperties, ReactNode } from "react";

export type IconPath = string | string[];

export interface IcProps {
  d: IconPath;
  s?: number;
  w?: number;
  fill?: string;
  style?: CSSProperties;
}

export function Ic({ d, s = 16, w = 1.6, fill, style }: IcProps) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill={fill || "none"}
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

export const ICN = {
  search: "M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
  chevR: "M9 6l6 6-6 6",
  chevD: "M6 9l6 6 6-6",
  chevL: "M15 6l-6 6 6 6",
  arrowR: "M5 12h14M13 6l6 6-6 6",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  arrowDn: "M12 5v14M5 12l7 7 7-7",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12l5 5L20 7",
  plus: "M12 5v14M5 12h14",
  download: "M12 3v12m0 0l-4-4m4 4l4-4M4 21h16",
  external: [
    "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
    "M15 3h6v6",
    "M10 14L21 3",
  ],
  filter: "M3 6h18M6 12h12M10 18h4",
  sliders:
    "M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3M1 14h6M9 8h6M17 16h6",
  alert: [
    "M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
    "M12 9v4",
    "M12 17h.01",
  ],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  shieldCheck: [
    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    "M9 12l2 2 4-4",
  ],
  scale: [
    "M16 3l4 8a4 4 0 0 1-8 0l4-8z",
    "M8 3l-4 8a4 4 0 0 0 8 0L8 3z",
    "M12 3v18",
    "M7 21h10",
  ],
  trending: ["M22 7l-9 9-5-5L2 17", "M16 7h6v6"],
  building: [
    "M3 21h18",
    "M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16",
    "M9 8h.01M13 8h.01M9 12h.01M13 12h.01M9 16h.01M13 16h.01",
  ],
  layers: ["M12 2l9 5-9 5-9-5 9-5z", "M3 12l9 5 9-5", "M3 17l9 5 9-5"],
  file: [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    "M14 2v6h6",
    "M9 13h6",
    "M9 17h6",
  ],
  mapPin: [
    "M12 22s8-7 8-13a8 8 0 0 0-16 0c0 6 8 13 8 13z",
    "M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  ],
  clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 6v6l4 2"],
  info: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 16v-4", "M12 8h.01"],
  dollar: ["M12 1v22", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],
  percent: [
    "M19 5L5 19",
    "M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    "M17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  ],
  users: [
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M23 21v-2a4 4 0 0 0-3-3.9",
    "M16 3.1a4 4 0 0 1 0 7.7",
  ],
  db: [
    "M12 8c5 0 9-1.3 9-3s-4-3-9-3-9 1.3-9 3 4 3 9 3z",
    "M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5",
    "M3 12c0 1.7 4 3 9 3s9-1.3 9-3",
  ],
  flag: ["M4 22V4", "M4 4h13l-2 4 2 4H4"],
  spark: "M12 3l1.9 5.6L19 10l-5.1 1.4L12 17l-1.9-5.6L5 10l5.1-1.4L12 3z",
  briefcase: [
    "M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z",
    "M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
  ],
  target: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    "M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z",
    "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  ],
  globe: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    "M2 12h20",
    "M12 2a14 14 0 0 1 0 20M12 2a14 14 0 0 0 0 20",
  ],
  refresh: [
    "M23 4v6h-6",
    "M1 20v-6h6",
    "M3.5 9a9 9 0 0 1 14.9-3.4L23 10",
    "M20.5 15a9 9 0 0 1-14.9 3.4L1 14",
  ],
  compare: [
    "M9 3v18",
    "M15 3v18",
    "M3 9h6M15 9h6M3 15h6M15 15h6",
  ],
  grip: "M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01",
  bot: [
    "M12 8V4H8",
    "M16 4h-4",
    "M20 8H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2z",
    "M2 14h2",
    "M20 14h2",
    "M9 13v2",
    "M15 13v2",
  ],
  pin: ["M12 17v5", "M9 10.8V4h6v6.8a5 5 0 0 1-6 0z"],
  book: [
    "M4 19.5A2.5 2.5 0 0 1 6.5 17H20",
    "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
  ],
} as const satisfies Record<string, IconPath>;

export type IconName = keyof typeof ICN;
