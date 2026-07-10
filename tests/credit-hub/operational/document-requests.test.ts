import { documentRequestStatusMeta } from "@/lib/credit-hub/operational/document-requests";

describe("documentRequestStatusMeta", () => {
  test("maps statuses to Spanish labels", () => {
    expect(documentRequestStatusMeta("REQUESTED").label).toBe("Solicitado");
    expect(documentRequestStatusMeta("UPLOADED").label).toBe("Subido por dealer");
    expect(documentRequestStatusMeta("ACCEPTED").label).toBe("Aceptado");
    expect(documentRequestStatusMeta("REJECTED").label).toBe("Rechazado");
  });
});
