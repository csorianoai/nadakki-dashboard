"use client";

import { useRef } from "react";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export function CaseDocumentUploader({
  busy,
  onFile,
}: {
  busy?: boolean;
  onFile: (file: File) => void;
}) {
  const m = useLegalCasesMessages();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input
        ref={ref}
        type="file"
        className="sr-only"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        className="rounded-forge-sm bg-forgeBrand-600 px-4 py-2 text-sm font-medium text-forgeInk-50 hover:bg-forgeBrand-700 disabled:opacity-50"
        onClick={() => ref.current?.click()}
      >
        {m.documents.upload}
      </button>
    </div>
  );
}
