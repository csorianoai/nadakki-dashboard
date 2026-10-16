import { deleteApplicationDraft } from "@/lib/credit-hub/api/creditCoreClient";
import { listWizardDraftPointers } from "./wizard-draft-storage";

const LOGOUT_DELETE_TIMEOUT_MS = 3_000;

/**
 * Logout: borra en el servidor los borradores a los que apunta esta pestaña. Debe correr ANTES de limpiar
 * los tokens (la llamada lleva el bearer). Nunca lanza ni retiene el cierre de sesión más de 3 s: si el DELETE
 * falla, el borrador vence por TTL en el servidor.
 */
export async function deleteServerWizardDrafts(): Promise<void> {
  const pointers = listWizardDraftPointers();
  if (pointers.length === 0) return;
  const deletions = Promise.allSettled(pointers.map((p) => deleteApplicationDraft(p)));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, LOGOUT_DELETE_TIMEOUT_MS);
  });
  try {
    await Promise.race([deletions, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
