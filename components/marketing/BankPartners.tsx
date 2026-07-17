import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const BANKS = [
  { name: "Credicefi", sub: "Financiamiento verificado", active: true },
  { name: "Banco Piloto RD", sub: "Aliado oficial", active: true },
  { name: "Próximamente", sub: "Nuevo aliado bancario", active: false },
  { name: "Próximamente", sub: "Nuevo aliado bancario", active: false },
] as const;

export function BankPartners() {
  return (
    <section id="bancos" className="bg-brand-soft px-[22px] py-12">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="font-manrope text-[clamp(22px,3vw,30px)] font-bold text-nk-fg">
          Aliados bancarios verificados
        </h2>
        <p className="mt-2 text-sm text-nk-fg-muted">Aplica una vez, recibe ofertas de todos</p>

        <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
          {BANKS.map((bank) => (
            <article
              key={bank.name + bank.sub}
              className={cn(
                "rounded-r border border-nk-border bg-nk-surface p-5 opacity-[0.72] shadow-nk-sm transition duration-200",
                "hover:-translate-y-[3px] hover:opacity-100 hover:shadow-nk-md",
              )}
            >
              <div className="flex h-12 items-center">
                <span className="font-manrope text-lg font-extrabold text-nk-fg">{bank.name}</span>
              </div>
              <p className="mt-2 text-sm text-nk-fg-muted">{bank.sub}</p>
              {bank.active && (
                <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-nk-success/15 px-2.5 py-1 text-[11px] font-bold text-nk-success">
                  <Shield className="h-3.5 w-3.5" aria-hidden />
                  Aprobación en 24h
                </span>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
