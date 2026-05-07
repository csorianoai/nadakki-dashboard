"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GenerateDocumentRequestBody } from "@/lib/legal/cases/case-types";
import {
  fetchGeneratedDocument,
  fetchGeneratedDocuments,
  postGenerateDocument,
} from "@/lib/legal/cases/legal-cases-api";

const qkGenerated = (tenantId: string, caseId: string) =>
  ["legal_generated_documents", tenantId, caseId] as const;
const qkGeneratedOne = (tenantId: string, caseId: string, docId: string) =>
  ["legal_generated_document", tenantId, caseId, docId] as const;

export function useGeneratedDocuments(tenantId: string | undefined, caseId: string | undefined) {
  return useQuery({
    queryKey: qkGenerated(tenantId ?? "", caseId ?? ""),
    enabled: Boolean(tenantId?.trim() && caseId?.trim()),
    queryFn: async () => fetchGeneratedDocuments(tenantId!, caseId!),
  });
}

export function useGeneratedDocument(
  tenantId: string | undefined,
  caseId: string | undefined,
  docId: string | undefined
) {
  return useQuery({
    queryKey: qkGeneratedOne(tenantId ?? "", caseId ?? "", docId ?? ""),
    enabled: Boolean(tenantId?.trim() && caseId?.trim() && docId?.trim()),
    queryFn: async () => fetchGeneratedDocument(tenantId!, caseId!, docId!),
  });
}

export function useGenerateDocument(tenantId: string | undefined, caseId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: GenerateDocumentRequestBody) =>
      postGenerateDocument(tenantId!, caseId!, body),
    onSuccess: async () => {
      if (!tenantId?.trim() || !caseId?.trim()) return;
      await qc.invalidateQueries({ queryKey: qkGenerated(tenantId, caseId) });
      await qc.invalidateQueries({ queryKey: ["legal_case", tenantId, caseId] });
    },
  });
}
