export type XhrJsonResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; body: unknown; message: string };

export function postJsonWithProgress(
  url: string,
  body: Record<string, unknown>,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<XhrJsonResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const payload = JSON.stringify(body);

    const onAbort = () => {
      xhr.abort();
    };
    signal?.addEventListener("abort", onAbort);

    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100));
      else onProgress(0);
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) return;
      signal?.removeEventListener("abort", onAbort);
      let parsed: unknown = null;
      try {
        parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        parsed = xhr.responseText;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ ok: true, status: xhr.status, body: parsed });
      } else {
        resolve({
          ok: false,
          status: xhr.status,
          body: parsed,
          message: typeof parsed === "object" && parsed && "detail" in parsed ? String((parsed as { detail?: unknown }).detail) : xhr.statusText,
        });
      }
    };

    xhr.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      resolve({ ok: false, status: 0, body: null, message: "network_error" });
    };

    xhr.send(payload);
  });
}
