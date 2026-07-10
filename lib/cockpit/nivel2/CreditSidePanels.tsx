"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCreditAml, fetchDealerRanking, fetchCreditAudit } from "../api/creditHub";
import { DemoPanelBadge } from "../components/DemoPanelBadge";
import { CockpitErrorBoundary } from "../components/ErrorBoundary";
import { PanelError, PanelFrame, PanelSkeleton } from "../components/PanelFrame";

export function CreditSidePanels() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <AmlPanel />
      <RankingPanel />
      <AuditPanel />
    </div>
  );
}

function AmlPanel() {
  const [vals, setVals] = useState({ matches: 0, screenings: 0, reviews: 0 });
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCreditAml("today");
      setVals({ matches: res.data.matches_today ?? 0, screenings: res.data.screenings_today ?? 0, reviews: res.data.open_reviews ?? 0 });
      setIsDemo(res.isDemo);
      if (res.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <CockpitErrorBoundary title="AML">
      <PanelFrame title="Compliance AML (hoy)" badge={isDemo ? <DemoPanelBadge /> : undefined}>
        {loading ? <PanelSkeleton /> : null}
        {!loading && error ? <PanelError message={error} onRetry={load} /> : null}
        {!loading && !error ? (
          <ul className="text-sm space-y-1">
            <li>Coincidencias: <strong>{vals.matches}</strong></li>
            <li>Screenings: <strong>{vals.screenings}</strong></li>
            <li>Revisiones abiertas: <strong>{vals.reviews}</strong></li>
          </ul>
        ) : null}
      </PanelFrame>
    </CockpitErrorBoundary>
  );
}

function RankingPanel() {
  const [dealers, setDealers] = useState<Array<{ dealer_name: string; volume: number }>>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchDealerRanking(5).then((res) => {
      setDealers(res.data.dealers ?? []);
      setIsDemo(res.isDemo);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <PanelFrame title="Top dealers" badge={isDemo ? <DemoPanelBadge /> : undefined}>
      {loading ? <PanelSkeleton /> : (
        <ol className="text-sm space-y-1">
          {dealers.map((d, i) => (
            <li key={d.dealer_name}>{i + 1}. {d.dealer_name} — {d.volume}</li>
          ))}
        </ol>
      )}
    </PanelFrame>
  );
}

function AuditPanel() {
  const [events, setEvents] = useState<Array<{ id: string; action: string; at: string }>>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchCreditAudit(10).then((res) => {
      setEvents(res.data.events ?? []);
      setIsDemo(res.isDemo);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <PanelFrame title="Audit trail" badge={isDemo ? <DemoPanelBadge /> : undefined}>
      {loading ? <PanelSkeleton /> : (
        <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
          {events.map((e) => (
            <li key={e.id}>{e.action} · {new Date(e.at).toLocaleString("es-DO")}</li>
          ))}
        </ul>
      )}
    </PanelFrame>
  );
}
