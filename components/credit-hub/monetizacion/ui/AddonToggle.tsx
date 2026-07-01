"use client";

type Props = {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function AddonToggle({ label, desc, checked, onChange }: Props) {
  return (
    <label className="fm-ui-addon">
      <span className={`fm-ui-addon-check${checked ? " fm-ui-addon-check--on" : ""}`} aria-hidden>
        {checked ? "✓" : ""}
      </span>
      <span>
        <div style={{ fontWeight: 600, color: "var(--fm-ink)", fontSize: 13 }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--fm-sub)", marginTop: 2 }}>{desc}</div>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
    </label>
  );
}
