"use client";

import { ForgeLogo } from "@/components/credit-hub/brand/ForgeLogo";
import { ForgeAIBadge } from "@/components/credit-hub/brand/ForgeAIBadge";
import { ForgeBadge } from "@/components/credit-hub/primitives/ForgeBadge";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { ForgeInput } from "@/components/credit-hub/primitives/ForgeInput";
import { ForgeProgress } from "@/components/credit-hub/primitives/ForgeProgress";
import { ForgeSelect } from "@/components/credit-hub/primitives/ForgeSelect";
import { ForgeSkeleton } from "@/components/credit-hub/primitives/ForgeSkeleton";
import { ForgePageHeader } from "@/components/credit-hub/system/ForgePageHeader";

export default function ForgeComponentsDemoPage() {
  return (
    <div data-portal="dealer" className="min-h-screen bg-forge-bg p-4 text-forge-text md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <ForgePageHeader title="Forge Components" subtitle="Foundation primitives demo" />
        <ForgeCard className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <ForgeLogo size="lg" animated />
            <ForgeAIBadge />
            <ForgeBadge tone="success">Ready</ForgeBadge>
            <ForgeBadge tone="warning">Próximamente</ForgeBadge>
          </div>

          <div className="flex flex-wrap gap-3">
            <ForgeButton>Primary</ForgeButton>
            <ForgeButton variant="secondary">Secondary</ForgeButton>
            <ForgeButton variant="ghost">Ghost</ForgeButton>
            <ForgeButton variant="danger">Danger</ForgeButton>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ForgeInput label="Applicant" placeholder="—" helperText="Placeholder only" />
            <ForgeSelect label="Status" defaultValue="">
              <option value="">—</option>
            </ForgeSelect>
          </div>

          <ForgeProgress value={35} label="Foundation progress sample" />
          <ForgeSkeleton className="h-16" />
        </ForgeCard>
      </div>
    </div>
  );
}
