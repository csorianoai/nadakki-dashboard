import type { Bi } from "../copy-util";

/** Textos de la lista de medios (PARTE 2/2). */
export const LST: Record<string, Bi> = {
  listTitle: { es: "Imágenes del sitio", en: "Site images" },
  loading: { es: "Cargando imágenes…", en: "Loading images…" },
  errTitle: { es: "No se pueden mostrar las imágenes", en: "Images cannot be shown" },
  emptyTitle: { es: "Aún no hay imágenes", en: "No images yet" }, emptyBody: { es: "Suba la primera con el formulario de arriba.", en: "Upload the first one with the form above." },
  notFoundList: { es: "No encontrado: no hay imágenes de este sitio disponibles para su cuenta.", en: "Not found: no images of this site are available to your account." },
  colImage: { es: "Imagen", en: "Image" }, colState: { es: "Estado", en: "Status" }, colBy: { es: "Permiso dado por", en: "Permission given by" },
  colDate: { es: "Fecha del permiso", en: "Permission date" }, colPub: { es: "Publicación", en: "Publishing" }, colActions: { es: "Acciones", en: "Actions" },
  pending: { es: "Pendiente de aprobación", en: "Pending approval" }, approved: { es: "Aprobado", en: "Approved" },
  revoked: { es: "Revocado", en: "Revoked" }, rejected: { es: "Rechazado", en: "Rejected" },
  pubYes: { es: "Publicable", en: "Can be published" }, pubNo: { es: "No publicable (sin aprobar o revocado)", en: "Cannot be published (not approved or revoked)" },
  revoke: { es: "Revocar permiso", en: "Revoke permission" }, edit: { es: "Editar datos", en: "Edit details" },
  revTitle: { es: "¿Revocar el permiso de esta imagen?", en: "Revoke this image's permission?" },
  revBody: { es: "La imagen dejará de ser publicable. Esto no se puede deshacer desde aquí.", en: "The image will no longer be publishable. This cannot be undone from here." },
  reason: { es: "Motivo", en: "Reason" }, permission_withdrawn: { es: "Se retiró el permiso", en: "Permission withdrawn" },
  dmca: { es: "Reclamo de derechos de autor", en: "Copyright claim" }, staff_review: { es: "Revisión interna", en: "Internal review" },
  owner_request: { es: "Pedido del propietario", en: "Owner's request" },
  confirm: { es: "Sí, revocar", en: "Yes, revoke" }, cancel: { es: "Cancelar", en: "Cancel" }, working: { es: "Un momento…", en: "One moment…" },
  editTitle: { es: "Editar datos de la imagen", en: "Edit image details" }, save: { es: "Guardar cambios", en: "Save changes" },
  saved: { es: "Cambios guardados.", en: "Changes saved." },
  more: { es: "Cargar más", en: "Load more" }, errMore: { es: "No se pudieron cargar más imágenes.", en: "More images could not be loaded." },
  demoNote: { es: "Solo en el ejemplo: nada se envía al servidor.", en: "Sample only: nothing is sent to the server." },
};
