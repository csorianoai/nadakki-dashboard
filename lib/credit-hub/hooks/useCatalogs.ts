"use client";

import { useEffect, useState } from "react";
import { useTenantConfig } from "./useTenantConfig";

export interface Catalogs {
  vehicleBrands: readonly string[];
  banks: readonly string[];
  contractTypes: readonly string[];
  incomeConcepts: readonly string[];
  paymentFrequencies: readonly string[];
  relationshipTypes: readonly string[];
}

/** @deprecated Use `Catalogs` */
export type LoadedCatalogs = Catalogs;

const CATALOG_LOADERS: Record<string, () => Promise<Catalogs>> = {
  DO: async () => {
    const [brands, banks, employment] = await Promise.all([
      import("@/lib/credit/catalogs/do/vehicle-brands"),
      import("@/lib/credit/catalogs/do/banks"),
      import("@/lib/credit/catalogs/do/employment-types"),
    ]);
    return {
      vehicleBrands: brands.DO_VEHICLE_BRANDS,
      banks: banks.DO_BANKS,
      contractTypes: employment.DO_CONTRACT_TYPES,
      incomeConcepts: employment.DO_INCOME_CONCEPTS,
      paymentFrequencies: employment.DO_PAYMENT_FREQUENCIES,
      relationshipTypes: employment.DO_RELATIONSHIP_TYPES,
    };
  },
};

export function useCatalogs(): { catalogs: Catalogs | null; loading: boolean } {
  const { tenantConfig, loading: configLoading } = useTenantConfig();
  const country = tenantConfig?.country_code ?? "DO";

  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loader = CATALOG_LOADERS[country] ?? CATALOG_LOADERS.DO;
    setLoading(true);
    loader()
      .then((data) => {
        if (mounted) setCatalogs(data);
      })
      .catch((err) => {
        console.error("[useCatalogs] Failed to load:", err);
        if (mounted) setCatalogs(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [country]);

  return {
    catalogs,
    loading: loading || configLoading,
  };
}
