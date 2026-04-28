"use client";

import { useEffect, useState } from "react";
import { useTenantConfig } from "./useTenantConfig";

export type LoadedCatalogs = {
  vehicleBrands: readonly string[];
  banks: readonly string[];
  contractTypes: readonly string[];
  incomeConcepts: readonly string[];
  paymentFrequencies: readonly string[];
};

const CATALOGS_BY_COUNTRY: Record<string, () => Promise<LoadedCatalogs>> = {
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
    };
  },
};

export function useCatalogs(): { catalogs: LoadedCatalogs | null; loading: boolean } {
  const { tenantConfig, loading: configLoading } = useTenantConfig();
  const country = tenantConfig?.country_code ?? "DO";

  const [catalogs, setCatalogs] = useState<LoadedCatalogs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const loader = CATALOGS_BY_COUNTRY[country] ?? CATALOGS_BY_COUNTRY.DO;
    loader()
      .then((data) => {
        if (!cancelled) setCatalogs(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  return {
    catalogs,
    loading: loading || configLoading,
  };
}
