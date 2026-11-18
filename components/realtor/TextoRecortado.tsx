import type { CSSProperties } from "react";

/** Título largo cortado con «…» (una línea, o `lineas` con line-clamp); el texto completo queda en el tooltip. */
export function TextoRecortado({ texto, lineas = 1, testid, style }: { texto: string; lineas?: number; testid?: string; style?: CSSProperties }) {
  const corte: CSSProperties = lineas > 1
    ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lineas, overflow: "hidden" }
    : { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
  return (
    <span data-testid={testid} title={texto || undefined} style={{ minWidth: 0, ...corte, ...style }}>
      {texto}
    </span>
  );
}
