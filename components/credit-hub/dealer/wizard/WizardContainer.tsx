"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Car, ChevronLeft, ChevronRight, FileCheck, User } from "lucide-react";
import { ForgeButton } from "../../primitives/ForgeButton";
import { ForgeCard } from "../../primitives/ForgeCard";
import { useCreateApplication } from "@/lib/credit-hub/hooks/useCreateApplication";
import type { CHCreateApplicationRequest } from "@/lib/credit-hub/types/_generated";
import { celebrateSuccessRespectReduced } from "@/lib/credit-hub/utils/celebrate";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { Step1Applicant } from "./Step1Applicant";
import { Step2Vehicle } from "./Step2Vehicle";
import { Step3Review } from "./Step3Review";

export interface ApplicationFormData {
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  vehicle_year: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_vin: string;
  requested_amount: string;
  down_payment: string;
}

const initialData: ApplicationFormData = {
  applicant_name: "",
  applicant_email: "",
  applicant_phone: "",
  vehicle_year: "",
  vehicle_make: "",
  vehicle_model: "",
  vehicle_vin: "",
  requested_amount: "",
  down_payment: "",
};

const steps = [
  { id: "applicant", title: "Cliente", icon: User },
  { id: "vehicle", title: "Vehículo", icon: Car },
  { id: "review", title: "Revisar", icon: FileCheck },
];

function clean(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function buildCreateApplicationPayload(formData: ApplicationFormData, status: "draft" | "submitted"): CHCreateApplicationRequest {
  const payload: CHCreateApplicationRequest = {
    applicant_name: formData.applicant_name.trim(),
    status,
  };

  const applicantEmail = clean(formData.applicant_email);
  const applicantPhone = clean(formData.applicant_phone);
  const vehicleMake = clean(formData.vehicle_make);
  const vehicleModel = clean(formData.vehicle_model);
  const vehicleVin = clean(formData.vehicle_vin);
  const requestedAmount = clean(formData.requested_amount);
  const downPayment = clean(formData.down_payment);

  if (applicantEmail) payload.applicant_email = applicantEmail;
  if (applicantPhone) payload.applicant_phone = applicantPhone;
  if (formData.vehicle_year) payload.vehicle_year = parseInt(formData.vehicle_year, 10);
  if (vehicleMake) payload.vehicle_make = vehicleMake;
  if (vehicleModel) payload.vehicle_model = vehicleModel;
  if (vehicleVin) payload.vehicle_vin = vehicleVin;
  if (requestedAmount) payload.requested_amount = requestedAmount;
  if (downPayment) payload.down_payment = downPayment;

  return payload;
}

export function WizardContainer() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ApplicationFormData>(initialData);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const createMutation = useCreateApplication();

  const updateField = <K extends keyof ApplicationFormData>(field: K, value: ApplicationFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceedFromStep1 = formData.applicant_name.trim().length >= 2;

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (status: "draft" | "submitted") => {
    setSubmitStatus("submitting");
    try {
      const result = await createMutation.mutateAsync(buildCreateApplicationPayload(formData, status));
      setSubmitStatus("success");
      celebrateSuccessRespectReduced();
      forgeToast.success("¡Solicitud creada exitosamente!");
      setTimeout(() => {
        router.push(`/credit-hub/dealer/applications/${result.application_id}`);
      }, 1500);
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitStatus("error");
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div role="status" aria-live="polite" className="sr-only">
        Paso {currentStep + 1} de {steps.length}: {steps[currentStep].title}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-forge-text-muted">
            Paso {currentStep + 1} de {steps.length}
          </span>
          <span className="font-medium text-forge-text">{steps[currentStep].title}</span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-forge-surface-elevated">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-forge-primary to-forge-accent"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center gap-1">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isComplete ? "var(--forge-success)" : isActive ? "var(--forge-primary)" : "var(--forge-surface-elevated)",
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                >
                  <Icon className={`h-5 w-5 ${isComplete || isActive ? "text-white" : "text-forge-text-muted"}`} />
                </motion.div>
                <span className={`text-xs ${isActive ? "font-medium text-forge-text" : "text-forge-text-muted"}`}>{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <ForgeCard padding="lg">
        <AnimatePresence mode="wait" custom={currentStep}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {currentStep === 0 && <Step1Applicant data={formData} onChange={updateField} />}
            {currentStep === 1 && <Step2Vehicle data={formData} onChange={updateField} />}
            {currentStep === 2 && <Step3Review data={formData} onChange={updateField} onSubmit={handleSubmit} submitStatus={submitStatus} />}
          </motion.div>
        </AnimatePresence>
      </ForgeCard>

      {currentStep < 2 && (
        <div className="flex items-center justify-between gap-3">
          <ForgeButton variant="ghost" onClick={() => router.back()} leftIcon={<ChevronLeft className="h-4 w-4" />} disabled={submitStatus === "submitting"}>
            Cancelar
          </ForgeButton>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <ForgeButton variant="secondary" onClick={handleBack} leftIcon={<ChevronLeft className="h-4 w-4" />}>
                Atrás
              </ForgeButton>
            )}

            <ForgeButton
              variant="primary"
              onClick={handleNext}
              disabled={currentStep === 0 && !canProceedFromStep1}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              {currentStep === 1 ? "Continuar" : "Siguiente"}
            </ForgeButton>
          </div>
        </div>
      )}

      {currentStep === 1 && <p className="text-center text-sm text-forge-text-muted">Información del vehículo es opcional. Puedes agregarla después.</p>}
    </div>
  );
}
