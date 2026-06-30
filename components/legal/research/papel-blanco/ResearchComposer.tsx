"use client";

import { Lock } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  maxChars: number;
};

export function ResearchComposer({ value, onChange, onSubmit, disabled, maxChars }: Props) {
  return (
    <footer className="lr-composer" data-noprint>
      <div className="lr-composer-inner">
        <div className="lr-composer-field">
          <Lock size={16} strokeWidth={1.9} color="#7e91a8" aria-hidden />
          <textarea
            id="legal-research-input"
            aria-label="Escribe tu consulta legal"
            placeholder="Escribe tu consulta legal…"
            rows={1}
            maxLength={maxChars}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
              if (e.key === "Escape") onChange("");
            }}
          />
        </div>
        <button type="button" className="lr-btn-consultar" disabled={disabled || !value.trim()} onClick={onSubmit}>
          Consultar
        </button>
      </div>
    </footer>
  );
}
