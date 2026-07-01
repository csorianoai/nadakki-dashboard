"use client";

type Props = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
};

export function BpsStepper({ value, min = 5, max = 150, step = 5, onChange }: Props) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <div className="fm-ui-bps-stepper">
      <button type="button" className="fm-ui-bps-btn" onClick={dec} aria-label="Reducir bps">
        −
      </button>
      <span className="fm-ui-bps-value">{value} bps</span>
      <button type="button" className="fm-ui-bps-btn" onClick={inc} aria-label="Aumentar bps">
        +
      </button>
    </div>
  );
}
