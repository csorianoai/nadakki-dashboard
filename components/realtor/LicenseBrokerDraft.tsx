"use client";

import { useEffect, useId, useRef, useState } from "react";
import { altaEs, type AltaCopy } from "./alta-copy";
import styles from "./LicenseBrokerDraft.module.css";

type Availability = "ready" | "loading" | "empty" | "error" | "UNAVAILABLE";
type LicenseStatus = keyof AltaCopy["licenseStates"];
type AgentStatus = keyof AltaCopy["agentStates"];
type Choice = { id: string; label: string };
export type JurisdictionChoice = { code: string; label: string; licenseTypes: Choice[] };
export interface LicenseBrokerDraftProps {
  copy?: AltaCopy;
  lang?: "es" | "en";
  licenseAvailability?: Availability;
  brokerAvailability?: Availability;
  jurisdictions?: JurisdictionChoice[];
  brokerages?: Choice[];
  supervisors?: Choice[];
  supervisionRequired?: boolean;
  licenseStatus?: LicenseStatus;
  agentStatus?: AgentStatus;
  /** Isolated rendering only; never represents a completed onboarding step. */
  initialStep?: "license" | "broker";
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const jurisdictionCode = /^[A-Z]{2}(-[A-Z0-9]{1,3}(:[a-z0-9][a-z0-9._-]{0,63}){0,2})?$/;
const licenseType = /^[a-z][a-z0-9_.-]{0,63}$/;

/** In-memory draft only. No transport, storage, authorization or business callbacks. */
export function LicenseBrokerDraft({
  copy: t = altaEs, lang = "es", licenseAvailability = "UNAVAILABLE",
  brokerAvailability = "UNAVAILABLE", jurisdictions = [], brokerages = [], supervisors = [],
  supervisionRequired, licenseStatus, agentStatus, initialStep = "license",
}: LicenseBrokerDraftProps) {
  const prefix = useId();
  const [step, setStep] = useState(initialStep);
  const [draft, setDraft] = useState({ jurisdiction_code: "", license_type: "", license_number: "",
    brokerage_id: "", supervisor_agent_id: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reviewed, setReviewed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const isLicense = step === "license";
  const jurisdiction = jurisdictions.find(j => j.code === draft.jurisdiction_code);
  const types = jurisdiction?.licenseTypes ?? [];
  let availability = isLicense ? licenseAvailability : brokerAvailability;
  if (!isLicense && supervisionRequired === undefined) availability = "UNAVAILABLE";
  if (availability === "ready" && (isLicense ? !jurisdictions.length : supervisionRequired && !supervisors.length)) availability = "empty";
  const available = availability === "ready";
  const labels: Record<string, string> = { jurisdiction_code: t.jurisdiction, license_type: t.type,
    license_number: t.number, brokerage_id: t.brokerage, supervisor_agent_id: t.supervisor };
  const selectedLabel = (choices: Choice[], value: string) => choices.find(c => c.id === value)?.label ?? t.none;
  const change = (key: keyof typeof draft, value: string) => {
    setDraft(d => ({ ...d, [key]: value, ...(key === "jurisdiction_code" ? { license_type: "" } : {}) }));
    setErrors({}); setReviewed(false);
  };
  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (isLicense) {
      if (!jurisdiction || !jurisdictionCode.test(draft.jurisdiction_code)) nextErrors.jurisdiction_code = t.required;
      if (!licenseType.test(draft.license_type) || !types.some(c => c.id === draft.license_type)) nextErrors.license_type = t.required;
      const length = Array.from(draft.license_number).length;
      if (length < 1 || length > 64) nextErrors.license_number = t.numberError;
    } else {
      if (draft.brokerage_id && (!uuid.test(draft.brokerage_id) || !brokerages.some(c => c.id === draft.brokerage_id))) nextErrors.brokerage_id = t.required;
      if ((supervisionRequired || draft.supervisor_agent_id) &&
        (!uuid.test(draft.supervisor_agent_id) || !supervisors.some(c => c.id === draft.supervisor_agent_id))) nextErrors.supervisor_agent_id = t.required;
    }
    setErrors(nextErrors);
    const first = Object.keys(nextErrors)[0];
    if (first) document.getElementById(prefix + first)?.focus();
    return !first;
  };
  const select = (key: keyof typeof draft, choices: Choice[], optional = false) => (
    <div className={styles.field}>
      <label htmlFor={prefix + key}>{labels[key]}</label>
      <select id={prefix + key} value={draft[key]} onChange={e => change(key, e.target.value)}
        aria-invalid={!!errors[key]} aria-describedby={errors[key] ? prefix + key + "-error" : undefined}>
        <option value="">{optional ? t.none : t.choose}</option>
        {choices.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      {errors[key] && <p className={styles.error} id={prefix + key + "-error"} role="alert">{errors[key]}</p>}
    </div>
  );
  return <section className={styles.root} lang={lang} aria-label={t.title}>
    <h1>{t.title}</h1><p className={styles.note}>{t.notice}</p>
    <ol className={styles.steps} aria-label={t.progress}>
      <li aria-current={isLicense ? "step" : undefined}>1 · {t.license}</li>
      <li aria-current={!isLicense ? "step" : undefined}>2 · {t.broker}</li>
    </ol>
    <div className={styles.card} aria-busy={availability === "loading"}>
      <h2 ref={heading} tabIndex={-1}>{isLicense ? t.license : t.broker}</h2>
      <p className={styles.badge}>{isLicense ? t.licenseState : t.agentState}: {
        isLicense ? (licenseStatus ? t.licenseStates[licenseStatus] ?? t.pending : t.pending)
          : (agentStatus ? t.agentStates[agentStatus] ?? t.pending : t.pending)}</p>
      <p className={styles.note}>{isLicense ? t.noVerification : t.noApproval}</p>
      {!available && <p role={availability === "error" ? "alert" : "status"}>{
        availability === "UNAVAILABLE" ? t.unavailable : t[availability as "loading" | "empty" | "error"]
      }{!isLicense && supervisionRequired === undefined ? " " + t.missingPack : ""}</p>}
      {available && <form noValidate onSubmit={e => { e.preventDefault(); setReviewed(validate()); }}>
        <div className={styles.fields}>
          {isLicense ? <>
            {select("jurisdiction_code", jurisdictions.map(j => ({ id: j.code, label: j.label })))}
            {select("license_type", types)}
            <div className={styles.field}>
              <label htmlFor={prefix + "license_number"}>{t.number}</label>
              <input id={prefix + "license_number"} value={draft.license_number}
                onChange={e => change("license_number", e.target.value)} autoComplete="off"
                aria-invalid={!!errors.license_number}
                aria-describedby={errors.license_number ? prefix + "number-error" : undefined} />
              {errors.license_number && <p className={styles.error} id={prefix + "number-error"} role="alert">{errors.license_number}</p>}
            </div>
          </> : <>
            {select("brokerage_id", brokerages, true)}
            {select("supervisor_agent_id", supervisors, !supervisionRequired)}
          </>}
        </div>
        <div className={styles.actions}>
          <button type="submit">{t.review}</button>
          {isLicense && <button type="button" onClick={() => {
            if (validate()) { setStep("broker"); setReviewed(false); setErrors({}); }
          }}>{t.next}</button>}
        </div>
        {reviewed && <div className={styles.review}>
          <p role="status">{t.reviewed}</p>
          <dl>{(isLicense ? ["jurisdiction_code", "license_type", "license_number"] : ["brokerage_id", "supervisor_agent_id"]).map(key =>
            <div key={key}><dt>{labels[key]}</dt><dd>{
              key === "license_number" ? draft.license_number :
              key === "jurisdiction_code" ? jurisdiction?.label :
              key === "license_type" ? selectedLabel(types, draft.license_type) :
              selectedLabel(key === "brokerage_id" ? brokerages : supervisors, draft[key])
            }</dd></div>)}</dl>
        </div>}
      </form>}
      {!isLicense && <div className={styles.actions}><button type="button" onClick={() => {
        setStep("license"); setErrors({}); setReviewed(false);
      }}>{t.back}</button></div>}
    </div>
  </section>;
}
