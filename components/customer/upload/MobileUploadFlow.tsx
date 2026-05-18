"use client";

import { useCallback, useMemo, useState } from "react";

import { FilePickerInput } from "@/components/customer/upload/FilePickerInput";
import { FilePreview } from "@/components/customer/upload/FilePreview";
import { MobileCameraInput } from "@/components/customer/upload/MobileCameraInput";
import { TokenValidator } from "@/components/customer/upload/TokenValidator";
import { UploadFailure } from "@/components/customer/upload/UploadFailure";
import { UploadProgress } from "@/components/customer/upload/UploadProgress";
import { UploadSuccess } from "@/components/customer/upload/UploadSuccess";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { CLIENT_MAX_FILE_BYTES } from "@/lib/customer/upload/constants";
import { compressImageIfNeeded } from "@/lib/customer/upload/compressImage";
import { fileToBase64 } from "@/lib/customer/upload/fileToBase64";
import { messages } from "@/lib/customer/upload/messages";
import type { UploadValidateOk } from "@/lib/customer/upload/validateUploadToken";
import { postJsonWithProgress } from "@/lib/customer/upload/postUploadXhr";

type FlowInnerProps = {
  token: string;
  applicationId: string;
  stipulationId: string;
  meta: UploadValidateOk;
};

function FlowInner({ token, applicationId, stipulationId, meta }: FlowInnerProps) {
  const online = useOnlineStatus();
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<"pick" | "preview" | "uploading" | "success" | "error">("pick");
  const [pct, setPct] = useState(0);
  const [errMsg, setErrMsg] = useState<string | undefined>();
  const [abortCtl, setAbortCtl] = useState<AbortController | null>(null);
  const [compressing, setCompressing] = useState(false);

  const accept = useMemo(() => meta.allowed_types.join(","), [meta.allowed_types]);
  const maxBytes = useMemo(
    () => Math.min(CLIENT_MAX_FILE_BYTES, meta.max_size_mb * 1024 * 1024),
    [meta.max_size_mb],
  );

  const trySetFile = useCallback(
    (f: File | null) => {
      if (!f) return;
      if (!online) {
        setErrMsg(messages.offline);
        setPhase("error");
        return;
      }
      if (f.size > maxBytes) {
        setErrMsg(messages.fileTooLarge);
        setPhase("error");
        return;
      }
      if (meta.allowed_types.length && f.type && !meta.allowed_types.includes(f.type)) {
        setErrMsg(messages.typeNotAllowed);
        setPhase("error");
        return;
      }
      setErrMsg(undefined);
      setFile(f);
      setPhase("preview");
    },
    [maxBytes, meta.allowed_types, online],
  );

  const resetRetry = useCallback(() => {
    setFile(null);
    setPhase("pick");
    setErrMsg(undefined);
    setPct(0);
  }, []);

  const submit = useCallback(async () => {
    if (!file) return;
    if (!online) {
      setErrMsg(messages.offline);
      setPhase("error");
      return;
    }
    const ctl = new AbortController();
    setAbortCtl(ctl);
    setPhase("uploading");
    setPct(0);
    setCompressing(true);
    let blob: Blob;
    try {
      blob = await compressImageIfNeeded(file);
    } finally {
      setCompressing(false);
    }
    const sendFile = blob instanceof File ? blob : new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: blob.type });
    if (sendFile.size > maxBytes) {
      setErrMsg(messages.fileTooLarge);
      setPhase("error");
      setAbortCtl(null);
      return;
    }
    const b64 = await fileToBase64(sendFile);
    const url = `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/stipulations/${encodeURIComponent(stipulationId)}/upload`;
    const body = {
      token,
      filename: sendFile.name,
      content_type: sendFile.type || "application/octet-stream",
      content_base64: b64,
    };
    const res = await postJsonWithProgress(url, body, setPct, ctl.signal);
    setAbortCtl(null);
    if (res.ok === true) {
      setPhase("success");
    } else {
      setErrMsg(res.message || messages.failureTitle);
      setPhase("error");
    }
  }, [applicationId, file, maxBytes, online, stipulationId, token]);

  if (phase === "success") {
    return <UploadSuccess />;
  }

  if (!online) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-amber-900" role="status">
        {messages.offline}
      </div>
    );
  }

  if (phase === "error") {
    return <UploadFailure message={errMsg} onRetry={resetRetry} />;
  }

  if (phase === "uploading") {
    return (
      <UploadProgress
        percent={pct}
        label={compressing ? messages.compressing : messages.uploading}
        onCancel={() => {
          abortCtl?.abort();
          setAbortCtl(null);
          setPhase("preview");
        }}
      />
    );
  }

  if (phase === "preview" && file) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">{messages.previewTitle}</h2>
        <FilePreview file={file} />
        <button
          type="button"
          onClick={() => setPhase("pick")}
          className="min-h-[44px] w-full rounded-lg border border-slate-300 py-3 text-sm font-medium text-slate-800"
        >
          {messages.changeFile}
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          className="min-h-[44px] w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white"
        >
          {messages.confirmUpload}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-slate-700">{messages.selectFile}</p>
      <p className="text-center text-xs text-slate-500">{messages.privacyNote}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <MobileCameraInput id="cam" accept={accept} onFile={(f) => trySetFile(f)} />
        <FilePickerInput id="pick" accept={accept} onFiles={(list) => trySetFile(list?.[0] ?? null)} />
      </div>
    </div>
  );
}

type MobileUploadFlowProps = {
  token: string;
  applicationId: string;
  stipulationId: string;
};

export function MobileUploadFlow({ token, applicationId, stipulationId }: MobileUploadFlowProps) {
  return (
    <TokenValidator token={token} applicationId={applicationId} stipulationId={stipulationId}>
      {(meta) => (
        <FlowInner
          token={token}
          applicationId={applicationId}
          stipulationId={stipulationId}
          meta={meta}
        />
      )}
    </TokenValidator>
  );
}
