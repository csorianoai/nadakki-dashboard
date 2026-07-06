import { S } from "@/lib/nauta/strings";

export type PisoMode = "dept" | "estado" | "planes";

export function SegmentedControl({
  mode,
  onChange,
}: {
  mode: PisoMode;
  onChange: (mode: PisoMode) => void;
}) {
  return (
    <div className="seg" role="tablist" aria-label="Agrupación del piso">
      <button type="button" role="tab" className={mode === "dept" ? "on" : ""} onClick={() => onChange("dept")}>
        {S.seg.byDept}
      </button>
      <button type="button" role="tab" className={mode === "estado" ? "on" : ""} onClick={() => onChange("estado")}>
        {S.seg.byStatus}
      </button>
      <button type="button" role="tab" className={mode === "planes" ? "on" : ""} onClick={() => onChange("planes")}>
        {S.seg.asPlans}
      </button>
    </div>
  );
}
