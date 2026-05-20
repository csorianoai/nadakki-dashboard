"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import NavigationBar from "@/components/ui/NavigationBar";
import { StepNavigation } from "@/components/admin/onboarding/StepNavigation";
import { StepProgressBar } from "@/components/admin/onboarding/StepProgressBar";
import { BasicInfoStep } from "@/components/admin/onboarding/steps/BasicInfoStep";
import { BrandingStep } from "@/components/admin/onboarding/steps/BrandingStep";
import { CoresStep } from "@/components/admin/onboarding/steps/CoresStep";
import { UsersStep } from "@/components/admin/onboarding/steps/UsersStep";
import { CredentialsStep } from "@/components/admin/onboarding/steps/CredentialsStep";
import { ReviewStep } from "@/components/admin/onboarding/steps/ReviewStep";
import {
  hasCreditCoreSelected,
  isTenantOnboardingFeatureEnabled,
  useTenantOnboarding,
} from "@/hooks/useTenantOnboarding";

function useStepAwareness(step: number) {
  const { state } = useTenantOnboarding();
  const router = useRouter();
  const credit = hasCreditCoreSelected(state);

  useEffect(() => {
    if (step === 5 && !credit) {
      router.replace("/tenant-onboarding/6");
    }
  }, [credit, router, step]);
}

function TenantOnboardingStepBody({ step }: { step: number }) {
  useStepAwareness(step);
  const { state, saving } = useTenantOnboarding();

  return (
    <>
      <NavigationBar backHref="/admin">
        {saving ? <span className="text-xs text-amber-200">Guardando borrador…</span> : null}
      </NavigationBar>

      <header className="mb-6 max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-purple-300/90">NADAKKI admin</p>
        <h1 className="text-2xl font-bold text-white sm:text-3xl" data-testid="onboarding-title">
          Alta de tenant
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Asistente en 6 pasos. Borrador local + autoguardado en servidor cada 30s.
        </p>
        <Link href="/admin" className="mt-2 inline-block text-xs text-cyan-400 hover:underline md:hidden">
          ← Volver a administración
        </Link>
      </header>

      <StepProgressBar currentStep={step} state={state} />

      <div className="mx-auto max-w-3xl">
        {step === 1 && <BasicInfoStep />}
        {step === 2 && <BrandingStep />}
        {step === 3 && <CoresStep />}
        {step === 4 && <UsersStep />}
        {step === 5 && hasCreditCoreSelected(state) && <CredentialsStep />}
        {step === 5 && !hasCreditCoreSelected(state) && null}
        {step === 6 && <ReviewStep />}
      </div>

      {step >= 1 && step <= 5 && <StepNavigation step={step} />}
    </>
  );
}

export default function TenantOnboardingStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step: raw } = use(params);

  if (!isTenantOnboardingFeatureEnabled()) {
    notFound();
  }

  const stepNum = Number.parseInt(raw, 10);
  if (!Number.isFinite(stepNum) || stepNum < 1 || stepNum > 6 || String(stepNum) !== raw) {
    notFound();
  }

  return <TenantOnboardingStepBody step={stepNum} />;
}
