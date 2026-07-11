import { PlatformApiError } from "@/lib/platformApi";
import { createTenant, updateTenant } from "./api/tenantAdmin";
import type { TenantBrandingPayload } from "./types-platform";
import { validateBranding, validateSlug } from "./types-platform";

export async function submitTenantWizard(data: {
  name: string;
  slug: string;
  locale: string;
  currency: string;
  branding: TenantBrandingPayload;
  plan_id: string;
  core_codes: string[];
  id?: string;
}): Promise<void> {
  const slugErr = validateSlug(data.slug);
  if (slugErr) throw new Error(slugErr);
  const brandErr = validateBranding(data.branding);
  if (brandErr) throw new Error(brandErr);
  try {
    if (data.id) {
      await updateTenant(data.id, data);
    } else {
      await createTenant(data);
    }
  } catch (e) {
    if (e instanceof PlatformApiError && e.status === 409) {
      throw new Error("Este slug ya está en uso");
    }
    if (e instanceof PlatformApiError && e.status === 422) {
      throw new Error(e.detail);
    }
    throw e;
  }
}
