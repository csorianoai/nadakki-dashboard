"use client";

import type { FmAccent } from "./types";
import { textAccentClass } from "./types";

type Props = {
  code: string;
  name: string;
  desc: string;
  selected: boolean;
  onSelect: () => void;
  accent?: FmAccent;
  flag?: string;
};

export function ModelCard({ code, name, desc, selected, onSelect, accent = "green", flag }: Props) {
  return (
    <button
      type="button"
      className={`fm-ui-model-card${selected ? " fm-ui-model-card--selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className={`fm-ui-model-code ${textAccentClass(accent)}`}>{code}</div>
      <div className="fm-ui-model-name">{name}</div>
      <div className="fm-ui-model-desc">{desc}</div>
      {flag ? <span className="fm-ui-model-flag">{flag}</span> : null}
    </button>
  );
}
