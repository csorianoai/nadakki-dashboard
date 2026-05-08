"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { TaskExecutionResult } from "@/components/legal/TaskExecutionResult";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import type { LegalTask, LegalTaskRequiredInput } from "@/lib/legal/task-types";
import { DocumentDropzone } from "@/components/shared/DocumentDropzone";
import { ExtractedDataPanel } from "@/components/shared/ExtractedDataPanel";
import type { ExtractedDocumentData } from "@/lib/shared/document-upload-types";
import type { UploadedFile } from "@/lib/shared/document-upload-types";
import { mergePlainFromUploads } from "@/lib/legal/document-upload-client";

type Props = {
  task: LegalTask;
  tenantId: string;
  onClose: () => void;
  runExecute: (
    tenantId: string,
    taskId: string,
    body: Record<string, unknown>
  ) => Promise<Record<string, unknown>>;
};

function buildInitialValues(inputs: LegalTaskRequiredInput[]): Record<string, string> {
  const o: Record<string, string> = {};
  for (const i of inputs) {
    if (i.type !== "file" && i.type !== "textarea" && i.type !== "text") o[i.field] = "";
  }
  return o;
}

function useDocumentFieldLimits(task: LegalTask, field: LegalTaskRequiredInput) {
  return useMemo(() => {
    const id = task.task_id.toLowerCase();
    const fl = field.field.toLowerCase();
    if (id.includes("compar") || fl.includes("version") || fl.includes("compare")) {
      return { maxFiles: 2 as const, multiple: true };
    }
    return { maxFiles: 1 as const, multiple: false };
  }, [field.field, task.task_id]);
}

function DocumentField({
  inp,
  task,
  disabled,
  files,
  onFilesChange,
  value,
  onSummaryChange,
}: {
  inp: LegalTaskRequiredInput;
  task: LegalTask;
  disabled: boolean;
  files: UploadedFile[];
  onFilesChange: (next: UploadedFile[]) => void;
  value: string;
  onSummaryChange: (text: string) => void;
}) {
  const { maxFiles, multiple } = useDocumentFieldLimits(task, inp);
  const formats = inp.formats?.length ? inp.formats.map((x) => `.${x.replace(/^\./, "")}`) : undefined;

  const ready = files.filter((f) => f.status === "ready");
  const firstData: ExtractedDocumentData | undefined = ready[0]?.extractedData;
  const panelData: ExtractedDocumentData | undefined = firstData
    ? { ...firstData, plain_text_summary: value || firstData.plain_text_summary }
    : value
      ? { plain_text_summary: value }
      : undefined;

  return (
    <div className="space-y-2">
      <DocumentDropzone
        title={inp.label_es ?? inp.field}
        subtitle="PDF, Word, imagen o ZIP. La IA extraerá el texto (mock en desarrollo)."
        disabled={disabled}
        uploadedFiles={files}
        onFilesChange={onFilesChange}
        maxFiles={maxFiles}
        multiple={multiple}
        accept={formats}
        compact
        onUploadComplete={(uploaded) => {
          const t = mergePlainFromUploads(uploaded);
          if (t) onSummaryChange(t);
        }}
      />
      {panelData && (panelData.plain_text_summary || panelData.document_type) ? (
        <ExtractedDataPanel
          data={panelData}
          onChange={(next) => onSummaryChange(next.plain_text_summary ?? "")}
          editable={!disabled}
        />
      ) : null}
    </div>
  );
}

