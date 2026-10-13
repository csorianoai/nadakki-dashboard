import { ACCESS_NOTICE } from "@/lib/realtor/copy";
import type { RealtorAccessState } from "./useRealtorAccess";

/** Lo que se ve cuando el módulo no se abre: el motivo, sin ningún dato. Nunca una pantalla en blanco. */
export function RealtorNotice({ reason }: { reason: Exclude<RealtorAccessState, "ok"> }) {
  return (
    <section className="p-4">
      <p role="status" data-testid="realtor-notice" data-reason={reason} className="rounded border p-3 text-sm">
        {ACCESS_NOTICE[reason]}
      </p>
    </section>
  );
}
