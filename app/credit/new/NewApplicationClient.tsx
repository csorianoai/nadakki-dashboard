"use client";

import {
  createApplication,
  processApplication,
  saveProcessResultToSession,
  type ApplicationMode,
} from "@/app/hooks/useCredit";
import { CreditTenantGate } from "@/app/credit/CreditTenantGate";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

const MODE_LABELS: Record<ApplicationMode, string> = {
  AI_ONLY: "AI Underwriting",
  BANK_ONLY: "Bank Submission",
  HYBRID: "Hybrid (AI + Bank)",
};

const MODE_DESCRIPTIONS: Record<ApplicationMode, string> = {
  AI_ONLY: "Nadakki scores the application using SIC income analysis",
  BANK_ONLY: "Routes directly to the bank adapter",
  HYBRID: "AI pre-screens, then the bank adapter completes the decision",
};

function isApplicationMode(v: string | null): v is ApplicationMode {
  return v === "AI_ONLY" || v === "BANK_ONLY" || v === "HYBRID";
}

function NewApplicationForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qp = searchParams.get("mode");
  const [mode, setMode] = useState<ApplicationMode>(() =>
    isApplicationMode(qp) ? qp : "AI_ONLY"
  );

  useEffect(() => {
    const m = searchParams.get("mode");
    if (isApplicationMode(m)) setMode(m);
  }, [searchParams]);

  const [form, setForm] = useState({
    applicant_name: "",
    monthly_income: "",
    loan_amount: "",
    loan_purpose: "",
  });
  const [step, setStep] = useState<
    "form" | "submitting" | "processing" | "done" | "error"
  >("form");
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("submitting");
    setStatusMessage("Creating application…");

    try {
      const created = await createApplication(
        tenantId,
        mode,
        {
          applicant_name: form.applicant_name,
          monthly_income: parseFloat(form.monthly_income) || 0,
          loan_amount: parseFloat(form.loan_amount) || 0,
          loan_purpose: form.loan_purpose || undefined,
        },
        true
      );

      setStep("processing");
      setStatusMessage("Processing application…");

      const processed = await processApplication(
        tenantId,
        created.application_id,
        mode,
        true
      );
      saveProcessResultToSession(created.application_id, processed);

      setStep("done");
      setStatusMessage("Application processed. Redirecting…");

      setTimeout(() => {
        router.push(`/credit/${created.application_id}`);
      }, 800);
    } catch (err) {
      setStep("error");
      setStatusMessage(err instanceof Error ? err.message : "An error occurred");
    }
  }

  if (step !== "form") {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center">
          <div className="text-4xl mb-4">
            {step === "done" ? "\u2705" : step === "error" ? "\u274C" : "\u23F3"}
          </div>
          <p className="text-gray-700 dark:text-gray-200 font-medium mb-1">
            {step === "submitting" && "Creating application…"}
            {step === "processing" && "Processing…"}
            {step === "done" && "Done!"}
            {step === "error" && "Something went wrong"}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {statusMessage}
          </p>
          {step === "error" && (
            <button
              type="button"
              onClick={() => setStep("form")}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
          New Credit Application
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Tenant:{" "}
          <span className="font-mono text-xs">{tenantId}</span> — All
          fields marked * are required
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Processing Mode *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["AI_ONLY", "BANK_ONLY", "HYBRID"] as ApplicationMode[]).map(
              (m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    mode === m
                      ? "border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                      : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="text-xs font-semibold">{MODE_LABELS[m]}</div>
                  <div
                    className={`text-xs mt-0.5 ${
                      mode === m
                        ? "text-gray-300 dark:text-gray-600"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {MODE_DESCRIPTIONS[m]}
                  </div>
                </button>
              )
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Applicant Name *
          </label>
          <input
            type="text"
            required
            value={form.applicant_name}
            onChange={(e) =>
              setForm({ ...form, applicant_name: e.target.value })
            }
            placeholder="Full legal name"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monthly Income (DOP) *
            </label>
            <input
              type="number"
              required
              min={0}
              value={form.monthly_income}
              onChange={(e) =>
                setForm({ ...form, monthly_income: e.target.value })
              }
              placeholder="e.g. 45000"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Requested Amount (DOP)
            </label>
            <input
              type="number"
              min={0}
              value={form.loan_amount}
              onChange={(e) =>
                setForm({ ...form, loan_amount: e.target.value })
              }
              placeholder="e.g. 200000"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Loan Purpose
          </label>
          <select
            value={form.loan_purpose}
            onChange={(e) =>
              setForm({ ...form, loan_purpose: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
          >
            <option value="">Select purpose…</option>
            <option value="personal">Personal</option>
            <option value="business">Business</option>
            <option value="vehicle">Vehicle</option>
            <option value="mortgage">Mortgage</option>
            <option value="education">Education</option>
          </select>
        </div>

        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <strong>Demo mode:</strong> Applications run with{" "}
          <code className="text-xs">dry_run=true</code>. Configure pilot bank env
          on the API host for live adapter calls.
        </div>

        <button
          type="submit"
          className="w-full bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors text-sm"
        >
          Submit Application
        </button>
      </form>
    </div>
  );
}

export default function NewApplicationClient() {
  return (
    <CreditTenantGate>
      {(tenantId) => <NewApplicationForm tenantId={tenantId} />}
    </CreditTenantGate>
  );
}
