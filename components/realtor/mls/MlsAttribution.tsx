/**
 * Atribución obligatoria por contrato MIAMI MLS IDX.
 * Debe aparecer en cada listado y en el pie del panel de listados.
 */

import type { CSSProperties } from "react";

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

/** Pie de panel: aviso IDX global obligatorio. */
export function MlsIdxNotice() {
  return (
    <p role="note" aria-label="Aviso IDX MIAMI MLS" style={NOTICE_STYLE}>
      The data relating to real estate for sale on this website comes in part
      from the Internet Data Exchange (IDX) program of the Miami Association
      of REALTORS®. The properties listed with brokerage firms other than this
      broker are marked with the IDX logo and detailed information about them
      includes the name of the listing broker.{" "}
      <strong>
        Information is provided exclusively for consumers' personal,
        non-commercial use and may not be used for any purpose other than to
        identify prospective properties consumers may be interested in
        purchasing.
      </strong>{" "}
      Data is deemed reliable but not guaranteed. © Miami Association of
      REALTORS®. All rights reserved.
    </p>
  );
}

/** Atribución por listado: nombre de la oficina listadora (obligatorio IDX). */
export function MlsListingCourtesy({ officeName }: { officeName: string }) {
  return (
    <p aria-label="Courtesy of" style={COURTESY_STYLE}>
      {officeName}
    </p>
  );
}
