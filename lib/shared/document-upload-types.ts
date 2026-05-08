/** Tipos compartidos para upload document-driven (mock OCR/IA → producción). */

export type UploadFileStatus = "uploading" | "processing" | "ready" | "error";

export interface ExtractedDocumentData {
  document_type?: string;
  parties?: string[];
  amount?: string;
  key_clauses?: string[];
  legal_citations?: string[];
  risk_alerts?: string[];
  /** Texto plano combinado para APIs que aún esperan `texto` / `document_text`. */
  plain_text_summary?: string;
  suggested_case_title?: string;
  raw_fields?: Record<string, unknown>;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  /** Id devuelto por el backend tras subida (mock o real). */
  serverFileId?: string;
  status: UploadFileStatus;
  progress?: number;
  extractedData?: ExtractedDocumentData;
  error?: string;
}

export interface MockUploadApiResponse {
  file_id: string;
  url?: string;
  extracted_data: ExtractedDocumentData;
}
