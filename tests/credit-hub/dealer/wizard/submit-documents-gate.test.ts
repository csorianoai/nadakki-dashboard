import { CreditCoreApiError } from "@/lib/credit-hub/api/creditCoreClient";
import {
  DocumentsGateError,
  documentsIncompleteMessage,
  uploadThenDispatch,
  type PendingUploadInput,
} from "@/lib/credit-hub/dealer/wizard-submit-documents";

const file = (name: string) => new File(["x"], name);
const label = (code: string) => ({ CEDULA_FRENTE: "Cédula (frente)" })[code] ?? code;

function setup(opts: { failKeys?: string[]; complete?: boolean; missing?: string[]; dispatchError?: unknown } = {}) {
  const calls: string[] = [];
  const statuses = new Map<string, string>();
  const files = new Map<string, PendingUploadInput>([
    ["a", { file: file("a.png"), status: "selected" }],
    ["b", { file: file("b.png"), status: "selected" }],
  ]);
  const upload = jest.fn(async (key: string) => {
    calls.push(`upload:${key}`);
    if (opts.failKeys?.includes(key)) throw new Error("boom");
  });
  const getCompleteness = jest.fn(async () => {
    calls.push("completeness");
    return { total_required: 2, total_uploaded: 2, missing: opts.missing ?? [], complete: opts.complete ?? true };
  });
  const dispatch = jest.fn(async () => {
    calls.push("execute");
    if (opts.dispatchError) throw opts.dispatchError;
    return { status: "ok" };
  });
  const run = (f = files) =>
    uploadThenDispatch({
      files: f,
      upload,
      onStatus: (k, s) => statuses.set(k, s),
      getCompleteness,
      labelForMissing: label,
      dispatch,
    });
  return { calls, statuses, files, upload, getCompleteness, dispatch, run };
}

describe("uploadThenDispatch", () => {
  it("(a) una subida rechazada no despacha y deja el fichero en error", async () => {
    const t = setup({ failKeys: ["b"] });
    await expect(t.run()).rejects.toBeInstanceOf(DocumentsGateError);
    expect(t.dispatch).not.toHaveBeenCalled();
    expect(t.getCompleteness).not.toHaveBeenCalled();
    expect(t.statuses.get("b")).toBe("error");
    expect(t.statuses.get("a")).toBe("uploaded");
  });

  it("(b) completeness incompleta no despacha y lista los faltantes", async () => {
    const t = setup({ complete: false, missing: ["CEDULA_FRENTE"] });
    await expect(t.run()).rejects.toThrow("Cédula (frente)");
    expect(t.dispatch).not.toHaveBeenCalled();
  });

  it("(c) orden: uploads → completeness → execute", async () => {
    const t = setup();
    await t.run();
    expect(t.calls).toEqual(["upload:a", "upload:b", "completeness", "execute"]);
  });

  it("(d) 409 documents_incomplete se traduce a lista legible", () => {
    const err = new CreditCoreApiError("x", 409, { detail: { error: "documents_incomplete", missing: ["CEDULA_FRENTE"] } });
    expect(documentsIncompleteMessage(err, label)).toContain("Cédula (frente)");
    expect(documentsIncompleteMessage(new CreditCoreApiError("x", 500, {}), label)).toBeNull();
    expect(documentsIncompleteMessage(new Error("x"), label)).toBeNull();
  });

  it("(d) el 409 del despacho se propaga (el borrador no se limpia en el proveedor)", async () => {
    const err = new CreditCoreApiError("x", 409, { error: "documents_incomplete", missing: [] });
    const t = setup({ dispatchError: err });
    await expect(t.run()).rejects.toBe(err);
  });

  it("(e) el reintento sube solo los fallidos y llega al éxito", async () => {
    const t = setup({ failKeys: ["b"] });
    await expect(t.run()).rejects.toBeInstanceOf(DocumentsGateError);
    const retry = new Map<string, PendingUploadInput>([
      ["a", { file: file("a.png"), status: "uploaded" }],
      ["b", { file: file("b.png"), status: "error" }],
    ]);
    t.calls.length = 0;
    t.upload.mockImplementation(async (key: string) => void t.calls.push(`upload:${key}`));
    await t.run(retry);
    expect(t.calls).toEqual(["upload:b", "completeness", "execute"]);
  });
});
