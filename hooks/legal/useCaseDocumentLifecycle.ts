"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  patchDocumentLifecycle,
  postVerifyExtractedData,
} from "@/lib/legal/cases/legal-cases-api";

export function useCaseDocumentLifecycle(tenantId: string | undefined, caseId: string | undefined) {
  const qc = useQueryClient();
  const transition = useMutation({
    mutationFn: async (args: {
      docId: string;
      new_status: string;
      notes?: string;
      submitted_to_court_acuse?: string;
    }) =>
      patchDocumentLifecycle(tenantId!, caseId!, args.docId, {
        new_status: args.new_status,
        notes: args.notes,
        submitted_to_court_acuse: args.submitted_to_court_acuse,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["legal_case_documents", tenantId, caseId] });
      await qc.invalidateQueries({ queryKey: ["legal_case", tenantId, caseId] });
    },
  });
  const verify = useMutation({
    mutationFn: async (args: { docId: string; body: Record<string, unknown> }) =>
      postVerifyExtractedData(tenantId!, caseId!, args.docId, args.body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["legal_case_documents", tenantId, caseId] });
      await qc.invalidateQueries({ queryKey: ["legal_case", tenantId, caseId] });
    },
  });
  return {
    transitionLifecycle: transition.mutateAsync,
    verifyExtracted: verify.mutateAsync,
    pending: transition.isPending || verify.isPending,
  };
}
