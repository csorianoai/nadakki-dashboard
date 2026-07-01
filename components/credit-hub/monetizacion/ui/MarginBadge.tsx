"use client";

import type { MarginStatus } from "./types";

type Props = {
  value: string;
  status: MarginStatus;
};

export function MarginBadge({ value, status }: Props) {
  return <span className={`fm-ui-margin-badge fm-ui-margin-badge--${status}`}>{value}</span>;
}
