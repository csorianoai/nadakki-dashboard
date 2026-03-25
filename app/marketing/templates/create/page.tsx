"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { MARKETING_ENDPOINTS } from "@/lib/api/endpoints";

export default function CreateTemplatePage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const [name, setName] = useState("");
  const [type, setType] = useState("email");
  const [channel, setChannel] = useState("email");
  const [objective, setObjective] = useState("convert");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!tenantId?.trim()) {
        setError("Selecciona un tenant.");
        return;
      }
      if (!name.trim()) {
        setError("El nombre es obligatorio.");
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch(MARKETING_ENDPOINTS.TEMPLATES, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Tenant-ID": tenantId.trim(),
          },
          body: JSON.stringify({
            name: name.trim(),
            type: type.trim() || "email",
            channel: channel.trim() || type.trim() || "email",
            objective: objective.trim() || "convert",
            subject: subject.trim(),
            content: content.trim(),
            description: description.trim(),
            cta_text: ctaText.trim(),
            source: "manual",
            tenant_id: tenantId.trim(),
          }),
        });
        const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        if (!res.ok) {
          setError(typeof json?.detail === "string" ? json.detail : `HTTP ${res.status}`);
          return;
        }
        router.push("/marketing/templates");
      } catch (err) {
        setError((err as Error)?.message ?? String(err));
      } finally {
        setSubmitting(false);
      }
    },
    [tenantId, name, type, channel, objective, subject, content, description, ctaText, router]
  );

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white px-6 py-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/marketing/templates"
            className="p-2 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold m-0">Crear plantilla manual</h1>
        </div>

        <p className="text-sm text-gray-400 mb-6 m-0">
          Se guarda en el tenant vía{" "}
          <code className="text-xs text-violet-300">{MARKETING_ENDPOINTS.TEMPLATES}</code>
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nombre *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              placeholder="Ej. Bienvenida Q1"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tipo</label>
              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                placeholder="email"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Canal</label>
              <input
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                placeholder="email"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Objetivo</label>
            <input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Asunto</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Contenido</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">CTA</label>
            <input
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
          </div>

          {error ? <p className="text-sm text-red-300 m-0">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-3 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Guardar plantilla
          </button>
        </form>
      </div>
    </div>
  );
}
