"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type ActivationStatus =
  | "CREATED"
  | "PROFILE_INCOMPLETE"
  | "CONFIGURATION"
  | "VALIDATION"
  | "REJECTED"
  | "REOPENED"
  | "READY_FOR_SANDBOX"
  | "READY_FOR_PRODUCTION"
  | "ACTIVE"
  | "SUSPENDED";

interface StatusDisplayConfig {
  icon: typeof Loader2;
  title: string;
  message: string;
  action?: string;
  color: string;
}

const STATUS_CONFIG: Record<ActivationStatus, StatusDisplayConfig> = {
  CREATED: {
    icon: Loader2,
    title: "Solicitud recibida",
    message: "Tu solicitud está en la cola de revisión. Te contactaremos en 24 a 48 horas.",
    action: "Verifica tu correo (y spam) para confirmar tu email.",
    color: "text-blue-500",
  },
  PROFILE_INCOMPLETE: {
    icon: AlertCircle,
    title: "Perfil incompleto",
    message: "Necesitamos información adicional para continuar con tu solicitud.",
    action: "Completa los datos de tu perfil institucional.",
    color: "text-yellow-500",
  },
  CONFIGURATION: {
    icon: Clock,
    title: "En configuración",
    message: "Estamos configurando tu cuenta. Este proceso puede tomar algunas horas.",
    color: "text-blue-500",
  },
  VALIDATION: {
    icon: Clock,
    title: "En revisión",
    message: "Nuestro equipo está verificando tu información. Te responderemos pronto.",
    color: "text-blue-500",
  },
  REJECTED: {
    icon: XCircle,
    title: "Solicitud rechazada",
    message: "Tu solicitud no pudo ser aprobada en este momento.",
    action: "Revisa el motivo abajo y corrige la información para reenviar.",
    color: "text-red-500",
  },
  REOPENED: {
    icon: AlertCircle,
    title: "Solicitud reabierta",
    message: "Tu solicitud ha sido reabierta. Por favor, actualiza la información solicitada.",
    color: "text-yellow-500",
  },
  READY_FOR_SANDBOX: {
    icon: CheckCircle2,
    title: "Aprobado para sandbox",
    message: "Tu solicitud fue aprobada. Puedes acceder al entorno de pruebas.",
    action: "Accede al portal para comenzar la configuración.",
    color: "text-green-500",
  },
  READY_FOR_PRODUCTION: {
    icon: CheckCircle2,
    title: "Listo para producción",
    message: "Has completado todos los requisitos. Puedes activar tu cuenta de producción.",
    color: "text-green-500",
  },
  ACTIVE: {
    icon: CheckCircle2,
    title: "Cuenta activa",
    message: "Tu cuenta está activa y lista para operar.",
    color: "text-green-500",
  },
  SUSPENDED: {
    icon: XCircle,
    title: "Cuenta suspendida",
    message: "Tu cuenta ha sido suspendida temporalmente.",
    action: "Contacta a soporte para más información.",
    color: "text-red-500",
  },
};

interface PantallaEsperaProps {
  status: ActivationStatus;
  rejectionReason?: string;
  contactEmail?: string;
  tenantName?: string;
}

export function PantallaEspera({
  status,
  rejectionReason,
  contactEmail = "soporte@nadakki.com",
  tenantName,
}: PantallaEsperaProps) {
  const router = useRouter();
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // Si el estado es READY_FOR_SANDBOX o superior, redirigir al portal
  useEffect(() => {
    if (status === "READY_FOR_SANDBOX" || status === "READY_FOR_PRODUCTION" || status === "ACTIVE") {
      // Permitir que vean este mensaje brevemente antes de redirigir
      const timer = setTimeout(() => {
        router.push("/credit-hub");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  // Si navega a otra ruta y no está listo, volver aquí
  // Esto se maneja mejor con middleware o un guard en el layout

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`${config.icon === Loader2 ? "animate-spin" : ""}`}>
              <Icon className={`w-20 h-20 ${config.color}`} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold">{config.title}</h1>

          {/* Tenant name if provided */}
          {tenantName ? (
            <p className="text-xl text-slate-300">{tenantName}</p>
          ) : null}

          {/* Message */}
          <p className="text-lg text-slate-300 max-w-xl mx-auto">{config.message}</p>

          {/* Action */}
          {config.action ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 max-w-xl mx-auto">
              <p className="text-sm text-slate-200">{config.action}</p>
            </div>
          ) : null}

          {/* Rejection reason */}
          {status === "REJECTED" && rejectionReason ? (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 max-w-xl mx-auto">
              <p className="text-sm font-medium text-red-400 mb-2">Motivo del rechazo:</p>
              <p className="text-sm text-red-200">{rejectionReason}</p>
            </div>
          ) : null}

          {/* Contact info */}
          <div className="pt-8 text-sm text-slate-400">
            <p>¿Necesitas ayuda?</p>
            <p className="mt-1">
              Escríbenos a{" "}
              <a href={`mailto:${contactEmail}`} className="text-blue-400 hover:underline">
                {contactEmail}
              </a>
            </p>
          </div>

          {/* Status indicator */}
          <div className="pt-4">
            <div className="inline-block px-4 py-2 bg-slate-800 rounded-full text-xs font-mono text-slate-400">
              Estado: {status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
