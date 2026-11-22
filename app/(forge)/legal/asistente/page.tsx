"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TaskLauncher } from "@/components/legal/TaskLauncher";
import { LegalTaskExecuteProvider } from "@/hooks/useExecuteLegalTask";
import { useLegalTasks } from "@/hooks/useLegalTasks";
import { resolveTaskDescription, resolveTaskDisplayName } from "@/lib/legal/task-types";

const sinTildes = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Catálogo completo de tareas de IA (antes ocupaba el Inicio). Mismas tareas y mismo modal de ejecución. */
function CatalogoIa() {
  const { tasks, loading, error, refetch } = useLegalTasks("do");
  const [q, setQ] = useState("");
  const visibles = useMemo(() => {
    const t = sinTildes(q.trim());
    if (!t) return tasks;
    return tasks.filter((x) => sinTildes(`${resolveTaskDisplayName(x)} ${resolveTaskDescription(x)} ${x.section_es}`).includes(t));
  }, [tasks, q]);

  return (
    <div id="main-content" className="mx-auto w-full max-w-[1400px] space-y-5 pb-24">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Asistente IA</h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400">Todas las tareas de IA del despacho. Si trabajas en un caso, inícialas desde su expediente.</p>
        </div>
        <label className="relative w-full max-w-sm">
          <span className="sr-only">Buscar tarea</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar tarea (contrato, plazo, AML…)"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
      </header>
      {!loading && !error && q.trim() && visibles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-zinc-700 dark:text-zinc-400">Ninguna tarea coincide con «{q.trim()}».</p>
      ) : (
        <TaskLauncher tasks={visibles} loading={loading} error={error} onRetry={() => void refetch()} />
      )}
    </div>
  );
}

export default function LegalAsistentePage() {
  return (
    <LegalTaskExecuteProvider>
      <CatalogoIa />
    </LegalTaskExecuteProvider>
  );
}
