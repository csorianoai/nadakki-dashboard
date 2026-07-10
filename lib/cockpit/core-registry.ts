import type { CoreSummaryItem } from "./types";
import { coreCode } from "./normalize";

/** Six platform cores — always render all cards. */
export const PLATFORM_CORE_ORDER = [
  "credit_hub",
  "legal",
  "marketing",
  "sic",
  "nauta",
  "contable",
] as const;

export type PlatformCoreCode = (typeof PLATFORM_CORE_ORDER)[number];

export const CORE_COLOR_FALLBACK: Record<PlatformCoreCode, string> = {
  credit_hub: "#a78bfa",
  legal: "#3b82f6",
  marketing: "#22c55e",
  sic: "#f59e0b",
  nauta: "#06b6d4",
  contable: "#14b8a6",
};

export const CORE_INITIALS: Record<PlatformCoreCode, string> = {
  credit_hub: "CR",
  legal: "LG",
  marketing: "MK",
  sic: "SI",
  nauta: "NA",
  contable: "CT",
};

export const CORE_DISPLAY_FALLBACK: Record<PlatformCoreCode, string> = {
  credit_hub: "Credit Hub",
  legal: "Legal Core",
  marketing: "Marketing",
  sic: "SIC",
  nauta: "Nauta",
  contable: "Contable",
};

export const CORE_CHIP_DOT: Record<string, string> = {
  credit_hub: "#a78bfa",
  legal: "#3b82f6",
  marketing: "#22c55e",
  sic: "#f59e0b",
  nauta: "#06b6d4",
  contable: "#14b8a6",
};

export function mergeToSixCores(
  fromApi: CoreSummaryItem[],
  demoFactory: (code: PlatformCoreCode) => CoreSummaryItem,
): CoreSummaryItem[] {
  const byCode = new Map<string, CoreSummaryItem>();
  for (const c of fromApi) {
    const k = coreCode(c);
    if (k) byCode.set(k, { ...c, core_code: k });
  }
  return PLATFORM_CORE_ORDER.map((code) => {
    const hit = byCode.get(code);
    if (hit) {
      return {
        ...hit,
        core_code: code,
        color_hex: hit.color_hex ?? CORE_COLOR_FALLBACK[code],
        display_name: hit.display_name ?? CORE_DISPLAY_FALLBACK[code],
      };
    }
    return demoFactory(code);
  });
}
