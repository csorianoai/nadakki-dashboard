"use client";

/**
 * Panel de listados MLS IDX.
 *
 * - Solo muestra contenido cuando la API interna devuelve available:true
 *   (lo que a su vez solo ocurre en baylara.com / www.baylara.com).
 * - Si los datos no están disponibles o Bridge falla → no renderiza nada (sin errores visibles).
 * - Contrato MIAMI: datos solo para uso personal, sin IA, con atribución.
 */

import { useEffect, useState, type CSSProperties } from "react";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import type { MlsApiResponse, MlsListing } from "@/lib/realtor/mls/types";
import { MlsIdxNotice, MlsListingCourtesy } from "./MlsAttribution";

const CARD: CSSProperties = {
  background: RT.white,
  border: `1px solid ${RT.line}`,
  borderRadius: 12,
  padding: 20,
};

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function ListingCard({
  listing,
  selected,
  onSelect,
}: {
  listing: MlsListing;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        data-testid="mls-listing-card"
        aria-pressed={selected}
        onClick={onSelect}
        style={{
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit",
          color: RT.ink,
          background: RT.white,
          borderRadius: 12,
          padding: 0,
          overflow: "hidden",
          border: `${selected ? 2 : 1}px solid ${selected ? RT.teal : RT.line}`,
        }}
      >
        <span
          aria-hidden="true"
          style={{ display: "block", height: 80, background: RT.calloutBg }}
        />
        <span style={{ display: "block", padding: "14px 16px 16px" }}>
          <strong
            style={{
              display: "block",
              fontFamily: FONT_DISPLAY,
              fontSize: 16,
            }}
          >
            {listing.address}
          </strong>
          <span
            style={{
              display: "block",
              fontSize: 13,
              color: RT.muted,
              margin: "4px 0 8px",
            }}
          >
            {listing.city}, {listing.stateOrProvince} {listing.postalCode}
          </span>
          <span
            style={{
              display: "block",
              fontFamily: FONT_DISPLAY,
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            {formatUsd(listing.listPrice)}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              background: RT.chipUpBg,
              color: RT.chipUpText,
              borderRadius: 999,
              padding: "3px 10px",
            }}
          >
            {listing.standardStatus}
          </span>
          <MlsListingCourtesy officeName={listing.listOfficeName} />
        </span>
      </button>
    </li>
  );
}

export function MlsListingsPanel() {
  const [data, setData] = useState<MlsApiResponse | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/realtor/mls/listings", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: MlsApiResponse) => {
        if (alive) setData(json);
      })
      .catch(() => {
        // Bridge no disponible: no mostrar error
      });
    return () => {
      alive = false;
    };
  }, []);

  // No renderiza nada si los datos no están disponibles o no llegaron aún
  if (!data?.available || !data.listings.length) return null;

  const listings = data.listings;
  const current = listings.find((l) => l.listingKey === selected) ?? listings[0];

  return (
    <section
      data-testid="mls-listings-panel"
      aria-label="MLS Listings"
      style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 32 }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: FONT_DISPLAY,
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        Properties for Sale
      </h2>

      <ul
        data-testid="mls-listings-list"
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 320px))",
        }}
      >
        {listings.map((l) => (
          <ListingCard
            key={l.listingKey}
            listing={l}
            selected={current?.listingKey === l.listingKey}
            onSelect={() => setSelected(l.listingKey)}
          />
        ))}
      </ul>

      {current && (
        <div data-testid="mls-listing-detail" style={CARD}>
          <h3
            style={{ margin: "0 0 12px", fontFamily: FONT_DISPLAY, fontSize: 20 }}
          >
            {current.address}
          </h3>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
              margin: 0,
              fontSize: 14,
            }}
          >
            <div>
              <dt style={{ fontSize: 12, color: RT.muted }}>Price</dt>
              <dd
                data-testid="mls-detail-price"
                style={{ margin: 0, fontWeight: 700 }}
              >
                {formatUsd(current.listPrice)}
              </dd>
            </div>
            <div>
              <dt style={{ fontSize: 12, color: RT.muted }}>Status</dt>
              <dd style={{ margin: 0, fontWeight: 700 }}>
                {current.standardStatus}
              </dd>
            </div>
            {current.bedroomsTotal !== null && (
              <div>
                <dt style={{ fontSize: 12, color: RT.muted }}>Beds</dt>
                <dd style={{ margin: 0, fontWeight: 700 }}>
                  {current.bedroomsTotal}
                </dd>
              </div>
            )}
            {current.bathroomsTotal !== null && (
              <div>
                <dt style={{ fontSize: 12, color: RT.muted }}>Baths</dt>
                <dd style={{ margin: 0, fontWeight: 700 }}>
                  {current.bathroomsTotal}
                </dd>
              </div>
            )}
            {current.livingArea !== null && (
              <div>
                <dt style={{ fontSize: 12, color: RT.muted }}>Sq Ft</dt>
                <dd style={{ margin: 0, fontWeight: 700 }}>
                  {current.livingArea.toLocaleString()}
                </dd>
              </div>
            )}
            <div>
              <dt style={{ fontSize: 12, color: RT.muted }}>Type</dt>
              <dd style={{ margin: 0 }}>{current.propertySubType || current.propertyType}</dd>
            </div>
          </dl>
          <MlsListingCourtesy officeName={current.listOfficeName} />
          {data.asOf && (
            <p style={{ fontSize: 11, color: RT.muted, margin: "8px 0 0" }}>
              Last updated:{" "}
              {new Date(data.asOf).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      )}

      <MlsIdxNotice />
    </section>
  );
}