export function TaskExecuteModal({ task, tenantId, onClose, runExecute }: Props) {
  const m = useLegalHomeMessages();
  const [values, setValues] = useState<Record<string, string>>(() => buildInitialValues(task.required_inputs));
  const [uploadsByField, setUploadsByField] = useState<Record<string, UploadedFile[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [phase, setPhase] = useState<"form" | "processing" | "done">("form");

  const setUploads = useCallback((field: string, next: UploadedFile[]) => {
    setUploadsByField((prev) => ({ ...prev, [field]: next }));
  }, []);

  const onSubmit = useCallback(async () => {
    if (!tenantId.trim()) {
      setError("Tenant no disponible");
      return;
    }
    setBusy(true);
    setError(null);
    if (task.sync_mode === "deep_async") {
      setPhase("processing");
    }
    try {
      const payload: Record<string, unknown> = { ...values };
      for (const inp of task.required_inputs) {
        if (inp.type === "text" || inp.type === "textarea" || inp.type === "file") {
          const merged = mergePlainFromUploads(uploadsByField[inp.field] ?? []);
          payload[inp.field] = merged || values[inp.field] || "";
          const ids = (uploadsByField[inp.field] ?? [])
            .filter((f) => f.status === "ready" && f.serverFileId)
            .map((f) => f.serverFileId as string);
          if (ids.length) payload[`${inp.field}_file_ids`] = ids;
        }
      }
      const out = await runExecute(tenantId, task.task_id, { inputs: payload });
      setResult(out);
      setPhase("done");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al ejecutar";
      setError(msg);
      setPhase("form");
    } finally {
      setBusy(false);
    }
  }, [runExecute, task.sync_mode, task.required_inputs, task.task_id, tenantId, uploadsByField, values]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-forgeSurface-overlay p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-forge-lg border border-forgeInk-200 bg-forgeSurface-card shadow-forge-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-forgeInk-200 px-5 py-4">
          <h2 id="task-modal-title" className="text-lg font-semibold text-forge-text">
            {m.modal_title}
          </h2>
          <button
            type="button"
            className="rounded-forge-sm p-1 text-forge-text-muted hover:bg-forgeSurface-sunken hover:text-forge-text"
            onClick={onClose}
            aria-label={m.modal_close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-forge-sm font-medium text-forge-text">{task.display_name_es}</p>
          <p className="mt-1 text-forge-sm text-forge-text-muted">{task.description_es}</p>

          {phase === "processing" ? (
            <div className="mt-6 flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-forgeBrand-600" aria-hidden />
              <p className="text-center text-forge-sm text-forge-text-muted">{m.modal_processing}</p>
            </div>
          ) : null}

          {phase === "form" ? (
            <div className="mt-4 space-y-4">
              {task.required_inputs.map((inp) => (
                <div key={inp.field}>
                  <label className="mb-1 block text-xs font-medium text-forge-text-muted" htmlFor={inp.field}>
                    {inp.label_es ?? inp.field}
                    {inp.required ? " *" : ""}
                  </label>
                  {inp.type === "file" || inp.type === "textarea" || inp.type === "text" ? (
                    <DocumentField
                      inp={inp}
                      task={task}
                      disabled={busy}
                      files={uploadsByField[inp.field] ?? []}
                      onFilesChange={(next) => setUploads(inp.field, next)}
                      value={values[inp.field] ?? ""}
                      onSummaryChange={(text) => setValues((v) => ({ ...v, [inp.field]: text }))}
                    />
                  ) : (
                    <input
                      id={inp.field}
                      type="text"
                      value={values[inp.field] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [inp.field]: e.target.value }))}
                      className="w-full rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card px-3 py-2 text-forge-sm text-forge-text"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : null}

          {error ? <p className="mt-3 text-forge-sm text-forge-danger">{error}</p> : null}

          {result ? <TaskExecutionResult data={result} /> : null}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-forge-md border border-forgeInk-200 px-4 py-2 text-forge-sm font-medium text-forge-text hover:bg-forgeSurface-sunken"
              onClick={onClose}
            >
              {phase === "done" ? m.modal_close : m.modal_cancel}
            </button>
            {phase === "form" ? (
              <button
                type="button"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-forge-md bg-forgeBrand-600 px-4 py-2 text-forge-sm font-medium text-white hover:bg-forgeBrand-700 disabled:opacity-50"
                onClick={() => void onSubmit()}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {m.modal_run}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
