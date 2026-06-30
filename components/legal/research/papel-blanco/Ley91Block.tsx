"use client";

import { Landmark } from "lucide-react";

export function Ley91Block() {
  return (
    <aside className="lr-ley91" aria-label="Aviso Ley 91">
      <Landmark size={16} style={{ marginRight: 8, verticalAlign: -3 }} aria-hidden />
      <strong>Ley 91 ·</strong> Toda opinión generada requiere revisión y validación obligatoria por un abogado
      autorizado antes de su uso o comunicación. El asistente no constituye asesoría legal definitiva.
    </aside>
  );
}
