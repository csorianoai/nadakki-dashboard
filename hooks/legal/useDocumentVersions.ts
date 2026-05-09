"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDocumentVersions,
  postDocumentVersion,
} from "@/lib/legal/cases/legal-cases-api";

export interface DocumentVersion {
  version_id: string;
  document_id: string;
  version_number: number;
  content_hash: string;
  parent_version_id: string | null;
  created_at: string | null;
  created_by: string | null;
  reason: string | null;
  content?: string;
}

export interface DocumentVersionsResponse {
  versions: DocumentVersion[];
  count: number;
  document_id: string;
}

export function useDocumentVersions(
  tenantId: string | undefined,
  caseId: string | undefined,
  documentId: string | undefined,
) {
  const qc = useQueryClient();
  const q = useQuery<DocumentVersionsResponse>({
    queryKey: ["legal_document_versions", tenantId ?? "", caseId ?? "", documentId ?? ""],
    enabled: Boolean(tenantId?.trim() && caseId?.trim() && documentId?.trim()),
    queryFn: async () => {
      const raw = await fetchDocumentVersions(tenantId!, caseId!, documentId!);
      return raw as unknown as DocumentVersionsResponse;
    },
  });

  const createVersion = useMutation({
    mutationFn: async (args: { content: string; createdBy?: string; reason?: string }) =>
      postDocumentVersion(tenantId!, caseId!, documentId!, args),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["legal_document_versions"] });
    },
  });

  return {
    ...q,
    createVersion: createVersion.mutateAsync,
    creating: createVersion.isPending,
  };
}
