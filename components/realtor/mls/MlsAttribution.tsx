/**
 * Atribución obligatoria — contrato MIAMI AOR Data License Agreement (2024).
 * Textos exactos de Schedule A §9–10 y Schedule C §2–3.
 * No modificar sin revisar el contrato vigente en www.miamirealtors.com/mls.
 */

import type { CSSProperties } from "react";

const YEAR = new Date().getFullYear();

const NOTICE_STYLE: CSSProperties = {
  fontSize: 11,
  color: "#4A5A68",
  margin: "10px 0 0",
  lineHeight: 1.5,
};

const COURTESY_STYLE: CSSProperties = {
  fontSize: 12,
  color: "#4A5A68",
  margin: "6px 0 0",
  fontStyle: "italic",
};

/**
 * Pie de panel: aviso IDX/copyright obligatorio.
 * Texto exacto requerido por Schedule A §10 y Schedule C §2–3.
 */
export function MlsIdxNotice() {
  return (
    <p role="note" aria-label="MIAMI MLS IDX Notice" style={NOTICE_STYLE}>
      Copyright Southeast Florida Multiple Listing Service © {YEAR}.{" "}
      <strong>
        MLS Data is deemed reliable, but is not guaranteed accurate by MIAMI
        REALTORS®.
      </strong>{" "}
      Accuracy of listing information is not guaranteed. Listing information is
      provided for personal consumer, non-commercial use, solely to identify
      potential properties for potential purchase. All other use is strictly
      prohibited, is a violation of the terms of use, and may violate federal
      and state law.
    </p>
  );
}

/**
 * Atribución por listado: nombre de la oficina listadora.
 * Texto exacto requerido por Schedule A §9: "This listing is courtesy of [firm]."
 * Debe mostrarse en tamaño de fuente no menor al tamaño mediano usado en la página,
 * en color claramente visible y en ubicación razonablemente prominente.
 */
export function MlsListingCourtesy({ officeName }: { officeName: string }) {
  return (
    <p aria-label="Listing courtesy" style={COURTESY_STYLE}>
      This listing is courtesy of {officeName}.
    </p>
  );
}
