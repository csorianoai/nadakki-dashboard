import type { ReactNode } from "react";

/**
 * Estudio Genio: identidad visual propia (26-nov-2026, pedido de César: "nivel lujo").
 * Tinta de toga y latón, con un sello «§» como firma visual. Lo demás, sobrio: la audacia se gasta
 * solo en la cabecera (banda de tinta con el sello) y en la tarjeta del paquete Completo.
 */
export const color = {
  tinta: "#17233A",     // toga: fondos de la cabecera y botón principal
  tinta2: "#22324D",
  laton: "#B58A3C",     // acento: sello, paquete Completo, foco
  latonClaro: "#EBDDBF",
  laurel: "#2F6B4F",    // fases recibidas, compras confirmadas
  lacre: "#8E2C3A",     // rechazos y errores
  porcelana: "#F5F7FA", // superficies secundarias
  linea: "#E3E7EE",
} as const;

export const genioPrimary =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#17233A] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] transition-colors hover:bg-[#22324D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A3C] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45";
export const genioButton =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9CFDA] bg-white px-4 py-2 text-sm font-semibold text-[#17233A] transition-colors hover:border-[#17233A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A3C] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45";
export const genioField =
  "mt-1 block w-full rounded-lg border border-[#C9CFDA] bg-white px-3 py-2 text-[15px] text-[#17233A] placeholder:text-slate-400 focus:border-[#B58A3C] focus:outline-none focus:ring-2 focus:ring-[#B58A3C]/30 disabled:bg-[#F5F7FA]";
export const genioCard = "rounded-2xl border border-[#E3E7EE] bg-white p-6 text-[#17233A]";
export const genioLabel = "block text-sm font-medium text-[#3B4558]";
export const genioTitulo = "font-display text-[1.35rem] font-semibold leading-tight text-[#17233A]";

/** Sello «§» en latón: la firma visual del producto (decorativo, oculto a lectores de pantalla). */
export function SelloGenio({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="none" stroke="#B58A3C" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="25.5" fill="none" stroke="#B58A3C" strokeWidth="0.75" strokeDasharray="1.5 2.5" />
      <text x="32" y="43" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="30" fill="#D9BC82">§</text>
    </svg>
  );
}

/** Cabecera del producto: banda de tinta con el sello. Es el único elemento audaz de cada pantalla. */
export function CabeceraGenio({ titulo, texto, accion }: { titulo: string; texto: string; accion?: ReactNode }) {
  return (
    <header className="relative overflow-hidden rounded-2xl bg-[#17233A] px-6 py-7 text-white sm:px-8">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-[#B58A3C]/25" />
      <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 rounded-full border border-[#B58A3C]/15" />
      <div className="relative flex flex-wrap items-center gap-5">
        <SelloGenio size={68} />
        <div className="min-w-0 max-w-2xl flex-1">
          <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-tight">{titulo}</h1>
          <p className="mt-1.5 text-[15px] leading-relaxed text-slate-300">{texto}</p>
        </div>
        {accion}
      </div>
    </header>
  );
}
