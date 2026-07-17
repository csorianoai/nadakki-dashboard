import { ShieldCheck } from "lucide-react";

const BANK_LOGOS = ["Credicefi", "Banco Piloto", "BHD", "Reservas", "APAP"] as const;

const CERTS = [
  "Verificación de cédula JCE",
  "VIN validado",
  "Cumplimiento LOPD 172-13",
  "Dealers verificados",
] as const;

export function TrustBar() {
  return (
    <section className="bg-nk-surface-2 px-[22px] py-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-center justify-center gap-6 md:justify-between">
          {BANK_LOGOS.map((name) => (
            <span
              key={name}
              className="font-manrope text-sm font-extrabold tracking-tight text-nk-fg-muted opacity-80"
            >
              {name}
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {CERTS.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center gap-1.5 rounded-full border border-nk-border bg-nk-surface px-3 py-1.5 text-xs font-medium text-nk-fg-muted"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-nk-success" aria-hidden />
              {cert}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
