/**
 * Institutional empty-state copy (Phase 5 Item 4).
 * EN/ES keyed off tenant locale — same strategy as `forge-toast-copy.ts`.
 */

import { forgeToastLangFromLocale } from "./forge-toast-copy";

export function forgeEmptyLangFromLocale(locale: string | undefined) {
  return forgeToastLangFromLocale(locale);
}

const COPY = {
  es: {
    bankQueueZeroTitle: "No hay solicitudes pendientes de su revisión",
    bankQueueZeroBody: "Cuando lleguen solicitudes a la cola, aparecerán en esta vista priorizada.",
    bankQueueZeroCta: "Ver todas las solicitudes",
    bankQueueFilteredTitle: "Ninguna solicitud coincide con el filtro",
    bankQueueFilteredBody: "Ajuste el texto de búsqueda para ampliar o reducir los resultados en esta vista.",
    bankQueueFilteredCta: "Limpiar búsqueda",
    bankQueueErrorTitle: "No se pudo cargar la bandeja",
    bankQueueErrorBody: "Inténtelo de nuevo en unos momentos o abra la bandeja completa.",
    bankQueueErrorCta: "Abrir bandeja completa",

    bankAppsFilteredTitle: "No hay solicitudes que coincidan con estos filtros",
    bankAppsFilteredBody: "Pruebe otros términos o restablezca la búsqueda para ver la bandeja completa.",
    bankAppsFilteredCta: "Limpiar todos los filtros",
    bankAppsEmptyTitle: "No hay solicitudes en la bandeja",
    bankAppsEmptyBody: "Cuando existan solicitudes en cola, podrá revisarlas y decidir desde aquí.",
    bankAppsErrorTitle: "No se pudo cargar la bandeja bancaria",
    bankAppsErrorBody: "Inténtelo de nuevo en unos momentos.",

    bankDetailDocumentsTitle: "Aún no hay documentos cargados",
    bankDetailDocumentsBody: "Los adjuntos aparecerán aquí cuando el expediente los incluya en el payload de la solicitud.",
    bankDetailEvidencePendingTitle: "Análisis de IA pendiente",
    bankDetailEvidencePendingBody: "El motor aún no ha emitido evidencia estructurada para esta solicitud.",
    bankDetailStatementTitle: "Sin métricas de estado de cuenta",
    bankDetailStatementBody: "No hay bloque de métricas en el análisis para esta solicitud.",
    bankDetailAuditEmptyTitle: "Sin eventos de auditoría",
    bankDetailAuditEmptyBody: "No hay entradas en la pista para esta solicitud; el registro es anexo desde el alta.",
    bankDetailCommentsEmptyTitle: "Sin comentarios internos aún",
    bankDetailCommentsEmptyBody: "Las notas persistidas seguirán la política del banco cuando el endpoint esté integrado.",
    bankDetailCommentsCta: "Agregar nota",

    bankAuditFilteredTitle: "No hay eventos de auditoría que coincidan",
    bankAuditFilteredBody: "La vista se alimenta de la cola activa; si no hay solicitudes, no hay eventos que mostrar.",
    bankAuditClearCta: "Ver bandeja de solicitudes",
    bankAuditLast30Cta: "Ver solicitudes",

    complianceAlertsClearTitle: "Sin alertas AML/KYC abiertas",
    complianceAlertsClearBody: "Todas las solicitudes visibles en la cola cumplen los controles mínimos revisados.",

    dealerPipelineEmptyTitle: "No hay solicitudes activas en su embudo",
    dealerPipelineEmptyBody: "Las solicitudes en borrador, envío o análisis aparecerán aquí para seguimiento rápido.",
    dealerPipelineCta: "Crear nueva solicitud",

    dealerListFilteredTitle: "No hay solicitudes que coincidan con estos filtros",
    dealerListFilteredBody: "Ajuste la búsqueda o restablezca los filtros para ver todo el historial.",
    dealerListFilteredCta: "Limpiar todos los filtros",
    dealerListZeroTitle: "Aún no ha enviado solicitudes",
    dealerListZeroBody: "Cuando cree y envíe solicitudes, aparecerán aquí con estado y monto.",
    dealerListZeroCta: "Crear nueva solicitud",
    dealerListErrorTitle: "No se pudieron cargar las solicitudes",
    dealerListErrorBody: "Inténtelo de nuevo en un momento.",
  },
  en: {
    bankQueueZeroTitle: "No applications awaiting your review",
    bankQueueZeroBody: "When applications enter the queue, they will appear in this prioritized view.",
    bankQueueZeroCta: "View all applications",
    bankQueueFilteredTitle: "No applications match this filter",
    bankQueueFilteredBody: "Adjust your search text to widen or narrow results in this view.",
    bankQueueFilteredCta: "Clear search",
    bankQueueErrorTitle: "The queue could not be loaded",
    bankQueueErrorBody: "Please try again shortly or open the full applications list.",
    bankQueueErrorCta: "Open full queue",

    bankAppsFilteredTitle: "No applications match these filters",
    bankAppsFilteredBody: "Try different terms or clear the search to see the full queue.",
    bankAppsFilteredCta: "Clear all filters",
    bankAppsEmptyTitle: "No applications in the queue",
    bankAppsEmptyBody: "When applications are in queue, you can review and decide them from here.",
    bankAppsErrorTitle: "The bank queue could not be loaded",
    bankAppsErrorBody: "Please try again shortly.",

    bankDetailDocumentsTitle: "No documents uploaded yet",
    bankDetailDocumentsBody: "Attachments will appear here when the case file includes them in the application payload.",
    bankDetailEvidencePendingTitle: "AI analysis pending",
    bankDetailEvidencePendingBody: "The engine has not yet produced structured evidence for this application.",
    bankDetailStatementTitle: "No statement analysis metrics",
    bankDetailStatementBody: "The analysis payload does not include a metrics block for this application.",
    bankDetailAuditEmptyTitle: "No audit events yet",
    bankDetailAuditEmptyBody: "There are no entries on the trail for this application; the log is append-only from onboarding.",
    bankDetailCommentsEmptyTitle: "No internal comments yet",
    bankDetailCommentsEmptyBody: "Persisted notes will follow bank policy when the notes endpoint is integrated.",
    bankDetailCommentsCta: "Add a note",

    bankAuditFilteredTitle: "No audit events match these filters",
    bankAuditFilteredBody: "This view is fed from the active queue; if there are no applications, there are no events to show.",
    bankAuditClearCta: "View applications queue",
    bankAuditLast30Cta: "View applications",

    complianceAlertsClearTitle: "No open AML/KYC alerts",
    complianceAlertsClearBody: "All applications visible in the queue meet the minimum controls reviewed.",

    dealerPipelineEmptyTitle: "No active applications in your pipeline",
    dealerPipelineEmptyBody: "Applications in draft, submitted, or in review will appear here for quick follow-up.",
    dealerPipelineCta: "Create new application",

    dealerListFilteredTitle: "No applications match these filters",
    dealerListFilteredBody: "Adjust search or clear filters to see your full history.",
    dealerListFilteredCta: "Clear all filters",
    dealerListZeroTitle: "You have not submitted any applications yet",
    dealerListZeroBody: "When you create and submit applications, they will appear here with status and amount.",
    dealerListZeroCta: "Create new application",
    dealerListErrorTitle: "Applications could not be loaded",
    dealerListErrorBody: "Please try again in a moment.",
  },
} as const;

export function forgeEmptyCopy(locale: string | undefined) {
  const lang = forgeEmptyLangFromLocale(locale);
  return COPY[lang];
}
