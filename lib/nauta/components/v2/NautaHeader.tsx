"use client";

import { useEffect, useState } from "react";
import { S } from "@/lib/nauta/strings";
import type { NautaViewId } from "./NautaRail";

const VIEW_TITLES: Record<NautaViewId, string> = {
  piso: S.views.piso,
  tablero: S.views.tablero,
  expediente: S.views.expedienteE1,
  "expediente-e2": S.views.expedienteE2,
  super: S.views.super,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function NautaHeader({ view }: { view: NautaViewId }) {
  const [clock, setClock] = useState("00:00:00");
  const title = VIEW_TITLES[view];
  const eyebrow = title.split(" · ")[0] ?? title;

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="top">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </div>
      <div className="spacer" />
      <div className="search">
        <span aria-hidden>⌕</span>
        <input type="search" placeholder={S.header.searchPlaceholder} aria-label={S.header.searchPlaceholder} />
      </div>
      <div className="clock">
        <span className="pulse" aria-hidden />
        <span>
          {S.header.clockPrefix} <span className="mono">{clock}</span> {S.header.clockSuffix}
        </span>
      </div>
      <button type="button" className="iconbtn" aria-label="Notificaciones">
        ◔
      </button>
    </header>
  );
}
