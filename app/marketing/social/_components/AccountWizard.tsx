"use client";

import { useState } from "react";
import { CONNECT_ALLOWED, COPY, PLATFORM_LABEL, SIGNUP_URL, type Lang } from "@/lib/social-center/copy";
import type { Brand, CapabilityCell, LifecycleStatus, ProfileChecklist, SocialAccount, SocialClient } from "@/lib/social-center/types";

/**
 * Asistente de alta ASISTIDO por humano. Nunca tiene campos de contraseña, codigo ni token: la cuenta la crea una
 * persona en el sitio oficial y aqui solo se confirma existencia, titularidad y perfil (contrato C-SOCIAL-D0).
 */
export default function AccountWizard({
  account, brand, caps, client, lang, navigate, onChanged, onClose,
}: {
  account: SocialAccount;
  brand?: Brand;
  caps: CapabilityCell[] | null;
  client: SocialClient;
  lang: Lang;
  navigate: (url: string) => void;
  onChanged: () => Promise<void>;
  onClose: () => void;
}) {
  const t = COPY[lang];
  const st: LifecycleStatus = account.status;
  const [handle, setHandle] = useState(account.handle || account.proposed_handle || "");
  const [url, setUrl] = useState(account.profile_url || "");
  const [evidence, setEvidence] = useState("");
  const [exists, setExists] = useState(false);
  const [owner, setOwner] = useState(account.owner_label || "");
  const [checks, setChecks] = useState<ProfileChecklist>(account.profile_checklist || {});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const toggle = (k: keyof ProfileChecklist) => setChecks((c) => ({ ...c, [k]: !c[k] }));

  async function advance(patch: Parameters<SocialClient["updateAccount"]>[2] | null, to: LifecycleStatus, ev?: string) {
    setBusy(true);
    setErr("");
    let version = account.version;
    if (patch) {
      const u = await client.updateAccount(account.id, version, patch);
      if (!u.ok) { setBusy(false); return setErr(t.actionError); }
      version = u.data.version ?? version;
    }
    const r = await client.transition(account.id, version, { to_status: to, ...(ev ? { evidence_ref: ev } : {}) });
    setBusy(false);
    if (!r.ok) return setErr(t.actionError);
    await onChanged();
  }

  async function connect() {
    setBusy(true);
    setErr("");
    const r = await client.startConnection(account.id, "identity");
    setBusy(false);
    if (!r.ok || !/^https:\/\//i.test(r.data.authorization_url)) return setErr(t.connectError);
    navigate(r.data.authorization_url);
  }

  const cell = caps?.find((c) => c.platform === account.platform && c.capability === "connect_oauth");
  const canConnect = !!cell && CONNECT_ALLOWED.includes(cell.nadakki_status);
  const blocked = !caps || !cell ? t.blockedUnknown
    : cell.nadakki_status === "REQUIRES_HUMAN" ? t.blockedHuman
    : cell.nadakki_status === "NOT_SUPPORTED" ? t.blockedNot
    : t.blockedStub;

  const box = (k: keyof ProfileChecklist, label: string) => (
    <label key={k} className="flex items-center gap-2 text-sm text-gray-200">
      <input type="checkbox" checked={!!checks[k]} onChange={() => toggle(k)} /> {label}
    </label>
  );
  const field = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white";
  const primary = "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";

  return (
    <section data-testid="wizard" aria-label={`${PLATFORM_LABEL[account.platform]}${brand ? ` · ${brand.display_name}` : ""}`} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-[#0a0f1c] p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{PLATFORM_LABEL[account.platform]}{brand ? ` · ${brand.display_name}` : ""}</h2>
        <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-white">{t.wizardClose}</button>
      </div>
      <p className="rounded-lg bg-white/5 p-3 text-sm text-gray-300">{t.neverAsk}</p>

      {st === "PLANNED" && (
        <div className="space-y-3">
          <h3 className="font-medium text-white">{t.step1}</h3>
          <a href={SIGNUP_URL[account.platform]} target="_blank" rel="noopener noreferrer" className="inline-block text-sky-400 underline">
            {t.officialSignup} · {PLATFORM_LABEL[account.platform]}
          </a>
          <p className="text-sm text-gray-400">{t.proposedHandle}: <strong className="text-white">{account.proposed_handle || "—"}</strong></p>
          <label className="block text-sm text-gray-300">{t.handle}
            <input className={field} value={handle} onChange={(e) => setHandle(e.target.value)} />
          </label>
          <label className="block text-sm text-gray-300">{t.profileUrl}
            <input className={field} type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </label>
          <label className="block text-sm text-gray-300">{t.evidence}
            <input className={field} value={evidence} onChange={(e) => setEvidence(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-200">
            <input type="checkbox" checked={exists} onChange={() => setExists(!exists)} /> {t.confirmExists}
          </label>
          <button type="button" disabled={busy || !exists || !handle.trim() || !/^https:\/\//i.test(url) || !evidence.trim()}
            onClick={() => advance({ handle: handle.trim(), profile_url: url.trim() }, "EXISTS", evidence.trim())}
            className={primary}>{t.confirmExistsBtn}</button>
        </div>
      )}

      {st === "EXISTS" && (
        <div className="space-y-3">
          <h3 className="font-medium text-white">{t.step2}</h3>
          <label className="block text-sm text-gray-300">{t.owner}
            <input className={field} value={owner} onChange={(e) => setOwner(e.target.value)} />
          </label>
          {box("owner_confirmed", t.ownerConfirmed)}
          {box("two_factor", t.twoFactor)}
          <button type="button" disabled={busy || !owner.trim() || !checks.owner_confirmed || !checks.two_factor}
            onClick={() => advance({ owner_label: owner.trim(), profile_checklist: checks }, "CLAIMED")}
            className={primary}>{t.claimBtn}</button>
        </div>
      )}

      {st === "CLAIMED" && (
        <div className="space-y-3">
          <h3 className="font-medium text-white">{t.step3}</h3>
          {box("photo", t.photo)}{box("cover", t.cover)}{box("bio", t.bio)}{box("website_url", t.website_url)}
          <button type="button" disabled={busy || !(checks.photo && checks.cover && checks.bio && checks.website_url)}
            onClick={() => advance({ profile_checklist: checks }, "PROFILE_COMPLETE")}
            className={primary}>{t.profileBtn}</button>
        </div>
      )}

      {(st === "PROFILE_COMPLETE" || st === "ERROR" || st === "CONNECTED") && (
        <div className="space-y-3">
          <h3 className="font-medium text-white">{t.step4}</h3>
          {st === "CONNECTED" && <p className="text-sm text-emerald-300">{t.connectedInfo}</p>}
          {canConnect ? (
            st !== "CONNECTED" && (
              <button type="button" disabled={busy} onClick={() => void connect()} className={primary}>
                {busy ? t.connecting : `${t.connect} ${PLATFORM_LABEL[account.platform]}`}
              </button>
            )
          ) : (
            <p data-testid="connect-blocked" className="text-sm text-amber-300">{blocked}</p>
          )}
        </div>
      )}

      {!["PLANNED", "EXISTS", "CLAIMED", "PROFILE_COMPLETE", "ERROR", "CONNECTED"].includes(st) && (
        <p className="text-sm text-gray-300">{t.stepLater}</p>
      )}
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
    </section>
  );
}
