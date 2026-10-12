"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { filterCenters, SOON, type RealtorCenter } from "@/lib/realtor/centers";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { usePathname } from "next/navigation";

const ITEM: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, minHeight: 44, padding: "0 12px", borderRadius: 12,
  fontSize: 14, fontWeight: 600, textDecoration: "none", color: RT.navText, border: "1px solid transparent",
};
const CHIP: React.CSSProperties = {
  marginLeft: "auto", fontSize: 10.5, fontWeight: 700, color: RT.navMuted, border: `1px solid ${RT.navBorder}`, borderRadius: 999, padding: "2px 8px",
};

function CenterItem({ c, current }: { c: RealtorCenter; current: boolean }) {
  if (!c.href) {
    return (
      <div data-testid={`center-${c.id}`} data-center-state="soon" aria-disabled="true" style={{ ...ITEM, opacity: 0.6, cursor: "not-allowed" }}>
        <span>{c.label}</span><span style={CHIP}>{SOON}</span>
      </div>
    );
  }
  return (
    <Link href={c.href} data-testid={`center-${c.id}`} data-center-state="live" aria-current={current ? "page" : undefined}
      style={{ ...ITEM, background: current ? "rgba(111, 211, 220, 0.2)" : "transparent", borderColor: current ? "rgba(111, 211, 220, 0.4)" : "transparent" }}>
      {c.label}
    </Link>
  );
}

/** Barra lateral de centros (DL10A). Career Director y Smart Calendar quedan «Próximamente» hasta tener backend. */
export function ShellSidebar({ view }: { view: string }) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const centers = filterCenters(query);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav aria-label="Centros" data-testid="shell-sidebar"
      style={{ width: RT.sidebarWidth, flexShrink: 0, background: `linear-gradient(180deg, ${RT.ink} 0%, ${RT.inkDeep} 100%)`, color: RT.navText,
        padding: "20px 14px 14px", position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", gap: 12,
        borderRight: `1px solid ${RT.navBorder}`, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px", font: `700 19px ${FONT_DISPLAY}` }}>
        <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(140deg, ${RT.cyan}, ${RT.teal})` }} />
        <span>Nadakki <span style={{ color: RT.cyan }}>Realtor OS</span></span>
      </div>
      <div data-testid="career-director" aria-disabled="true"
        style={{ display: "flex", flexDirection: "column", gap: 2, padding: 12, borderRadius: 16, border: "1px solid rgba(111, 211, 220, 0.4)", opacity: 0.85,
          background: "linear-gradient(145deg, rgba(111, 211, 220, 0.16), rgba(11, 110, 120, 0.08) 60%, rgba(19, 32, 43, 0.6))" }}>
        <span style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: RT.cyan, fontWeight: 700 }}>Career Director · guía</span>
        <span style={{ fontSize: 12, color: RT.navMuted }}>{SOON}</span>
      </div>
      <div data-testid="smart-calendar" aria-disabled="true"
        style={{ ...ITEM, border: "1px solid rgba(111, 211, 220, 0.2)", background: "rgba(12, 26, 36, 0.6)", justifyContent: "space-between", opacity: 0.85, cursor: "not-allowed" }}>
        <span>Smart Calendar</span><span style={{ ...CHIP, marginLeft: 0 }}>{SOON}</span>
      </div>
      <div>
        <label htmlFor="rt-navq" style={{ position: "absolute", left: -9999 }}>Filtrar centros</label>
        <input id="rt-navq" ref={input} data-testid="center-search" type="search" autoComplete="off" placeholder="Buscar centro · tecla /"
          value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { setQuery(""); e.currentTarget.blur(); } }}
          style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 11, background: RT.navField, border: "1px solid rgba(111, 211, 220, 0.2)", color: RT.white, fontFamily: "inherit", fontSize: 14 }} />
      </div>
      <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {centers.map((c, i) => (
          <div key={c.id} style={{ display: "contents" }}>
            {i === 0 || centers[i - 1].group !== c.group ? (
              <div role="presentation" data-testid="center-group" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: RT.navGroup, fontWeight: 700, margin: "8px 8px 2px" }}>{c.group}</div>
            ) : null}
            <CenterItem c={c} current={!!c.href && !!pathname?.startsWith(c.href)} />
          </div>
        ))}
        {centers.length === 0 ? <p style={{ margin: 8, fontSize: 13, color: RT.navMuted }}>Ningún centro coincide.</p> : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: RT.navMuted, padding: "10px 6px 0", borderTop: `1px solid ${RT.navBorder}` }}>
        <span style={{ marginLeft: "auto", fontWeight: 700, color: RT.cyan, border: `1px solid ${RT.navBorder}`, borderRadius: 999, padding: "2px 8px", textTransform: "capitalize" }}>{view}</span>
      </div>
    </nav>
  );
}
