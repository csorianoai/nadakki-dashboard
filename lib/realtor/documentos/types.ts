/** Estado de un documento de una operación. */
export type DocStatus = "borrador" | "enviado" | "firmado";
export const DOC_STATUSES: readonly DocStatus[] = ["borrador", "enviado", "firmado"];

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
