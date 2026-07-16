import Link from "next/link";

const COLUMNS = [
  {
    title: "Por marca",
    links: [
      { label: "Toyota Corolla", href: "/autos/vehiculos?marca=Toyota&modelo=Corolla" },
      { label: "Honda CR-V", href: "/autos/vehiculos?marca=Honda&modelo=CR-V" },
      { label: "Hyundai Tucson", href: "/autos/vehiculos?marca=Hyundai&modelo=Tucson" },
      { label: "Kia Sportage", href: "/autos/vehiculos?marca=Kia&modelo=Sportage" },
      { label: "Mercedes-Benz GLC", href: "/autos/vehiculos?marca=Mercedes-Benz&modelo=GLC" },
      { label: "BMW X3", href: "/autos/vehiculos?marca=BMW&modelo=X3" },
    ],
  },
  {
    title: "Por ciudad",
    links: [
      { label: "Vehículos en Santo Domingo", href: "/autos/vehiculos?ciudad=Santo%20Domingo" },
      { label: "Vehículos en Santiago", href: "/autos/vehiculos?ciudad=Santiago" },
      { label: "Vehículos en La Vega", href: "/autos/vehiculos?ciudad=La%20Vega" },
      {
        label: "Vehículos en San Pedro de Macorís",
        href: "/autos/vehiculos?ciudad=San%20Pedro%20de%20Macor%C3%ADs",
      },
      { label: "Vehículos en Puerto Plata", href: "/autos/vehiculos?ciudad=Puerto%20Plata" },
    ],
  },
  {
    title: "Por presupuesto",
    links: [
      { label: "Vehículos bajo RD$1M", href: "/autos/vehiculos?precio_max=1000000" },
      { label: "Vehículos RD$1-2M", href: "/autos/vehiculos?precio_min=1000000&precio_max=2000000" },
      { label: "Vehículos premium RD$2M+", href: "/autos/vehiculos?precio_min=2000000" },
      { label: "SUV para familia", href: "/autos/vehiculos?tipo=SUV&q=familia" },
      { label: "Ideal para Uber", href: "/autos/vehiculos?q=uber" },
      { label: "Automático hasta 60k/mes", href: "/autos/vehiculos?cuota_max=60000" },
    ],
  },
] as const;

export function PopularSearches() {
  return (
    <section id="populares" className="px-[22px] py-12">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="font-manrope text-[clamp(22px,3vw,30px)] font-bold text-nk-fg">
          Búsquedas populares en RD
        </h2>
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-nk-fg-subtle">
                {col.title}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {col.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-nk-border bg-nk-surface px-3 py-1.5 text-xs font-medium text-nk-fg-muted transition hover:border-brand hover:bg-brand hover:text-[var(--on-brand)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
