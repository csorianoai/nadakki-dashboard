"use client";

import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { fmtRD } from "@/lib/format";
import type { GeneratedListing } from "@/lib/dealer/publish-mock";
import type { Vehicle } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

export function GeneratedListingPreview({
  listing,
  onChange,
  className,
}: {
  listing: GeneratedListing;
  onChange: (patch: Partial<GeneratedListing>) => void;
  className?: string;
}) {
  const previewVehicle: Vehicle = {
    ...listing.vehicle,
    make: listing.make,
    model: listing.model,
    year: listing.year,
    price: listing.price,
    km: listing.km,
    featuresLine: listing.features.join(" · ").toUpperCase(),
  };

  const toggleFeature = (f: string) => {
    const features = listing.features.includes(f)
      ? listing.features.filter((x) => x !== f)
      : [...listing.features, f];
    onChange({ features });
  };

  return (
    <div className={cn("grid gap-6 lg:grid-cols-2", className)}>
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-nk-fg-subtle">Preview</p>
        <VehicleCard vehicle={previewVehicle} variant="list" />
      </div>

      <div className="space-y-4">
        <Field label="Marca">
          <input
            value={listing.make}
            onChange={(e) => onChange({ make: e.target.value })}
            className="w-full rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm text-nk-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2"
          />
        </Field>
        <Field label="Modelo">
          <input
            value={listing.model}
            onChange={(e) => onChange({ model: e.target.value })}
            className="w-full rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm text-nk-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Año">
            <input
              type="number"
              value={listing.year}
              onChange={(e) => onChange({ year: Number(e.target.value) })}
              className="w-full rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm text-nk-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2"
            />
          </Field>
          <Field label="Kilometraje">
            <input
              type="number"
              value={listing.km}
              onChange={(e) => onChange({ km: Number(e.target.value) })}
              className="w-full rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm text-nk-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2"
            />
          </Field>
        </div>
        <Field label={`Precio sugerido (${fmtRD(listing.suggestedPrice)})`}>
          <input
            type="number"
            value={listing.price}
            onChange={(e) => onChange({ price: Number(e.target.value) })}
            className="w-full rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm text-nk-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2"
          />
          <p className="mt-1 text-xs text-nk-fg-muted">{listing.priceExplanation}</p>
        </Field>
        <Field label="Descripción">
          <textarea
            rows={4}
            value={listing.description}
            onChange={(e) => onChange({ description: e.target.value })}
            className="w-full resize-none rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm text-nk-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2"
          />
        </Field>
        <Field label="Features detectadas">
          <div className="flex flex-wrap gap-2">
            {listing.features.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFeature(f)}
                className="rounded-full border border-brand-2/40 bg-brand-2/10 px-3 py-1 text-xs font-semibold text-brand-2"
              >
                {f} ×
              </button>
            ))}
          </div>
        </Field>

        <div className="rounded-r-sm border border-nk-border bg-nk-surface-2 p-4">
          <p className="text-xs font-bold uppercase text-nk-fg-subtle">AI Confidence</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-nk-surface-3">
              <div
                className={cn(
                  "h-full rounded-full",
                  listing.confidence >= 90
                    ? "bg-green-500"
                    : listing.confidence >= 75
                      ? "bg-yellow-500"
                      : "bg-orange-500",
                )}
                style={{ width: `${listing.confidence}%` }}
              />
            </div>
            <span className="text-sm font-bold text-nk-fg">{listing.confidence}%</span>
          </div>
          <p className="mt-1 text-xs text-nk-fg-muted">
            {listing.confidenceLabel}
            {listing.confidence >= 90
              ? " (95%)"
              : listing.confidence >= 75
                ? ""
                : " — revisa detalles"}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-nk-fg-subtle">
        {label}
      </span>
      {children}
    </label>
  );
}
