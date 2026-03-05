"use client";

import { useState, useCallback } from "react";

const API_BASE = "";

export interface SicDashboardProps {
  tenantId: string | null;
}

export default function SicDashboard({ tenantId }: SicDashboardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [statementIds, setStatementIds] = useState<string[]>([]);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenant = tenantId || "credicefi";

  const headers = useCallback(
    (overrides?: Record<string, string>) => ({
      "X-Tenant-ID": tenant,
      ...overrides,
    }),
    [tenant]
  );

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setUploadStatus(null);
    setError(null);
  }, []);

  const uploadStatements = useCallback(async () => {
    if (!file) {
      setError("Select a CSV or PDF file.");
      return;
    }
    setLoading(true);
    setError(null);
    setUploadStatus(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/api/v1/sic/statements`, {
        method: "POST",
        headers: { "X-Tenant-ID": tenant },
        body: form,
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `Upload failed: ${res.status}`);
      }
      const data = text ? JSON.parse(text) : {};
      const ids = data.ids ?? data.statement_ids ?? (Array.isArray(data) ? data : []);
      setStatementIds(Array.isArray(ids) ? ids : [ids]);
      setUploadStatus(`Uploaded. ${Array.isArray(ids) ? ids.length : 1} statement(s).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [file, tenant]);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    setAnalysisId(null);
    try {
      const body = statementIds.length > 0 ? { statement_ids: statementIds } : {};
      const res = await fetch(`${API_BASE}/api/v1/sic/analyses`, {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? data?.message ?? `Analysis failed: ${res.status}`);
      }
      const id = data.id ?? data.analysis_id ?? data;
      setAnalysisId(typeof id === "string" ? id : String(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [statementIds, headers]);

  const fetchReport = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/v1/sic/analyses/${id}/report`, {
          headers: headers(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error ?? data?.message ?? `Report failed: ${res.status}`);
        }
        setReport(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [headers]
  );

  const loadReport = useCallback(() => {
    if (analysisId) fetchReport(analysisId);
  }, [analysisId, fetchReport]);

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-6">
      <h1 className="text-2xl font-800 text-slate-100 m-0 mb-2">SIC Dashboard</h1>
      <p className="text-slate-400 text-sm mb-6">
        Upload statements, run analysis, view report. Tenant: {tenant}
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
          Upload CSV or PDF
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv,.pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:text-white file:font-semibold"
          />
          <button
            type="button"
            onClick={uploadStatements}
            disabled={loading || !file}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Uploading…" : "Upload"}
          </button>
        </div>
        {uploadStatus && (
          <p className="mt-2 text-sm text-green-400">{uploadStatus}</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
          Run Analysis
        </h2>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={loading}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Running…" : "Run Analysis"}
        </button>
        {analysisId && (
          <p className="mt-2 text-sm text-slate-300">
            Analysis ID: <span className="font-mono text-cyan-300">{analysisId}</span>
            <button
              type="button"
              onClick={loadReport}
              disabled={loading}
              className="ml-3 text-cyan-400 hover:underline text-sm"
            >
              Load report
            </button>
          </p>
        )}
      </section>

      {report !== null && (
        <section className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
            Report
          </h2>
          <pre className="p-4 rounded-lg bg-slate-800/80 text-slate-200 text-xs overflow-auto max-h-[60vh]">
            {JSON.stringify(report, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
