"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { calculateFinance } from "@/lib/api/finance";
import { fmtRD } from "@/lib/format";
import { SaveButton } from "@/components/vehicle/SaveButton";
import { FinancingLeadButton } from "@/components/autos/FinancingLeadButton";
import type { Vehicle } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

const BANKS = [
  { slug: "credicefi", label: "Credicefi", rate: 0.135 },
  { slug: "piloto", label: "Banco Piloto RD", rate: 0.128 },
  { slug: "otro", label: "Otro", rate: 0.142 },
] as const;

const TERMS = [48, 60, 72, 84] as const;

export function PaymentCalculator({
  vehicle,
  vehicleRefId,
  saved = false,
  onSaveToggle,
}: {
  vehicle: Vehicle;
  vehicleRefId: string;
  saved?: boolean;
  onSaveToggle?: () => void;
}) {
  const [bankIdx, setBankIdx] = useState(0);
  const [downPct, setDownPct] = useState(20);
  const [term, setTerm] = useState<number>(60);
  const [monthly, setMonthly] = useState(0);
  const [financed, setFinanced] = useState(0);
  const [rate, setRate] = useState<number>(BANKS[0]!.rate);

  const bank = BANKS[bankIdx]!;
  const downPayment = useMemo(
    () => Math.round(vehicle.price * (downPct / 100)),
    [vehicle.price, downPct],
  );

  useEffect(() => {
    let cancelled = false;
    void calculateFinance(vehicle.price, downPct, term, bank.slug).then((res) => {
      if (!cancelled) {
        setMonthly(res.monthly_payment_rd);
        setFinanced(res.financed_amount_rd);
        setRate(res.annual_rate);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vehicle.price, downPct, term, bank.slug]);

  return (
    <aside className="sticky top-[82px] space-y-4">
      <div className="rounded-r border border-nk-border bg-nk-surface p-5 shadow-nk-md">
        <p className="font-manrope text-[34px] font-extrabold tabular-nums text-brand">
          {fmtRD(monthly)}
        </p>
        <p className="text-sm text-nk-fg-muted">
          a {term} meses · {(rate * 100).toFixed(1)}% anual
        </p>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-nk-fg-muted">
            Banco
          </p>
          <div className="flex rounded-r-sm border border-nk-border p-0.5">
            {BANKS.map((b, i) => (
              <button
                key={b.slug}
                type="button"
                onClick={() => setBankIdx(i)}
                className={cn(
                  "flex-1 rounded-r-sm px-1 py-2 text-[10px] font-bold leading-tight transition sm:text-xs",
                  bankIdx === i
                    ? "bg-brand text-white shadow-nk-sm"
                    : "text-nk-fg-muted hover:bg-nk-surface-2",
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-nk-fg">Inicial</span>
            <span className="font-bold tabular-nums text-brand">{downPct}%</span>
          </div>
          <Slider
            value={[downPct]}
            min={0}
            max={60}
            step={5}
            onValueChange={([v]) => setDownPct(v ?? 0)}
          />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-nk-fg-muted">
            Plazo
          </p>
          <div className="flex rounded-r-sm border border-nk-border p-0.5">
            {TERMS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTerm(t)}
                className={cn(
                  "flex-1 rounded-r-sm py-2 text-xs font-bold transition",
                  term === t
                    ? "bg-brand text-white"
                    : "text-nk-fg-muted hover:bg-nk-surface-2",
                )}
              >
                {t}m
              </button>
            ))}
          </div>
        </div>

        <dl className="mt-5 space-y-2 border-t border-nk-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-nk-fg-muted">Monto a financiar</dt>
            <dd className="font-semibold tabular-nums">{fmtRD(financed)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-nk-fg-muted">Precio vehículo</dt>
            <dd className="font-semibold tabular-nums">{fmtRD(vehicle.price)}</dd>
          </div>
        </dl>

        <FinancingLeadButton
          vehicle={vehicle}
          vehicleRefId={vehicleRefId}
          downPayment={downPayment}
          termMonths={term}
          className="mt-5 w-full bg-gradient-to-r from-brand to-brand-2"
        />

        <Button
          variant="outline"
          disabled
          className="relative mt-2 w-full gap-2 opacity-70"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Chat WhatsApp
          <span className="rounded-full bg-nk-warning-soft px-2 py-0.5 text-[10px] font-bold text-nk-warning">
            Pronto
          </span>
        </Button>

        <div className="mt-3 flex justify-center">
          <SaveButton
            saved={saved}
            onToggle={onSaveToggle ?? (() => undefined)}
            className="border-none bg-transparent shadow-none"
          />
        </div>
      </div>

      <div className="rounded-r border border-nk-success/25 bg-nk-success-soft p-4 text-sm">
        <p className="font-semibold text-nk-success">
          Precio Justo verificado — 15 usuarios · 4% bajo promedio
        </p>
      </div>
    </aside>
  );
}
