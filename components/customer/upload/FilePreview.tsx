"use client";

import { useEffect, useMemo } from "react";

type FilePreviewProps = {
  file: File;
};

export function FilePreview({ file }: FilePreviewProps) {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  if (isPdf) {
    return (
      <iframe
        title="Vista previa PDF"
        src={url}
        className="mt-2 h-64 w-full rounded border border-slate-200"
      />
    );
  }

  if (isImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="mt-2 max-h-64 w-full rounded border border-slate-200 object-contain" />
    );
  }

  return <p className="mt-2 text-sm text-slate-600">{file.name}</p>;
}
