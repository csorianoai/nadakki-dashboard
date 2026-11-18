"use client";

import React from "react";
import { SIZE, ST } from "@/lib/sites/tokens";

/** Aviso de estado con el motivo en texto. `alert` = error (role="alert"); si no, informativo (role="status"). */
export function Aviso({ testid, title, body, alert }: { testid: string; title: string; body: string; alert?: boolean }) {
  return (
    <section
      data-testid={testid}
      role={alert ? "alert" : "status"}
      style={{ background: alert ? ST.badBg : ST.calloutBg, color: alert ? ST.badText : ST.ink, border: `1px solid ${alert ? ST.badText : ST.calloutLine}`, borderRadius: SIZE.radius, padding: SIZE.pad }}
    >
      <h2 style={{ margin: 0, fontSize: SIZE.fontSub }}>{title}</h2>
      <p style={{ margin: "8px 0 0" }}>{body}</p>
    </section>
  );
}
