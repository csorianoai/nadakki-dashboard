"use client";

import type { FmAccent, MarginStatus } from "./types";
import { MarginBadge } from "./MarginBadge";
import { tenantInitialClass } from "./types";

type Props = {
  name: string;
  initials: string;
  accent: FmAccent;
  kind: string;
  model: string;
  gmv: string;
  revenue: string;
  cost: string;
  margin: string;
  status: MarginStatus;
};

export function TenantRow({
  name,
  initials,
  accent,
  kind,
  model,
  gmv,
  revenue,
  cost,
  margin,
  status,
}: Props) {
  return (
    <div className="fm-ui-tenant-row">
      <div className="fm-ui-tenant-name">
        <span className={`fm-ui-tenant-initial ${tenantInitialClass(accent)}`}>{initials}</span>
        {name}
      </div>
      <span className="fm-ui-tenant-mono">{kind}</span>
      <span className="fm-ui-tenant-mono">{model}</span>
      <span className="fm-ui-tenant-mono">{gmv}</span>
      <span className="fm-ui-tenant-mono">{revenue}</span>
      <span className="fm-ui-tenant-mono">{cost}</span>
      <MarginBadge value={margin} status={status} />
    </div>
  );
}
