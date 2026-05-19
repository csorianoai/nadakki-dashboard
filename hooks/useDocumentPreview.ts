"use client";

import { useCallback, useEffect, useState } from "react";
import {
  bankPreviewJsonUrl,
  buildPreviewFetchInit,
  type DocumentPreviewMetadata,
} from "@/lib/bank/document-preview-api";

export interface UseDocumentPreviewConfig {
  documentId: string;
  applicationId: string;
  tenantId: string;
  authToken?: string;
}

export function useDocumentPreview(config: UseDocumentPreviewConfig) {
  const [metadata, setMetadata] = useState<DocumentPreviewMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    if (!config.tenantId.trim()) {
      setError("Seleccione un tenant válido.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const url = bankPreviewJsonUrl(config.applicationId, config.documentId);
      const response = await fetch(
        url,
        buildPreviewFetchInit(config.tenantId, config.authToken, {
          headers: {
            Accept: "application/json",
          },
          cache: "default",
        })
      );

      if (!response.ok) {
        throw new Error(`Preview meta falló (${response.status})`);
      }

      const data = (await response.json()) as DocumentPreviewMetadata;
      setMetadata(data);
    } catch (err) {
      setMetadata(null);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [config.applicationId, config.authToken, config.documentId, config.tenantId]);

  useEffect(() => {
    void fetchMetadata();
  }, [fetchMetadata]);

  return {
    metadata,
    loading,
    error,
    refetch: fetchMetadata,
  };
}

export type { DocumentPreviewMetadata } from "@/lib/bank/document-preview-api";
