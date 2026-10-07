"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { assignToAnalyst, claimForMe, getAssignableAnalysts } from "@/lib/credit-hub/api/asignacionClient";
import { CHApiError } from "@/lib/credit-hub/api/client";

/** Roles que administran el banco y pueden asignar a otro (mismo gate que el backend). */
const ROLES_QUE_ASIGNAN = new Set(["credit_admin", "tenant_admin", "admin", "platform_superadmin"]);

const CAMPO = "h-9 rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] px-2 text-sm";

function mensaje(err: unknown): string {
  const texto = `${err instanceof Error ? err.message : ""} ${err instanceof CHApiError ? String(err.detail) : ""}`;
  if (err instanceof CHApiError && err.status === 409) return "Otro analista ya tomó esta solicitud.";
  if (/lender_code_required/.test(texto)) return "Elige el prestamista con el que se trabaja la solicitud.";
  if (/lender_not_assigned/.test(texto)) return "Ese analista no responde por el prestamista de esta solicitud.";
  if (/analyst_not_assignable/.test(texto)) return "Ese usuario no tiene un rol de analista activo en este banco.";
  return "No pudimos asignar la solicitud. Vuelve a intentarlo.";
}

/**
 * BANK-V2-03. Una solicitud sin asignar no se puede decidir (el decide exige
 * el claim propio). Un analista con permiso de decidir puede asignársela; el
 * administrador del banco puede asignarla a un analista. Las dos acciones
 * quedan en la bitácora (evento APPLICATION_CLAIMED).
 */
export function Asignacion(props: {
  applicationId: string;
  tenantId: string | null | undefined;
  userId: string | null | undefined;
  roleKey: string | null | undefined;
  puedeDecidir: boolean;
  prestamistas: string[];
}) {
  const { applicationId, tenantId, userId, roleKey, puedeDecidir, prestamistas } = props;
  const queryClient = useQueryClient();
  const esAdmin = ROLES_QUE_ASIGNAN.has((roleKey ?? "").trim().toLowerCase());
  const [destino, setDestino] = useState("");
  const [prestamista, setPrestamista] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);
  const analistasQ = useQuery({
    queryKey: ["credit-hub", "bank", "assignable-analysts", tenantId ?? ""],
    queryFn: () => getAssignableAnalysts({ tenantId: tenantId! }),
    enabled: esAdmin && !!tenantId,
    retry: false,
  });
  const lenderCode = prestamistas.length === 1 ? prestamistas[0] : prestamista;

  const ejecutar = async (accion: () => Promise<unknown>, texto: string) => {
    if (prestamistas.length > 1 && !prestamista) return setError("Elige el prestamista con el que se trabaja la solicitud.");
    setOcupado(true);
    setError(null);
    try {
      await accion();
      setHecho(texto);
      await queryClient.invalidateQueries({ queryKey: ["credit-hub", "bank"] });
    } catch (err) {
      setError(mensaje(err));
    } finally {
      setOcupado(false);
    }
  };

  if (!tenantId || (!puedeDecidir && !esAdmin)) return null;
  if (hecho) {
    return (
      <p role="status" data-testid="asignacion-hecha" className="text-sm font-semibold text-[var(--dcc-ok-fg)]">
        {hecho}
      </p>
    );
  }
  const analistas = analistasQ.data?.analysts ?? [];
  return (
    <div className="flex flex-wrap items-end gap-2 text-sm" data-testid="asignacion">
      {prestamistas.length > 1 ? (
        <label className="grid gap-1">
          Prestamista
          <select value={prestamista} onChange={(e) => setPrestamista(e.target.value)} className={CAMPO}>
            <option value="">Elegir prestamista…</option>
            {prestamistas.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {puedeDecidir && userId ? (
        <button
          type="button"
          disabled={ocupado}
          className={DCC_CLASSES.actionButton}
          onClick={() =>
            void ejecutar(
              () => claimForMe({ tenantId, applicationId, analystId: userId, lenderCode }),
              "Solicitud asignada a ti. Ya puedes decidirla.",
            )
          }
        >
          Asignarme
        </button>
      ) : null}
      {esAdmin ? (
        <>
          <label className="grid gap-1">
            Asignar a
            <select value={destino} onChange={(e) => setDestino(e.target.value)} className={CAMPO}>
              <option value="">{analistasQ.isLoading ? "Cargando analistas…" : "Elegir analista…"}</option>
              {analistas.map((a) => (
                <option key={a.user_id} value={a.user_id}>
                  {a.email}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={ocupado || !destino}
            className={DCC_CLASSES.quietButton}
            onClick={() => {
              const elegido = analistas.find((a) => a.user_id === destino);
              void ejecutar(
                () => assignToAnalyst({ tenantId, applicationId, analystId: destino, lenderCode }),
                `Solicitud asignada a ${elegido?.email ?? "el analista elegido"}.`,
              );
            }}
          >
            Asignar
          </button>
        </>
      ) : null}
      {error ? (
        <p role="alert" className="w-full text-[var(--dcc-error-fg)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
