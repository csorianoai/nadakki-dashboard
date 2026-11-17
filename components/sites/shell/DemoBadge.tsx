"use client";

import React from "react";
import { pick } from "@/lib/sites/copy-util";
import { SHELL } from "@/lib/sites/shell/copy";
import { SIZE, ST } from "@/lib/sites/tokens";
import { useSites } from "./SitesContext";

export function DemoBadge() {
  const { lang } = useSites();
  return (
    <span
      data-testid="badge-demo"
      style={{ background: ST.demoBg, color: ST.demoText, border: `1px solid ${ST.demoText}`, borderRadius: SIZE.radius, padding: "4px 10px", fontWeight: 700, fontSize: SIZE.fontSmall }}
    >
      {pick(SHELL.demo, lang)}
    </span>
  );
}
