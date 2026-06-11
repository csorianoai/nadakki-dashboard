"use client";

interface PricingProposalSectionProps {
  pricingProposal?: Record<string, unknown>;
}

function flattenEntries(obj: Record<string, unknown>, prefix = ""): Array<[string, unknown]> {
  const out: Array<[string, unknown]> = [];
  for (const [key, value] of Object.entries(obj)) {
    const label = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out.push(...flattenEntries(value as Record<string, unknown>, label));
    } else if (value != null && value !== "") {
      out.push([label, value]);
    }
  }
  return out;
}

export function PricingProposalSection({ pricingProposal }: PricingProposalSectionProps) {
  if (!pricingProposal || Object.keys(pricingProposal).length === 0) return null;

  const entries = flattenEntries(pricingProposal);
  if (!entries.length) return null;

  return (
    <section
      className="rounded-forge-lg border border-forgeGray-200 bg-forgeSurface-card p-4 shadow-forge-xs"
      aria-labelledby="pricing-proposal-title"
    >
      <h3 id="pricing-proposal-title" className="font-display text-forge-md font-semibold text-forgeGray-800">
        Propuesta de precios
      </h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-2">
            <dt className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
              {key.replace(/_/g, " ").replace(/\./g, " · ")}
            </dt>
            <dd className="mt-1 font-forgeMono text-forge-sm text-forgeGray-800">
              {typeof value === "number" ? value.toLocaleString("es-DO") : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
