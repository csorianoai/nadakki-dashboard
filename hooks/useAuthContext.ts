"use client";

import { useMemo } from "react";

export interface AuthContextValue {
  tenantId: string;
  userId?: string;
  role?: "BANK_ANALYST" | "DEALER" | "ADMIN";
}

const PROD_CREDICEFI_TENANT_ID = "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242";

export function useAuthContext(): AuthContextValue {
  // V1: read from session/JWT. MVP: env-driven default for testing.
  return useMemo(
    () => ({
      tenantId:
        process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? PROD_CREDICEFI_TENANT_ID,
    }),
    [],
  );
}
