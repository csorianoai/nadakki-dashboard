/** jsdom no trae Response: respuesta minima con lo que usa el codigo (ok, status, json). */
export function respuesta(cuerpo: unknown, status = 200): Promise<Response> {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => cuerpo } as unknown as Response);
}
