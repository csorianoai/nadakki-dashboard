import type { Lang } from "@/lib/realtor/propietarios/copy";

export const MANDATE_COPY = {
  es: {
    open: "Nuevo mandato", title: "Alta del mandato del propietario", cancel: "Cancelar", submit: "Guardar mandato", saving: "Guardando…",
    contact: "Contacto", role: "Rol del propietario", property: "Propiedad", kind: "Tipo de mandato", share: "Participación (%)", commission: "Comisión (%)",
    starts: "Inicio", ends: "Fin", choose: "Elegir…", noOptions: "Sin opciones disponibles",
    roles: { landlord: "Arrendador", seller: "Vendedor" },
    kinds: { exclusive: "Exclusivo", non_exclusive: "No exclusivo", management: "Administración" },
    errFields: "Revisa los campos marcados.",
    errValidation: "El servidor rechazó los datos (validación). Revisa los campos.",
    errForbidden: "No tienes permiso para dar de alta mandatos.",
    errNotFound: "El contacto o la propiedad ya no existe.",
    errConflict: "Ya existe un mandato que choca con este.",
    errOther: "No se pudo guardar. Inténtalo de nuevo.",
    ok: "Mandato guardado en borrador.",
  },
  en: {
    open: "New mandate", title: "Owner mandate registration", cancel: "Cancel", submit: "Save mandate", saving: "Saving…",
    contact: "Contact", role: "Owner role", property: "Property", kind: "Mandate type", share: "Share (%)", commission: "Commission (%)",
    starts: "Start", ends: "End", choose: "Choose…", noOptions: "No options available",
    roles: { landlord: "Landlord", seller: "Seller" },
    kinds: { exclusive: "Exclusive", non_exclusive: "Non-exclusive", management: "Management" },
    errFields: "Check the highlighted fields.",
    errValidation: "The server rejected the data (validation). Check the fields.",
    errForbidden: "You are not allowed to register mandates.",
    errNotFound: "The contact or property no longer exists.",
    errConflict: "A conflicting mandate already exists.",
    errOther: "Could not save. Please try again.",
    ok: "Mandate saved as draft.",
  },
} as const satisfies Record<Lang, unknown>;
