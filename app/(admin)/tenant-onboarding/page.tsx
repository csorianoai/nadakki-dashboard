import { notFound, redirect } from "next/navigation";

export default function TenantOnboardingIndexPage() {
  if (process.env.NEXT_PUBLIC_FEATURE_TENANT_ONBOARDING !== "true") {
    notFound();
  }
  redirect("/tenant-onboarding/1");
}
