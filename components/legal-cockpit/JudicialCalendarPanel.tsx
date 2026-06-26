"use client";

import { useState, useMemo } from "react";
import type { CalendarView, AudienciaFormState, DayColumn, ReminderItem } from "@/lib/legal-cockpit/types";
import { WEEK_DAYS, RAW_EVENTS, DEMO_REMINDERS, CIUDADES } from "@/lib/legal-cockpit/calendar-data";
import { CalendarWeekView } from "./CalendarWeekView";
import { CalendarMonthView } from "./CalendarMonthView";

export function JudicialCalendarPanel() {
  const [calView, setCalView] = useState<CalendarView>("semana");
  const [audFormOpen, setAudFormOpen] = useState(false);
  const [form, setForm] = useState<AudienciaFormState>({
    casoId: "", resultado: "", notas: "",
    programarNext: false, fecha: "", hora: "",
    juzgado: "", ciudad: "Santo Domingo",
  });
  const [reminders, setReminders] = useState<ReminderItem[]>(DEMO_REMINDERS);
  const currentHour = new Date().getHours();

  const days: DayColumn[] = useMemo(() =>
    WEEK_DAYS.map((d) => ({
      ...d,
      events: RAW_EVENTS.filter((e) => e.day === WEEK_DAYS.indexOf(d)),
    })),
  []);

  const toggleReminder = (key: string) =>
    setReminders((prev) => prev.map((r) => (r.key === key ? { ...r, on: !r.on } : r)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-4">
      {/* Left — Calendar */}
      <div>
        <p className="text-xs text-amber-400/80 mb-2">
          Datos demo &middot; Pendiente integraci&oacute;n con audiencias reales
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Calendario judicial
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-lg font-semibold text-zinc-100">Marzo 2026</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-950/40 text-violet-400 border border-violet-800/40">
                4 esta semana
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {(["semana", "mes"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setCalView(v)}
                  className="px-3 py-1.5 text-[11px] transition-colors"
                  style={{
                    background: calView === v ? "rgba(139,92,246,0.18)" : "transparent",
                    color: calView === v ? "#D4C8FF" : "#6A6A73",
                  }}
                >
                  {v === "semana" ? "Semana" : "Mes"}
                </button>
              ))}
            </div>
            <button className="text-[11px] px-3 py-1.5 rounded-lg font-medium text-white bg-gradient-to-r from-violet-600 to-violet-700 hover:brightness-110 transition-all">
              + Nueva audiencia
            </button>
          </div>
        </div>
        {calView === "semana" ? <CalendarWeekView days={days} currentHour={currentHour} /> : <CalendarMonthView />}
      </div>

      {/* Right — Side cards */}
      <div className="flex flex-col gap-3 max-h-[680px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        {/* Card 1: Próxima audiencia */}
        <div
          className="rounded-xl p-4"
          style={{
            background: "linear-gradient(160deg, rgba(139,92,246,0.16), rgba(139,92,246,0.04))",
            border: "1px solid rgba(139,92,246,0.30)",
          }}
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-violet-400/70 mb-2">
            Próxima audiencia
          </p>
          <p className="text-sm font-medium text-white">Cobro de Pesos</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Jdo. 1er Civil · Santiago</p>
          <p className="text-2xl font-bold text-white mt-2">Mar 24, 9:00am</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/30">
              STD · 3h viaje
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 animate-pulse">
              en 18h
            </span>
          </div>
          <button className="mt-3 text-[11px] text-violet-400 hover:text-violet-300 transition-colors">
            Ver expediente &rarr;
          </button>
        </div>

        {/* Card 2: Registrar regreso */}
        <div className="rounded-xl border border-emerald-800/30 bg-zinc-900/80">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            onClick={() => setAudFormOpen(!audFormOpen)}
          >
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/70">
                Registrar regreso
              </p>
              <p className="text-sm font-medium text-white mt-0.5">Post-audiencia</p>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              className={`text-zinc-500 transition-transform ${audFormOpen ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {audFormOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-zinc-800/40 pt-3">
              {/* Resultado buttons */}
              <div className="flex gap-2">
                {(["celebrada", "aplazada", "suspendida"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setForm({ ...form, resultado: r })}
                    className={`flex-1 text-[11px] py-1.5 rounded-lg border transition-all ${
                      form.resultado === r
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-700/50"
                        : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              {/* Notas */}
              <textarea
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Notas de la audiencia..."
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-emerald-700/40 focus:outline-none resize-none"
                rows={2}
              />
              {/* Toggle next */}
              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, programarNext: !form.programarNext })}
                  className="relative w-9 h-5 rounded-full transition-colors"
                  style={{
                    background: form.programarNext ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.10)",
                  }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                    style={{
                      background: form.programarNext ? "#34D399" : "#6A6A73",
                      transform: form.programarNext ? "translateX(18px)" : "translateX(2px)",
                    }}
                  />
                </button>
                <span className="text-[11px] text-zinc-400">Programar próxima audiencia</span>
              </label>

              {form.programarNext && (
                <div className="space-y-2 pl-1">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date" value={form.fecha}
                      onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                      className="bg-zinc-950/50 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:border-violet-700/40 focus:outline-none"
                    />
                    <input
                      type="time" value={form.hora}
                      onChange={(e) => setForm({ ...form, hora: e.target.value })}
                      className="bg-zinc-950/50 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:border-violet-700/40 focus:outline-none"
                    />
                  </div>
                  <input
                    value={form.juzgado}
                    onChange={(e) => setForm({ ...form, juzgado: e.target.value })}
                    placeholder="Juzgado"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:border-violet-700/40 focus:outline-none"
                  />
                  <select
                    value={form.ciudad}
                    onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:border-violet-700/40 focus:outline-none"
                  >
                    {CIUDADES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {form.ciudad !== "Santo Domingo" && form.ciudad !== "" && (
                    <p className="text-[10px] text-amber-400 bg-amber-950/20 border border-amber-800/30 rounded-lg px-2 py-1.5">
                      &#9888; Desplazamiento — Recordatorio 24h antes
                    </p>
                  )}
                </div>
              )}

              <button className="w-full text-[11px] py-2 rounded-lg font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 transition-all">
                Registrar y agendar
              </button>
            </div>
          )}
        </div>

        {/* Card 3: Recordatorios */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/80 p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3">
            Recordatorios
          </p>
          <div className="space-y-2.5">
            {reminders.map((r) => (
              <div key={r.key} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-300 truncate">{r.title}</p>
                  <p className="text-[9px] text-zinc-600 truncate">{r.sub}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleReminder(r.key)}
                  className="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors"
                  style={{
                    background: r.on ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.10)",
                  }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                    style={{
                      background: r.on ? "#34D399" : "#6A6A73",
                      transform: r.on ? "translateX(18px)" : "translateX(2px)",
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Conflictos IA */}
        <div
          className="rounded-xl p-4"
          style={{
            background: "linear-gradient(160deg, rgba(245,158,11,0.10), #0C0C0F 60%)",
            border: "1px solid rgba(245,158,11,0.20)",
          }}
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400/70 mb-2">
            Conflictos IA
          </p>
          <p className="text-sm font-medium text-white">1 conflicto detectado</p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Audiencia Lun 9am en Santiago colisiona con plazo de contestación CRD-2026-041
          </p>
          <button className="mt-3 text-[11px] text-amber-400 hover:text-amber-300 transition-colors">
            Reorganizar &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
