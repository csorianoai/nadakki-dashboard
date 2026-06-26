"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { LegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export type ActorFormData = {
  role: string;
  actor_kind: "persona_fisica" | "persona_juridica" | "institucion";
  full_name: string;
  identification_type?: string;
  identification_number?: string;
  email?: string;
  phone?: string;
  is_primary: boolean;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-800/50 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30";

const ACTOR_KINDS = ["persona_fisica", "persona_juridica", "institucion"] as const;

const ID_TYPES = ["cedula", "pasaporte", "rnc", "other"] as const;

interface ActorFormCardProps {
  actor: ActorFormData;
  onChange: (a: ActorFormData) => void;
  onRemove?: () => void;
  collapsed?: boolean;
  label: string;
  roleOptions: string[];
  messages: LegalCasesMessages;
}

export function ActorFormCard({
  actor,
  onChange,
  onRemove,
  collapsed: initialCollapsed,
  label,
  roleOptions,
  messages,
}: ActorFormCardProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed ?? false);
  const wm = messages.wizard;

  const set = <K extends keyof ActorFormData>(key: K, val: ActorFormData[K]) =>
    onChange({ ...actor, [key]: val });

  const roleLocked = actor.is_primary;

  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30">
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-200"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className="flex items-center gap-2">
          <svg
            className={cn(
              "h-4 w-4 text-zinc-500 transition-transform",
              collapsed ? "" : "rotate-90"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {label}
          {collapsed && actor.full_name ? (
            <span className="text-xs text-zinc-500">
              — {actor.full_name}
              {actor.role && !roleLocked
                ? ` (${(wm.roles as Record<string, string>)[actor.role] ?? actor.role})`
                : ""}
            </span>
          ) : null}
        </span>
        {onRemove ? (
          <span
            role="button"
            tabIndex={0}
            className="rounded p-1 text-zinc-500 transition-colors hover:bg-red-950/40 hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }
            }}
            title={wm.remove_party}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </span>
        ) : null}
      </button>

      {/* Body */}
      {!collapsed ? (
        <div className="space-y-3 border-t border-zinc-800/30 px-4 pb-4 pt-3">
          {/* Full name */}
          <label className="block text-sm font-medium text-zinc-300">
            {wm.field_full_name} *
            <input
              value={actor.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              className={inputClass}
            />
          </label>

          {/* Row: actor_kind + role */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-zinc-300">
              {wm.actor_kind.label}
              <select
                value={actor.actor_kind}
                onChange={(e) => set("actor_kind", e.target.value as ActorFormData["actor_kind"])}
                className={inputClass}
              >
                {ACTOR_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {(wm.actor_kind as Record<string, string>)[k]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-zinc-300">
              {wm.roles.label}
              <select
                value={actor.role}
                onChange={(e) => set("role", e.target.value)}
                disabled={roleLocked}
                className={cn(inputClass, roleLocked && "opacity-60")}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {(wm.roles as Record<string, string>)[r] ?? r}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Row: identification */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-zinc-300">
              {wm.identification.type_label}
              <select
                value={actor.identification_type ?? ""}
                onChange={(e) => set("identification_type", e.target.value || undefined)}
                className={inputClass}
              >
                <option value="">—</option>
                {ID_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {wm.identification.types[t]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-zinc-300">
              {wm.identification.number_label}
              <input
                value={actor.identification_number ?? ""}
                onChange={(e) => set("identification_number", e.target.value || undefined)}
                className={inputClass}
              />
            </label>
          </div>

          {/* Row: email + phone */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-zinc-300">
              {wm.field_email}
              <input
                type="email"
                value={actor.email ?? ""}
                onChange={(e) => set("email", e.target.value || undefined)}
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-medium text-zinc-300">
              {wm.field_phone}
              <input
                type="tel"
                value={actor.phone ?? ""}
                onChange={(e) => set("phone", e.target.value || undefined)}
                className={inputClass}
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
