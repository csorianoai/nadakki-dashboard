"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Sparkles } from "lucide-react";
import { useTenant } from "@/components/system/TenantProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = [
  "jeepeta hasta 1.5M",
  "Honda CR-V bajo 1.5M",
  "algo pa Uber",
  "carrito automático pa mi mamá",
  "yipeta pa la playa",
  "tengo 300 mil de inicial",
] as const;

const CHIPS = [
  { label: "Yipeta familiar", q: "yipeta familiar" },
  { label: "Automático", q: "automático" },
  { label: "Bajo 1.5M", q: "1.5M" },
  { label: "Ideal Uber", q: "uber" },
  { label: "SUV Santiago", q: "suv santiago" },
  { label: "Premium", q: "premium" },
] as const;

export function Hero() {
  const router = useRouter();
  const { config } = useTenant();
  const [query, setQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  const search = (q: string) => {
    const trimmed = q.trim();
    router.push(trimmed ? `/autos/vehiculos?q=${encodeURIComponent(trimmed)}` : "/autos/vehiculos");
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden px-[22px] pb-10 pt-8 md:pb-14 md:pt-12"
      style={{
        background:
          "radial-gradient(120% 120% at 85% -10%, var(--brand-soft), transparent 55%)",
      }}
    >
      <div className="mx-auto max-w-[1440px]">
        <span className="inline-flex rounded-full border border-nk-border bg-nk-surface px-3 py-1 text-xs font-semibold text-nk-fg-muted">
          Aprobación bancaria integrada · {config.sub}
        </span>

        <h1 className="mt-5 max-w-[920px] font-manrope text-[clamp(34px,5.4vw,60px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-nk-fg">
          El vehículo perfecto para ti,{" "}
          <span className="bg-gradient-to-br from-brand to-brand-2 bg-clip-text text-transparent">
            financiado en tu banco
          </span>
        </h1>

        <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-nk-fg-muted md:text-base">
          Marketplace inteligente con aprobación bancaria integrada, AI Concierge y precios verificados
          en República Dominicana.
        </p>

        <div className="mt-8 max-w-[720px] rounded-r border border-nk-border bg-nk-surface p-2 shadow-nk-lg">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search(query)}
              placeholder={`Ej: "${PLACEHOLDERS[placeholderIdx]}"…`}
              className="h-12 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:shadow-none"
              aria-label="Búsqueda con AI"
            />
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 min-h-11 min-w-11"
                aria-label="Búsqueda por voz"
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="brand"
                className="h-11 min-h-11 gap-2 px-5"
                onClick={() => search(query)}
              >
                <Sparkles className="h-4 w-4" />
                Buscar con AI
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex max-w-[720px] flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => search(chip.q)}
              className={cn(
                "rounded-full border border-nk-border bg-nk-surface px-3 py-1.5 text-xs font-medium text-nk-fg-muted transition",
                "hover:border-brand hover:bg-brand hover:text-[var(--on-brand)]",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
