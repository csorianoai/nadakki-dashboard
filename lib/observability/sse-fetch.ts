/**
 * SSE via fetch + ReadableStream (para enviar headers como X-Tenant-ID).
 * EventSource no permite headers custom, por eso usamos fetch cuando no hay stream_url firmado.
 *
 * Uso: await parseSSEStream(url, { headers: { 'X-Tenant-ID': tenant } }, onEvent);
 */

export interface SSECallbacks {
  onMessage?: (data: string, eventId?: string) => void;
  onError?: (err: Error) => void;
  onDone?: () => void;
}

export interface SSEOptions extends RequestInit {
  lastEventId?: string;
}

/**
 * Parsea un stream SSE obtenido por fetch. Llama onMessage por cada evento "data:".
 * Retorna un AbortController para cancelar.
 */
export async function parseSSEStream(
  url: string,
  options: SSEOptions,
  callbacks: SSECallbacks
): Promise<AbortController> {
  const controller = new AbortController();
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    ...(options.headers as Record<string, string>),
  };
  if (options.lastEventId) {
    headers["Last-Event-ID"] = options.lastEventId;
  }

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });
    if (!res.ok) {
      throw new Error(`SSE HTTP ${res.status}`);
    }
    const body = res.body;
    if (!body) {
      throw new Error("No response body");
    }
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    const pump = async (): Promise<void> => {
      const { done, value } = await reader.read();
      if (done) {
        callbacks.onDone?.();
        return;
      }
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() ?? "";
      let lastId: string | undefined;
      for (const line of lines) {
        if (line.startsWith("id:")) lastId = line.slice(3).trim();
        if (line.startsWith("data:")) {
          const data = line.slice(5).trim();
          callbacks.onMessage?.(data, lastId);
        }
      }
      return pump();
    };
    pump().catch((err) => {
      if (err?.name !== "AbortError") callbacks.onError?.(err as Error);
    });
  } catch (err) {
    if ((err as Error)?.name !== "AbortError") callbacks.onError?.(err as Error);
  }
  return controller;
}
