import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { ExtractedDocumentData, MockUploadApiResponse } from "@/lib/shared/document-upload-types";

export const runtime = "nodejs";

function buildMockExtraction(fileName: string, size: number): ExtractedDocumentData {
  return {
    document_type: "documento_legal",
    parties: ["Parte demandante (revisar)", "Parte demandada (revisar)"],
    amount: undefined,
    key_clauses: [
      "Cláusula de jurisdicción y competencia — verificar contra datos reales del expediente.",
      "Cláusula de notificación — revisar domicilios y correos en el documento original.",
    ],
    legal_citations: [],
    risk_alerts: ["Extracción simulada (MOCK). No utilizar como dictamen; conectar OCR/IA real en producción."],
    plain_text_summary: [
      `[Extracción automática simulada — archivo: ${fileName}, ${size} bytes]`,
      "",
      "En entorno MOCK el sistema no lee el binario del PDF/DOC. Conecte el backend de OCR para obtener texto fiel.",
      "",
      "Texto de ejemplo para pruebas del flujo document-driven:",
      "Entre las partes comparecen... / Las partes convienen... / Notifíquese y ejecútese...",
    ].join("\n"),
    suggested_case_title: `Caso — ${fileName.replace(/\.[^.]+$/, "").slice(0, 80)}`,
    raw_fields: { source: "mock_upload", original_name: fileName, size },
  };
}

/** POST multipart: campo `file`. MOCK: OCR/IA simulado hasta conectar backend real. */
export async function POST(request: Request): Promise<NextResponse<MockUploadApiResponse | { error: { message: string } }>> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: { message: "Cuerpo inválido" } }, { status: 400 });
  }

  const entry = formData.get("file");
  if (!entry || typeof entry === "string") {
    return NextResponse.json({ error: { message: "Falta el archivo (campo file)" } }, { status: 400 });
  }

  const file = entry as File;
  const name = file.name || "documento";
  const size = typeof file.size === "number" ? file.size : 0;

  const body: MockUploadApiResponse = {
    file_id: randomUUID(),
    url: undefined,
    extracted_data: buildMockExtraction(name, size),
  };

  return NextResponse.json(body);
}
