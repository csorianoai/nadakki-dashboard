"use client";

import type { FmAccent } from "./types";
import { textAccentClass } from "./types";

type Props = {
  time: string;
  type: string;
  text: string;
  amount?: string;
  tone?: FmAccent;
};

export function EventTapeRow({ time, type, text, amount, tone = "green" }: Props) {
  return (
    <div className="fm-ui-tape-row">
      <span className="fm-ui-tape-time">{time}</span>
      <span className={`fm-ui-tape-tag ${textAccentClass(tone)}`}>{type}</span>
      <span className="fm-ui-tape-text">{text}</span>
      <span className="fm-ui-tape-amount">{amount ?? "—"}</span>
    </div>
  );
}
