import {
  groupHearingsByDay,
  humanizeToken,
  formatHearingDate,
} from "@/lib/legal/hearings/hearings-format";
import type { HearingOut } from "@/lib/legal/hearings/hearings-types";

function h(id: string, date: string): HearingOut {
  return {
    id,
    tenant_id: "t",
    case_id: null,
    external_ref: null,
    title: `H ${id}`,
    description: null,
    hearing_type: "AUDIENCIA_FONDO",
    status: "SCHEDULED",
    hearing_date: date,
    duration_minutes: 60,
    location: null,
    courtroom: null,
    judge_name: null,
    jurisdiction: "DO",
    timezone: "UTC",
    assigned_to_user_id: null,
    notes: null,
    created_by: "u",
    updated_by: null,
    created_at: date,
    updated_at: date,
  };
}

describe("hearings-format", () => {
  it("humanizeToken turns enum tokens into readable labels", () => {
    expect(humanizeToken("AUDIENCIA_FONDO")).toBe("Audiencia Fondo");
    expect(humanizeToken("")).toBe("—");
  });

  it("formatHearingDate falls back gracefully on invalid input", () => {
    expect(formatHearingDate("")).toBe("—");
    expect(formatHearingDate("not-a-date")).toBe("not-a-date");
  });

  it("groupHearingsByDay buckets hearings by calendar day, sorted ascending", () => {
    const groups = groupHearingsByDay([
      h("a", "2026-07-02T10:00:00Z"),
      h("b", "2026-07-01T09:00:00Z"),
      h("c", "2026-07-01T15:00:00Z"),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].dayKey).toBe("2026-07-01");
    expect(groups[0].items.map((x) => x.id)).toEqual(["b", "c"]);
    expect(groups[1].dayKey).toBe("2026-07-02");
  });
});
