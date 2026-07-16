import { ArrowRight, Shield } from "lucide-react";
import { fmtRD } from "@/lib/format";
import { cn } from "@/lib/utils";

const OFFERS = [
  {
    bank: "Credicefi",
    amount: "RD$1,450,000 / 72m",
    payment: "RD$26,180/mes · 12.9%",
    time: "18h",
    best: true,
  },
  {
    bank: "Banco Piloto RD",
    amount: "RD$1,380,000 / 60m",
    payment: "RD$27,340/mes · 13.5%",
    time: "24h",
    best: false,
  },
  {
    bank: "Banco Reservas",
    amount: "RD$1,300,000 / 60m",
    payment: "RD$29,050/mes · 14.2%",
    time: "48h",
    best: false,
  },
] as const;

export function ApprovalComparator() {
  return (
    <section id="comparador" className="px-[22px] py-12">
      <div className="mx-auto max-w-[1440px]">
        <span className="inline-flex rounded-full border border-brand/25 bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
          Exclusivo de Nadakki
        </span>
        <h2 className="mt-4 font-manrope text-[clamp(22px,3vw,30px)] font-bold text-nk-fg">
          Un solo formulario, múltiples ofertas
        </h2>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-nk-fg-muted md:justify-start">
          <span className="rounded-r-sm bg-nk-surface-2 px-4 py-2">1 aplicación</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-brand" aria-hidden />
          <span className="inline-flex items-center gap-2 rounded-r-sm bg-nk-surface-2 px-4 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-[var(--on-brand)]">
              C
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-2 text-[10px] font-bold text-[var(--on-brand)]">
              P
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-nk-success text-[10px] font-bold text-white">
              R
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-brand" aria-hidden />
          <span className="rounded-r-sm bg-nk-surface-2 px-4 py-2">Ofertas comparadas</span>
        </div>

        <div className="mt-8 overflow-x-auto">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-3 border-b border-nk-border pb-2 text-xs font-bold uppercase tracking-wide text-nk-fg-subtle">
              <span>Banco</span>
              <span>Monto / plazo</span>
              <span>Cuota / tasa</span>
              <span>Respuesta</span>
            </div>
            {OFFERS.map((row) => (
              <div
                key={row.bank}
                className={cn(
                  "grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-3 border-b border-nk-border py-4 text-sm",
                  row.best && "rounded-r bg-[var(--success-2,#ECFDF5)]/60",
                )}
              >
                <span className="flex items-center gap-2 font-semibold text-nk-fg">
                  {row.bank}
                  {row.best && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-2,#ECFDF5)] px-2 py-0.5 text-[10px] font-bold text-nk-success">
                      <Shield className="h-3 w-3" aria-hidden />
                      Mejor oferta
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-nk-fg-muted">{row.amount}</span>
                <span className="tabular-nums text-nk-fg-muted">{row.payment}</span>
                <span className="font-semibold text-nk-fg">{row.time}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-nk-fg-subtle">
          Ejemplo ilustrativo para vehículo de {fmtRD(1_450_000)} con inicial del 20%.
        </p>
      </div>
    </section>
  );
}
