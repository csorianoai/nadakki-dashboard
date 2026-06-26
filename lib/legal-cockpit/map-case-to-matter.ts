// lib/legal-cockpit/map-case-to-matter.ts
// Maps a real LegalCase from the backend to the cockpit's LegalUrgentMatter shape.

import type { LegalCase } from "@/lib/legal/cases/case-types";
import type { LegalUrgentMatter } from "@/lib/legal-cockpit/types";

export function caseToUrgentMatter(c: LegalCase): LegalUrgentMatter {
  const urgency: LegalUrgentMatter["urgency"] =
    c.priority === "critical"
      ? "critical"
      : c.priority === "high"
        ? "warning"
        : c.state === "CLOSED" || c.state === "ARCHIVED"
          ? "blocked"
          : "active";

  // Find the nearest active deadline
  let deadlineDays: number | undefined;
  const now = Date.now();
  const activeDeadlines = (c.deadlines ?? []).filter((d) => d.status === "active");
  if (activeDeadlines.length > 0) {
    const nearest = activeDeadlines.reduce((min, d) => {
      const ms = new Date(d.effective_deadline_date).getTime();
      return ms < min ? ms : min;
    }, Infinity);
    if (Number.isFinite(nearest)) {
      deadlineDays = Math.ceil((nearest - now) / (1000 * 60 * 60 * 24));
      if (deadlineDays < 0) deadlineDays = 0;
    }
  }

  return {
    id: c.case_id,
    caseNumber: c.case_number_internal,
    title: c.title,
    caseType: c.case_type,
    urgency,
    summary: c.description ?? "",
    deadlineDays,
    pendingTasks: [],
    suggestions: [],
    demoData: false,
  };
}
