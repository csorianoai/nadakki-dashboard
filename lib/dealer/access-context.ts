/**
 * Explicit dealer / organization-unit access context for Autos and Dealer-Bank.
 *
 * Never invents a dealer, never selects the first dealer or first org unit,
 * and never treats a tenant/dealer mismatch as a valid session.
 */

import type { EntitlementReasonCode } from "@/types/entitlements";

export const DEALER_ACCESS_STORAGE_KEYS = {
  tenantId: "nadakki_tenant_id",
  dealerId: "nadakki_dealer_id",
  organizationUnitId: "nadakki_organization_unit_id",
  dealerTenantId: "nadakki_dealer_tenant_id",
} as const;

export type DealerAccessContext = {
  tenantId: string;
  dealerId: string;
  organizationUnitId: string;
};

export type DealerAccessResolution =
  | { status: "ready"; context: DealerAccessContext; reason_code: null }
  | {
      status: "no_tenant";
      reason_code: "TENANT_NOT_FOUND";
      tenantId: null;
      dealerId: null;
      organizationUnitId: null;
    }
  | {
      status: "no_dealer";
      reason_code: "DEFAULT_DENY";
      tenantId: string | null;
      dealerId: null;
      organizationUnitId: null;
    }
  | {
      status: "tenant_mismatch";
      reason_code: "DEFAULT_DENY";
      tenantId: string;
      dealerId: string;
      organizationUnitId: string | null;
    }
  | {
      status: "no_organization_unit";
      reason_code: "NO_ORGANIZATION_UNIT";
      tenantId: string;
      dealerId: string;
      organizationUnitId: null;
    };

function trimId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readStored(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return trimId(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

function persistDealerBinding(input: {
  dealerId: string | null;
  organizationUnitId: string | null;
  dealerTenantId: string | null;
}): void {
  if (typeof window === "undefined") return;
  try {
    if (input.dealerId) window.localStorage.setItem("nadakki_dealer_id", input.dealerId);
    else window.localStorage.removeItem("nadakki_dealer_id");
    if (input.organizationUnitId) {
      window.localStorage.setItem("nadakki_organization_unit_id", input.organizationUnitId);
    } else {
      window.localStorage.removeItem("nadakki_organization_unit_id");
    }
    if (input.dealerTenantId) {
      window.localStorage.setItem("nadakki_dealer_tenant_id", input.dealerTenantId);
    } else {
      window.localStorage.removeItem("nadakki_dealer_tenant_id");
    }
  } catch {
    // Private mode / quota — ignore; in-memory snapshot still holds.
  }
}

let memory: {
  tenantId: string | null;
  dealerId: string | null;
  organizationUnitId: string | null;
  dealerTenantId: string | null;
} = {
  tenantId: null,
  dealerId: null,
  organizationUnitId: null,
  dealerTenantId: null,
};

/** Test isolation only — production logout uses clearDealerAccessContextFully. */
export function resetDealerAccessMemoryForTests(): void {
  memory = {
    tenantId: null,
    dealerId: null,
    organizationUnitId: null,
    dealerTenantId: null,
  };
}

function readField(
  key: (typeof DEALER_ACCESS_STORAGE_KEYS)[keyof typeof DEALER_ACCESS_STORAGE_KEYS],
  fallback: string | null,
): string | null {
  return readStored(key) ?? fallback;
}

export function setDealerAccessContext(input: {
  tenantId: string;
  dealerId: string;
  organizationUnitId?: string | null;
}): DealerAccessResolution {
  const tenantId = trimId(input.tenantId);
  const dealerId = trimId(input.dealerId);
  const organizationUnitId = trimId(input.organizationUnitId);

  if (!tenantId || !dealerId) {
    return resolveDealerAccessContext();
  }

  memory = {
    tenantId,
    dealerId,
    organizationUnitId,
    dealerTenantId: tenantId,
  };

  persistDealerBinding({
    dealerId,
    organizationUnitId,
    dealerTenantId: tenantId,
  });

  return resolveDealerAccessContext();
}

export function clearDealerAccessContext(): void {
  memory = {
    tenantId: readStored(DEALER_ACCESS_STORAGE_KEYS.tenantId),
    dealerId: null,
    organizationUnitId: null,
    dealerTenantId: null,
  };
  persistDealerBinding({
    dealerId: null,
    organizationUnitId: null,
    dealerTenantId: null,
  });
}
export function clearDealerAccessContextFully(): void {
  memory = {
    tenantId: null,
    dealerId: null,
    organizationUnitId: null,
    dealerTenantId: null,
  };
  persistDealerBinding({
    dealerId: null,
    organizationUnitId: null,
    dealerTenantId: null,
  });
}

export function resolveDealerAccessContext(): DealerAccessResolution {
  const tenantId = readField(DEALER_ACCESS_STORAGE_KEYS.tenantId, memory.tenantId);
  const dealerId = readField(DEALER_ACCESS_STORAGE_KEYS.dealerId, memory.dealerId);
  const organizationUnitId = readField(
    DEALER_ACCESS_STORAGE_KEYS.organizationUnitId,
    memory.organizationUnitId,
  );
  const dealerTenantId = readField(
    DEALER_ACCESS_STORAGE_KEYS.dealerTenantId,
    memory.dealerTenantId,
  );

  if (!tenantId) {
    return {
      status: "no_tenant",
      reason_code: "TENANT_NOT_FOUND",
      tenantId: null,
      dealerId: null,
      organizationUnitId: null,
    };
  }

  if (!dealerId) {
    return {
      status: "no_dealer",
      reason_code: "DEFAULT_DENY",
      tenantId,
      dealerId: null,
      organizationUnitId: null,
    };
  }

  if (dealerTenantId && dealerTenantId !== tenantId) {
    return {
      status: "tenant_mismatch",
      reason_code: "DEFAULT_DENY",
      tenantId,
      dealerId,
      organizationUnitId,
    };
  }

  if (!organizationUnitId) {
    return {
      status: "no_organization_unit",
      reason_code: "NO_ORGANIZATION_UNIT",
      tenantId,
      dealerId,
      organizationUnitId: null,
    };
  }

  return {
    status: "ready",
    context: { tenantId, dealerId, organizationUnitId },
    reason_code: null,
  };
}

export function dealerAccessDenyReason(): EntitlementReasonCode | null {
  const resolved = resolveDealerAccessContext();
  return resolved.status === "ready" ? null : resolved.reason_code;
}

export function selectedDealerIdentity(): {
  tenantId: string;
  dealerId: string;
  organizationUnitId: string | null;
} | null {
  const resolved = resolveDealerAccessContext();
  if (resolved.status === "ready") {
    return {
      tenantId: resolved.context.tenantId,
      dealerId: resolved.context.dealerId,
      organizationUnitId: resolved.context.organizationUnitId,
    };
  }
  if (resolved.status === "no_organization_unit") {
    return {
      tenantId: resolved.tenantId,
      dealerId: resolved.dealerId,
      organizationUnitId: null,
    };
  }
  return null;
}

export function accessContextHeaders(context: DealerAccessContext): Record<string, string> {
  return {
    "X-Tenant-ID": context.tenantId,
    "X-Dealer-ID": context.dealerId,
    "X-Organization-Unit-ID": context.organizationUnitId,
  };
}

export function accessContextBody(context: DealerAccessContext): {
  tenant_id: string;
  dealer_id: string;
  organization_unit_id: string;
} {
  return {
    tenant_id: context.tenantId,
    dealer_id: context.dealerId,
    organization_unit_id: context.organizationUnitId,
  };
}
