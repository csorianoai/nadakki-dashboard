"use client";

import { PenLine } from "lucide-react";

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
          <PenLine size={16} strokeWidth={1.9} color="#d9b46a" aria-hidden />
          <textarea
            id="legal-research-input"
            aria-label="Escribe tu consulta legal"
            placeholder="Escribe aquí lo que quieres investigar: hechos, pregunta, norma o plazo…"
            rows={2}
            autoFocus
            className="placeholder:!text-[#b9c6d8]"
            maxLength={maxChars}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              // L2a: Enter envía; Shift+Enter hace salto de línea (y no durante composición IME).
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (!disabled && value.trim()) onSubmit();
              }
              if (e.key === "Escape") onChange("");
            }}
          />
        </div>
        <button type="button" className="lr-btn-consultar" disabled={disabled || !value.trim()} onClick={onSubmit}>
          Consultar
        </button>
      </div>
      <p className="mx-auto mt-2 max-w-[880px] text-[11.5px] text-[#9fb0c6]">
        Pregunta lo que necesites con tus palabras. Enter envía; Mayús + Enter salta de línea.
        Los ejemplos de arriba son solo atajos.
      </p>
    </footer>
  );
}
