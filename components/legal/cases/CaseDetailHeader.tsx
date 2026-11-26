"use client";

import Link from "next/link";
import genio from "@/messages/es/legal-estudio-genio.json";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { LegalCase } from "@/lib/legal/cases/case-types";
import { MATERIAS } from "@/lib/legal/cases/matter-catalog";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { CaseStateIndicator } from "@/components/legal/cases/CaseStateIndicator";
import { CasePriorityBadge } from "@/components/legal/cases/CasePriorityBadge";
import { CaseConfidenceMeter } from "@/components/legal/cases/CaseConfidenceMeter";
import { CaseRiskBadge } from "@/components/legal/cases/CaseRiskBadge";
import { CaseLockBanner } from "@/components/legal/cases/CaseLockBanner";
import { CaseConflictCheckBanner } from "@/components/legal/cases/CaseConflictCheckBanner";
import { cn } from "@/lib/utils";

const GENERATED_HASH = "#documentos-generados-ia";

export function CaseDetailHeader({
  legalCase,
  onReleaseLock,
}: {
  legalCase: LegalCase;
  onReleaseLock?: () => void;
}) {
  const m = useLegalCasesMessages();
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  useEffect(() => {
    setHash(typeof window !== "undefined" ? window.location.hash : "");
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const base = `/legal/cases/${legalCase.case_id}`;

  // Prefer the real matter (matter_area) saved in the DB over the legacy fallback
  // case_type derived by the wizard. matter_area / case_subtype are returned by the
  // backend on the case detail but are not declared on the read model type.
  const { matter_area, case_subtype } = legalCase as LegalCase & {
    matter_area?: string | null;
    case_subtype?: string | null;
  };
  const legacyTypeLabel = m.case_types[legalCase.case_type] ?? legalCase.case_type;
  const matterEntry =
    matter_area && matter_area !== "unknown"
      ? MATERIAS.find((x) => x.key === matter_area)
      : undefined;
  // Skip the generic "otro" subtype so we don't render "… — Otro (especificar)".
  const subtypeLabel =
    matterEntry && case_subtype && case_subtype !== "otro"
      ? matterEntry.subtypes.find((s) => s.value === case_subtype)?.label_es
      : undefined;
  const typeLabel = matterEntry
    ? subtypeLabel
      ? `${matterEntry.label_es} — ${subtypeLabel}`
      : matterEntry.label_es
    : legacyTypeLabel;

  const navItems = useMemo(
    () =>
      [
        { href: base, segment: "", label: m.nav.overview, danger: false },
        { href: `${base}/timeline`, segment: "timeline", label: m.nav.timeline, danger: false },
        { href: `${base}/documents`, segment: "documents", label: m.nav.documents, danger: false },
        {
          href: `${base}/documents${GENERATED_HASH}`,
          segment: "documents-ia",
          label: m.nav.generated_ia,
          danger: false,
        },
        { href: `${base}/strategy`, segment: "strategy", label: m.nav.strategy, danger: false },
        { href: `${base}/estudio-genio`, segment: "estudio-genio", label: genio.title, danger: false },
        { href: `${base}/deadlines`, segment: "deadlines", label: m.nav.deadlines, danger: false },
        { href: `${base}/issues`, segment: "issues", label: m.nav.issues, danger: false },
        { href: `${base}/risk`, segment: "risk", label: m.nav.risk, danger: false },
        { href: `${base}/snapshots`, segment: "snapshots", label: m.nav.snapshots, danger: false },
        { href: `${base}/related`, segment: "related", label: m.nav.related, danger: false },
        { href: `${base}/archive`, segment: "archive", label: m.nav.archive, danger: true },
      ] as const,
    [m.nav, base]
  );

  const isActive = (item: (typeof navItems)[number]) => {
    if (item.segment === "") {
      return pathname === base || pathname === `${base}/`;
    }
    if (item.segment === "documents-ia") {
      return pathname.startsWith(`${base}/documents`) && hash === GENERATED_HASH;
    }
    if (item.segment === "documents") {
      return pathname.startsWith(`${base}/documents`) && hash !== GENERATED_HASH;
    }
    return pathname.startsWith(`${base}/${item.segment}`);
  };

  const docCount = legalCase.documents?.length ?? 0;
  const deadlineCount = (legalCase.deadlines ?? []).filter((d) => d.status === "active").length;

  return (
    <header className="space-y-4">
      {/* Cabecera compacta (Legal OS / Clio): el contenido de la pestaña —plazos, documentos— queda sobre el pliegue. */}
      <div className="relative rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CaseStateIndicator state={legalCase.state} />
              <CasePriorityBadge priority={legalCase.priority} />
              <CaseRiskBadge profile={legalCase.risk_profile} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{legalCase.title}</h1>
            <p className="text-sm tabular-nums text-slate-600 dark:text-zinc-400">
              {legalCase.case_number_internal} · {typeLabel}
            </p>
            <div className="flex flex-wrap gap-4 text-sm tabular-nums text-slate-600 dark:text-zinc-400">
              <span>
                {m.overview.docs_count}{" "}
                <span className="font-medium text-zinc-200">{docCount}</span>
              </span>
              <span>
                {m.overview.active_deadlines}{" "}
                <span className="font-medium text-zinc-200">{deadlineCount}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500">{m.compliance.ley_91}</p>
          </div>
        </div>
        <CaseConflictCheckBanner actors={legalCase.actors} />
        <CaseLockBanner lock={legalCase.active_lock} onRelease={onReleaseLock} />
        {legalCase.confidence ? <CaseConfidenceMeter confidence={legalCase.confidence} /> : null}
      </div>

      <nav data-compacto="" aria-label="Secciones del expediente" className="flex flex-wrap gap-x-1 border-b border-slate-200 dark:border-zinc-800">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                active
                  ? item.danger
                    ? "border-red-700 font-semibold text-red-800"
                    : "border-blue-700 font-semibold text-blue-800 dark:text-blue-300"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-zinc-400",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
