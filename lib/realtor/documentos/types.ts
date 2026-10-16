/** Estado de un documento de una operación. */
export type DemoDocStatus = "borrador" | "enviado" | "firmado";
/** Estados del contrato C-RE-OLA3 (C-RE-DOCUMENTOS): registrar → subir → archivar. */
export type ApiDocStatus = "pending_upload" | "active" | "archived";
export type DocStatus = DemoDocStatus | ApiDocStatus;
export const DOC_STATUSES: readonly DocStatus[] = ["borrador", "enviado", "firmado"];
export const API_DOC_STATUSES: readonly DocStatus[] = ["pending_upload", "active", "archived"];

export type OperationDoc = {
  id: string;
  name: string;
  operation: { es: string; en: string };
  status: DocStatus;
};

/** Visto bueno del abogado de Florida (B5). Sin este objeto la plantilla NO está aprobada. */
export type LawyerApproval = { reviewer: string; date: string };

export type Template = {
  id: string;
  name: string;
  kind: { es: string; en: string };
  lawyerApproval: LawyerApproval | null;
};
